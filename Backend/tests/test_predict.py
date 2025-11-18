#!/usr/bin/env python3
"""
Simple test script to POST an image to the backend `/predict` endpoint.

Usage:
  python test_predict.py /path/to/photo.jpg

By default it posts to http://127.0.0.1:5000/predict but you can override
with `--url`.
"""

import argparse
import json
import os
import sys

import requests


def main():
    parser = argparse.ArgumentParser(description="Test client for Backend /predict")
    parser.add_argument("image", nargs="?", default="test.jpg", help="Path to image file to send")
    parser.add_argument("--url", default="http://127.0.0.1:5000/predict", help="Backend predict URL")
    args = parser.parse_args()

    if not os.path.isfile(args.image):
        print(f"Image not found: {args.image}")
        print("Place an image at that path or pass the path as the first argument.")
        sys.exit(2)

    print(f"Posting {args.image} to {args.url} ...")
    with open(args.image, "rb") as fh:
        files = {"file": (os.path.basename(args.image), fh, "image/jpeg")}
        try:
            resp = requests.post(args.url, files=files, timeout=30)
        except Exception as e:
            print("Request failed:", e)
            sys.exit(1)

    print("Status:", resp.status_code)
    try:
        body = resp.json()
        print(json.dumps(body, indent=2))
    except Exception:
        print("Non-JSON response:")
        print(resp.text)


if __name__ == "__main__":
    main()
