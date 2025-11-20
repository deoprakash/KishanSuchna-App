"""Merged backend: prediction endpoints, MRP, and notifications.

This file centralizes model loading and provides two prediction endpoints
for compatibility: `/predict` and `/analyze` (they perform the same work).
If PyTorch is not installed or no model file is found, the server returns
mocked predictions so the mobile app can continue to work during development.
"""

import os
import io
import time
import base64
import logging
from typing import Optional
import uuid
from dotenv import load_dotenv

import requests
from flask import Flask, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS
from PIL import Image
from flask import send_from_directory
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError

# Load environment variables
load_dotenv()

# Cloudinary configuration
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_UPLOAD_PRESET = os.getenv("CLOUDINARY_UPLOAD_PRESET")

try:
    import torch
    from torch import nn
    from torchvision import transforms, models
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False

LOGGER = logging.getLogger("backend")
logging.basicConfig(level=logging.INFO)


# ------------------ Model (EfficientNet) ------------------
if TORCH_AVAILABLE:
    class EfficientNetWithMixup(nn.Module):
        def __init__(self, num_classes):
            super(EfficientNetWithMixup, self).__init__()
            self.backbone = models.efficientnet_b0(weights=None)
            in_features = self.backbone.classifier[1].in_features
            self.backbone.classifier[1] = nn.Linear(in_features, num_classes)

        def forward(self, x):
            return self.backbone(x)


# Class names for the training dataset (must match the model ordering)
class_names = [
    "Apple___Apple_scab","Apple___Black_rot","Apple___Cedar_apple_rust","Apple___healthy",
    "Blueberry___healthy","Cherry_(including_sour)___Powdery_mildew","Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot","Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight","Corn_(maize)___healthy","Grape___Black_rot",
    "Grape___Esca_(Black_Measles)","Grape___Leaf_blight_(Isariopsis_Leaf_Spot)","Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)","Peach___Bacterial_spot","Peach___healthy",
    "Pepper,_bell___Bacterial_spot","Pepper,_bell___healthy","Potato___Early_blight","Potato___Late_blight",
    "Potato___healthy","Raspberry___healthy","Soybean___healthy","Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch","Strawberry___healthy","Tomato___Bacterial_spot","Tomato___Early_blight",
    "Tomato___Late_blight","Tomato___Leaf_Mold","Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite","Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus","Tomato___Tomato_mosaic_virus","Tomato___healthy"
]


MODEL = None
DEVICE = "cuda" if TORCH_AVAILABLE and torch.cuda.is_available() else "cpu"

def try_load_model(model_path: Optional[str] = None):
    """Load the model strictly from MODEL_PATH in .env."""
    global MODEL
    LOGGER.info("try_load_model called - current MODEL=%s, TORCH_AVAILABLE=%s", MODEL, TORCH_AVAILABLE)

    if MODEL is not None:
        return MODEL

    if not TORCH_AVAILABLE:
        LOGGER.warning("PyTorch not available — running in mock mode")
        return None

    # ------------------------------
    # 🔥 ONLY READ FROM .env
    # ------------------------------
    model_path = os.getenv("MODEL_PATH")
    if not model_path:
        LOGGER.error("MODEL_PATH not set in .env")
        return None

    # Resolve absolute path relative to this file
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, model_path)

    LOGGER.info(f"Resolved MODEL_PATH: {model_path}")

    if not os.path.isfile(model_path):
        LOGGER.error(f"Model file not found at: {model_path}")
        return None

    # ------------------------------
    # 🔥 LOAD MODEL
    # ------------------------------
    try:
        LOGGER.info("Loading model from %s", model_path)
        state = torch.load(model_path, map_location=DEVICE)

        model = EfficientNetWithMixup(num_classes=len(class_names)).to(DEVICE)

        if isinstance(state, dict) and "state_dict" in state:
            model.load_state_dict(state["state_dict"])
        else:
            model.load_state_dict(state)

        model.eval()
        MODEL = model
        LOGGER.info("Model loaded successfully on %s", DEVICE)
        return MODEL

    except Exception:
        LOGGER.exception("Failed to load model — fallback to mock")
        MODEL = None
        return None


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
]) if TORCH_AVAILABLE else None


