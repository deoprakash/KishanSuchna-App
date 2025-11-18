import json
import os
import sys
from typing import List, Dict

ROOT = os.path.dirname(os.path.dirname(__file__))
USERS_PATH = os.path.join(ROOT, "users.json")


def load_users() -> List[Dict]:
    if not os.path.isfile(USERS_PATH):
        return []
    with open(USERS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_users(users: List[Dict]):
    with open(USERS_PATH, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)


def list_users():
    users = load_users()
    for u in users:
        print(f"- {u.get('fullName','?')}  phone={u.get('phone','?')}  createdAt={u.get('createdAt','?')}")
    if not users:
        print("(no users)")


def remove_user(phone: str):
    users = load_users()
    before = len(users)
    users = [u for u in users if str(u.get("phone")) != str(phone)]
    after = len(users)
    save_users(users)
    print(f"Removed {before - after} user(s) with phone {phone}")


def reset_users():
    save_users([])
    print("Users list cleared.")


def main():
    if len(sys.argv) < 2:
        print("Usage: python tools/users_admin.py [list|remove|reset] [--phone <digits>]")
        return 2
    cmd = sys.argv[1]
    if cmd == "list":
        list_users()
        return 0
    if cmd == "remove":
        if "--phone" not in sys.argv:
            print("Usage: python tools/users_admin.py remove --phone 1234567890")
            return 2
        phone = sys.argv[sys.argv.index("--phone") + 1]
        remove_user(phone)
        return 0
    if cmd == "reset":
        reset_users()
        return 0
    print("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
