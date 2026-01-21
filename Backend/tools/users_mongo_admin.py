import os
import sys
import time
from typing import List, Dict

from dotenv import load_dotenv
from pymongo import MongoClient
from werkzeug.security import generate_password_hash


def get_users_collection():
    load_dotenv()
    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        print("MONGO_URI not set in environment or .env")
        return None
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return None

    users_db = client["kishan_suchna_users"]
    return users_db["users"]


def list_users():
    coll = get_users_collection()
    if coll is None:
        return 2
    try:
        for u in coll.find({}, {"passwordHash": 0}).sort("createdAt", -1):
            name = u.get("fullName") or u.get("name") or "?"
            phone = u.get("phone") or "?"
            created = u.get("createdAt") or "?"
            print(f"- {name}  phone={phone}  createdAt={created}")
        return 0
    except Exception as e:
        print(f"Failed to list users: {e}")
        return 2


def remove_user(phone: str):
    coll = get_users_collection()
    if coll is None:
        return 2
    try:
        res = coll.delete_many({"phone": str(phone).strip()})
        print(f"Removed {res.deleted_count} user(s) with phone {phone}")
        return 0
    except Exception as e:
        print(f"Failed to remove user: {e}")
        return 2


def reset_users():
    coll = get_users_collection()
    if coll is None:
        return 2
    try:
        res = coll.delete_many({})
        print(f"Cleared users collection, removed {res.deleted_count} document(s)")
        return 0
    except Exception as e:
        print(f"Failed to reset users: {e}")
        return 2


def add_user(phone: str, password: str, full_name: str = "Test User"):
    coll = get_users_collection()
    if coll is None:
        return 2
    try:
        doc = {
            "fullName": full_name,
            "phone": str(phone).strip(),
            "passwordHash": generate_password_hash(password),
            "createdAt": int(time.time()),
        }
        coll.insert_one(doc)
        print(f"Inserted user phone={doc['phone']} name='{doc['fullName']}'")
        return 0
    except Exception as e:
        print(f"Failed to add user: {e}")
        return 2


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/users_mongo_admin.py [list|remove|reset|add|add-default] [--phone <digits>] [--password <pwd>] [--name <full name>]")
        return 2
    cmd = sys.argv[1]
    if cmd == "list":
        return list_users()
    if cmd == "remove":
        if "--phone" not in sys.argv:
            print("Usage: python tools/users_mongo_admin.py remove --phone 1234567890")
            return 2
        phone = sys.argv[sys.argv.index("--phone") + 1]
        return remove_user(phone)
    if cmd == "reset":
        return reset_users()
    if cmd == "add":
        if "--phone" not in sys.argv or "--password" not in sys.argv:
            print("Usage: python tools/users_mongo_admin.py add --phone 1234567890 --password MyPass [--name 'Full Name']")
            return 2
        phone = sys.argv[sys.argv.index("--phone") + 1]
        password = sys.argv[sys.argv.index("--password") + 1]
        if "--name" in sys.argv:
            name = sys.argv[sys.argv.index("--name") + 1]
        else:
            name = "Test User"
        return add_user(phone, password, name)
    if cmd == "add-default":
        return add_user("9876543210", "Admin", "Default User")
    print("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