def pil_from_file_storage(f) -> Image.Image:
    return Image.open(f.stream).convert("RGB")


def pil_from_bytes(b: bytes) -> Image.Image:
    return Image.open(io.BytesIO(b)).convert("RGB")


def predict_image(img: Image.Image):
    """Perform inference with the model or return a mock prediction."""
    LOGGER.info("predict_image called - TORCH_AVAILABLE=%s, MODEL global=%s", TORCH_AVAILABLE, MODEL)
    model = try_load_model()
    LOGGER.info("predict_image: after try_load_model - model_present=%s, TORCH_AVAILABLE=%s", bool(model is not None), TORCH_AVAILABLE)
    if model is None or not TORCH_AVAILABLE:
        # Model is not available; return a neutral mock response so the client
        # knows inference could not be performed locally. Clients should handle
        # `mock: true` and optionally show a friendly message.
        LOGGER.warning("Returning mock response - model=%s, torch=%s", model, TORCH_AVAILABLE)
        return {"prediction": None, "confidence": 0.0, "mock": True, "message": "model_unavailable"}

    try:
        tensor = transform(img).unsqueeze(0).to(DEVICE)
        with torch.no_grad():
            outputs = model(tensor)
            probs = torch.nn.functional.softmax(outputs, dim=1)[0]
            pred_idx = int(torch.argmax(probs).item())
            confidence = float(probs[pred_idx].item() * 100.0)
            label = class_names[pred_idx] if pred_idx < len(class_names) else str(pred_idx)
            print(label)
            return {"prediction": label, "confidence": round(confidence, 2), "mock": False}
    except Exception:
        LOGGER.exception("Inference failed — returning mock")
        return {"prediction": None, "confidence": 0.0, "mock": True, "message": "inference_error"}


# ------------------ Flask app ------------------
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ------------------ MongoDB Setup ------------------
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    LOGGER.error("MONGO_URI not found in environment variables")
    MONGO_AVAILABLE = False
    mongo_client = None
    users_collection = None
    commodity_collection = None
    listings_collection = None
    inquiries_collection = None
else:
    try:
        mongo_client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        mongo_client.admin.command('ping')
        LOGGER.info("MongoDB connected successfully")
        
        # Get databases
        users_db = mongo_client["kishan_suchna_users"]
        main_db = mongo_client["kishan_suchna_main"]
        
        # Get collections
        users_collection = users_db["users"]
        commodity_collection = main_db["commodity"]
        listings_collection = main_db["listings"]
        inquiries_collection = main_db["inquiries"]
        
        # Create unique index on phone number for users
        users_collection.create_index("phone", unique=True)
        
        MONGO_AVAILABLE = True
    except Exception as e:
        LOGGER.error("MongoDB connection failed: %s", e)
        MONGO_AVAILABLE = False
        mongo_client = None
        users_collection = None
        commodity_collection = None
        listings_collection = None
        inquiries_collection = None


@app.after_request
def add_cors_headers(response):
    response.headers.setdefault("Access-Control-Allow-Origin", "*")
    response.headers.setdefault("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.setdefault("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "torch": TORCH_AVAILABLE})


def _get_image_from_request():
    # Accept 'file' or 'image' as multipart file, or JSON image_b64
    if "file" in request.files or "image" in request.files:
        key = "file" if "file" in request.files else "image"
        try:
            img = pil_from_file_storage(request.files[key])
            return img, None
        except Exception:
            return None, (jsonify({"error": "invalid_image"}), 400)

    data = request.get_json(silent=True) or {}
    b64 = data.get("image_b64")
    if not b64:
        return None, (jsonify({"error": "No image provided (file or image_b64)"}), 400)
    try:
        raw = base64.b64decode(b64)
        img = pil_from_bytes(raw)
        return img, None
    except Exception:
        return None, (jsonify({"error": "invalid_base64"}), 400)


