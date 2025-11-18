# Backend (Flask) for image analysis

This repository includes a minimal Flask backend `app.py` that exposes:

- `GET /health` — quick liveness check
- `POST /analyze` — accepts an image (multipart `image` file or JSON `{ "image_b64": "..." }`) and returns detections.

Behavior:

- If a model file like `model.pth` is present and `torch` is installed, the server will attempt to load it.
- If no model is present (or loading fails), the server returns a mocked detection (e.g., `tomato_mosaic_virus`).

Quick start (Windows PowerShell):

```powershell
python -m pip install -r requirements.txt
# (optional) pip install torch torchvision  # only if you plan to load a PyTorch model
python app.py
```

Example curl (multipart file):

```bash
curl -X POST -F "image=@/path/to/photo.jpg" http://localhost:5000/analyze
```

Example curl (base64 JSON):

```bash
IMG_B64=$(base64 -w 0 /path/to/photo.jpg)
curl -X POST -H "Content-Type: application/json" -d "{ \"image_b64\": \"$IMG_B64\" }" http://localhost:5000/analyze
```

Notes:
- If you add a heavy native dependency like `torch` in a native/bare project, you may need to install a matching binary for your platform.
- This backend is intentionally generic; if you have a specific model architecture, we can adapt `analyze_image_with_model` to convert and run it.