@app.route("/predict", methods=["POST"])
@app.route("/analyze", methods=["POST"])
def predict():
    img, err = _get_image_from_request()
    if err:
        return err
    resp = predict_image(img)
    return jsonify(resp)


@app.route("/predict-debug", methods=["GET"])
def predict_debug():
    """Debug route: returns whether a model is currently loaded and torch availability."""
    model = try_load_model()
    return jsonify({"model_present": bool(model is not None), "torch": TORCH_AVAILABLE})


@app.route("/debug/routes", methods=["GET"])
def list_routes():
    """List all registered routes for quick debugging."""
    rules = []
    for rule in app.url_map.iter_rules():
        methods = sorted(m for m in rule.methods if m not in ("HEAD", "OPTIONS"))
        rules.append({"rule": str(rule), "endpoint": rule.endpoint, "methods": methods})
    rules.sort(key=lambda r: r["rule"])  # stable order
    return jsonify({"routes": rules})


# ------------------ MRP route ------------------
API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"


@app.route("/mrp-live", methods=["POST"])
def get_mrp_live():
    data = request.get_json() or {}
    crop = data.get("crop")
    if not crop:
        return jsonify({"error": "Please provide 'crop' in JSON body."}), 400

    params = {
        "api-key": API_KEY,
        "format": "json",
        "limit": 5,
        "filters[commodity]": crop
    }
    try:
        response = requests.get(API_URL, params=params, timeout=10)
        api_data = response.json()
        if "records" in api_data and len(api_data["records"]) > 0:
            record = api_data["records"][0]
            return jsonify({
                "commodity": record.get("commodity"),
                "state": record.get("state"),
                "district": record.get("district"),
                "market": record.get("market"),
                "date": record.get("arrival_date"),
                "min_price": record.get("min_price"),
                "max_price": record.get("max_price"),
                "modal_price": record.get("modal_price")
            })
        else:
            return jsonify({"error": f"No data found for {crop}"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ Notifications ------------------
# Store notifications per user phone number
user_notifications = {}


@app.route("/send-notification", methods=["POST"])
def send_notification():
    global user_notifications
    data = request.get_json() or {}
    target_phone = data.get("targetPhone")
    if not target_phone:
        return jsonify({"error": "targetPhone required"}), 400
    
    notification = {
        "id": str(int(time.time() * 1000)),
        "title": data.get("title", "Notification"),
        "message": data.get("message", ""),
        "duration": int(data.get("duration", 6))
    }
    user_notifications[target_phone] = notification
    app.logger.info("New notification for %s: %s", target_phone, notification)
    return jsonify({"status": "sent", "notification": notification})


@app.route("/get-notification", methods=["GET"])
def get_notification():
    global user_notifications
    user_phone = request.args.get("userPhone")
    if not user_phone:
        return jsonify({"error": "userPhone required"}), 400
    
    if user_phone in user_notifications:
        notification = user_notifications[user_phone]
        # Clear after retrieval
        del user_notifications[user_phone]
        return jsonify(notification)
    return jsonify({"message": "No notifications"}), 204


# ------------------ MongoDB User Store Auth ------------------
@app.route("/auth/register", methods=["POST"])
def auth_register():
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    data = request.get_json(force=True, silent=True) or {}
    full_name = data.get("fullName") or data.get("name")
    phone = data.get("phone")
    password = data.get("password")

    if not full_name or not phone or not password:
        return jsonify({"error": "fullName, phone, and password are required"}), 400

    if not str(phone).isdigit() or len(str(phone)) != 10:
        return jsonify({"error": "phone must be a 10-digit number"}), 400

    if len(password) < 6:
        return jsonify({"error": "password must be at least 6 characters"}), 400

    try:
        user = {
            "fullName": full_name,
            "phone": str(phone),
            "passwordHash": generate_password_hash(password),
            "createdAt": int(time.time())
        }
        users_collection.insert_one(user)
        
        # Remove MongoDB _id and passwordHash from response
        user.pop("_id", None)
        safe_user = {k: v for k, v in user.items() if k != "passwordHash"}
        return jsonify({"status": "registered", "user": safe_user}), 201
    except DuplicateKeyError:
        return jsonify({"error": "phone already registered"}), 409
    except Exception as e:
        LOGGER.exception("Registration failed")
        return jsonify({"error": "failed_to_persist"}), 500


@app.route("/auth/login", methods=["POST"])
def auth_login():
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    data = request.get_json(force=True, silent=True) or {}
    phone = str(data.get("phone") or "")
    password = data.get("password") or ""

    if not phone or not password:
        return jsonify({"error": "phone and password are required"}), 400

    try:
        user = users_collection.find_one({"phone": phone})
        if not user or not check_password_hash(user.get("passwordHash", ""), password):
            return jsonify({"error": "invalid_credentials"}), 401

        token = f"token_{phone}_{int(time.time())}"
        user.pop("_id", None)
        safe_user = {k: v for k, v in user.items() if k != "passwordHash"}
        return jsonify({"status": "ok", "token": token, "user": safe_user}), 200
    except Exception as e:
        LOGGER.exception("Login failed")
        return jsonify({"error": "login_failed"}), 500


@app.route("/auth/update", methods=["POST"])
def auth_update():
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    data = request.get_json(force=True, silent=True) or {}
    phone = str(data.get("phone") or "").strip()
    if not phone:
        return jsonify({"error": "phone required"}), 400

    try:
        user = users_collection.find_one({"phone": phone})
        if not user:
            return jsonify({"error": "user_not_found"}), 404

        full_name = data.get("fullName") or data.get("name")
        email = data.get("email")
        photo_b64 = data.get("profilePhotoB64")
        new_phone = str(data.get("newPhone") or "").strip()

        updates = {}
        if full_name is not None:
            updates["fullName"] = str(full_name)
        if email is not None:
            updates["email"] = str(email)

        # Handle phone change if requested
        if new_phone and new_phone != phone:
            if not new_phone.isdigit() or len(new_phone) != 10:
                return jsonify({"error": "newPhone must be a 10-digit number"}), 400
            
            # Check if new phone already exists
            if users_collection.find_one({"phone": new_phone}):
                return jsonify({"error": "newPhone already registered"}), 409

            old_phone = phone
            updates["phone"] = new_phone

            # Move avatar file if exists and update URL
            try:
                avatars_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
                old_path = os.path.join(avatars_dir, f"{old_phone}.jpg")
                new_path = os.path.join(avatars_dir, f"{new_phone}.jpg")
                if os.path.isfile(old_path):
                    os.makedirs(avatars_dir, exist_ok=True)
                    if os.path.isfile(new_path):
                        try:
                            os.remove(new_path)
                        except Exception:
                            pass
                    os.replace(old_path, new_path)
                    updates["profilePhotoUrl"] = f"/uploads/avatars/{new_phone}.jpg"
                else:
                    if user.get("profilePhotoUrl"):
                        updates["profilePhotoUrl"] = f"/uploads/avatars/{new_phone}.jpg"
            except Exception:
                LOGGER.exception("Failed migrating avatar on phone change")

            # Update references in listings and inquiries
            try:
                commodity_collection.update_many(
                    {"ownerPhone": old_phone},
                    {"$set": {"ownerPhone": new_phone}}
                )
            except Exception:
                LOGGER.exception("Failed updating listings on phone change")

            try:
                inquiries_collection.update_many(
                    {"requesterPhone": old_phone},
                    {"$set": {"requesterPhone": new_phone}}
                )
            except Exception:
                LOGGER.exception("Failed updating inquiries on phone change")

            # Migrate any pending notifications key in memory
            try:
                global user_notifications
                if old_phone in user_notifications and new_phone not in user_notifications:
                    user_notifications[new_phone] = user_notifications.pop(old_phone)
            except Exception:
                LOGGER.exception("Failed migrating notifications on phone change")

        # Save avatar if provided
        if photo_b64:
            try:
                # Upload to Cloudinary
                if CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET:
                    upload_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
                    image_data = base64.b64decode(photo_b64.split(",")[-1])
                    
                    files = {'file': ('profile.jpg', image_data, 'image/jpeg')}
                    data = {
                        'upload_preset': CLOUDINARY_UPLOAD_PRESET,
                        'folder': 'profiles'
                    }
                    
                    response = requests.post(upload_url, files=files, data=data)
                    if response.status_code == 200:
                        result = response.json()
                        updates["profilePhotoUrl"] = result.get("secure_url")
                    else:
                        LOGGER.error("Cloudinary upload failed: %s", response.text)
                        return jsonify({"error": "photo_upload_failed"}), 500
                else:
                    # Fallback to local storage
                    raw = base64.b64decode(photo_b64.split(",")[-1])
                    avatars_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
                    os.makedirs(avatars_dir, exist_ok=True)
                    target_phone = updates.get("phone") or phone
                    file_path = os.path.join(avatars_dir, f"{target_phone}.jpg")
                    with open(file_path, "wb") as f:
                        f.write(raw)
                    updates["profilePhotoUrl"] = f"/uploads/avatars/{target_phone}.jpg"
            except Exception:
                LOGGER.exception("Failed saving profile photo")
                return jsonify({"error": "invalid_photo"}), 400

        # Apply updates to database
        if updates:
            users_collection.update_one({"phone": phone}, {"$set": updates})
        
        # Fetch updated user
        updated_user = users_collection.find_one({"phone": updates.get("phone") or phone})
        updated_user.pop("_id", None)
        safe_user = {k: v for k, v in updated_user.items() if k != "passwordHash"}
        return jsonify({"status": "ok", "user": safe_user}), 200
        
    except Exception as e:
        LOGGER.exception("Update failed")
        return jsonify({"error": "update_failed"}), 500


@app.route('/uploads/avatars/<path:filename>', methods=['GET'])
def serve_avatar(filename):
    avatars_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
    return send_from_directory(avatars_dir, filename)


@app.route('/uploads/listings/<path:filename>', methods=['GET'])
def serve_listing_photo(filename):
    listings_dir = os.path.join(os.path.dirname(__file__), "uploads", "listings")
    return send_from_directory(listings_dir, filename)


# ------------------ Market Listings (MongoDB) ------------------
@app.route("/market/listings", methods=["GET", "POST"])
@app.route("/market/listings/", methods=["GET", "POST"])  # accept trailing slash
def market_listings():
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    if request.method == "GET":
        try:
            arr = list(commodity_collection.find().sort("createdAt", -1))
            # Remove MongoDB _id from results
            for item in arr:
                item.pop("_id", None)
            return jsonify({"listings": arr})
        except Exception as e:
            LOGGER.exception("Failed to fetch listings")
            return jsonify({"error": "fetch_failed"}), 500

    # POST
    data = request.get_json(force=True, silent=True) or {}
    commodity = (data.get("commodity") or "").strip()
    quantity = str(data.get("quantity") or "0").strip()
    price = str(data.get("price") or "0").strip()
    ltype = (data.get("type") or "sell").strip()
    owner_phone = (data.get("ownerPhone") or "").strip() or None
    photo_b64 = data.get("photoB64")
    existing_photo_url = data.get("existingPhotoUrl")

    if not commodity:
        return jsonify({"error": "commodity_required"}), 400
    if ltype not in ("sell", "rent"):
        return jsonify({"error": "invalid_type"}), 400

    listing_id = uuid.uuid4().hex
    listing = {
        "id": listing_id,
        "commodity": commodity,
        "quantity": quantity,
        "price": price,
        "type": ltype,
        "createdAt": int(time.time() * 1000),
        "ownerPhone": owner_phone,
    }

    # Save photo if provided
    if photo_b64:
        try:
            # Upload to Cloudinary
            if CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET:
                upload_url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/image/upload"
                image_data = base64.b64decode(photo_b64.split(",")[-1])
                
                files = {'file': ('commodity.jpg', image_data, 'image/jpeg')}
                data = {
                    'upload_preset': CLOUDINARY_UPLOAD_PRESET,
                    'folder': 'commodities'
                }
                
                response = requests.post(upload_url, files=files, data=data)
                if response.status_code == 200:
                    result = response.json()
                    listing["photoUrl"] = result.get("secure_url")
                else:
                    LOGGER.error("Cloudinary upload failed: %s", response.text)
            else:
                # Fallback to local storage
                raw = base64.b64decode(photo_b64.split(",")[-1])
                listings_dir = os.path.join(os.path.dirname(__file__), "uploads", "listings")
                os.makedirs(listings_dir, exist_ok=True)
                file_path = os.path.join(listings_dir, f"{listing_id}.jpg")
                with open(file_path, "wb") as f:
                    f.write(raw)
                listing["photoUrl"] = f"/uploads/listings/{listing_id}.jpg"
        except Exception:
            LOGGER.exception("Failed saving listing photo")
            # Continue without photo
    elif existing_photo_url:
        listing["photoUrl"] = existing_photo_url

    try:
        commodity_collection.insert_one(listing.copy())
        listing.pop("_id", None)
        return jsonify({"status": "ok", "listing": listing}), 201
    except Exception as e:
        LOGGER.exception("Failed to create listing")
        return jsonify({"error": "failed_to_persist"}), 500


@app.route("/market/listings/<listing_id>", methods=["DELETE"])
@app.route("/market/listings/<listing_id>/", methods=["DELETE"])  # accept trailing slash
def market_delete_listing(listing_id):
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    # ownerPhone can be in query or JSON body
    owner_phone = request.args.get("ownerPhone")
    if not owner_phone:
        data = request.get_json(silent=True) or {}
        owner_phone = data.get("ownerPhone")
    if not owner_phone:
        return jsonify({"error": "ownerPhone_required"}), 400

    try:
        match = commodity_collection.find_one({"id": listing_id})
        if not match:
            return jsonify({"error": "not_found"}), 404
        if (match.get("ownerPhone") or "") != str(owner_phone):
            return jsonify({"error": "forbidden"}), 403

        commodity_collection.delete_one({"id": listing_id})
        return jsonify({"status": "deleted", "id": listing_id}), 200
    except Exception as e:
        LOGGER.exception("Failed to delete listing")
        return jsonify({"error": "delete_failed"}), 500


@app.route("/market/inquiries", methods=["GET", "POST"])
@app.route("/market/inquiries/", methods=["GET", "POST"])
def market_inquiries():
    if not MONGO_AVAILABLE:
        return jsonify({"error": "database_unavailable"}), 503
        
    if request.method == "GET":
        try:
            arr = list(inquiries_collection.find().sort("ts", -1))
            # Remove MongoDB _id from results
            for item in arr:
                item.pop("_id", None)
            return jsonify({"inquiries": arr})
        except Exception as e:
            LOGGER.exception("Failed to fetch inquiries")
            return jsonify({"error": "fetch_failed"}), 500

    # POST - create inquiry
    data = request.get_json(force=True, silent=True) or {}
    listing_id = data.get("listingId")
    requester_phone = data.get("requesterPhone")
    requester_name = data.get("requesterName")

    if not listing_id or not requester_phone:
        return jsonify({"error": "listingId and requesterPhone required"}), 400

    inquiry = {
        "id": uuid.uuid4().hex,
        "listingId": listing_id,
        "requesterPhone": requester_phone,
        "requesterName": requester_name or "User",
        "ts": int(time.time() * 1000)
    }

    try:
        inquiries_collection.insert_one(inquiry.copy())
        inquiry.pop("_id", None)
        return jsonify({"status": "ok", "inquiry": inquiry}), 201
    except Exception as e:
        LOGGER.exception("Failed to create inquiry")
        return jsonify({"error": "failed_to_persist"}), 500


if __name__ == "__main__":
    try_load_model()
    app.run(host="0.0.0.0", port=5000, debug=False)

