# Backend — Model & Run Instructions

This document explains how to run the Flask backend with a real model (so it does not run in "mock" mode).

Prerequisites
- Python 3.8+ installed
- A virtual environment (recommended)
- On Windows: PowerShell is available

1) Create & activate a virtual environment

PowerShell (from `Backend/` folder):
```powershell
python -m venv myenv
.\myenv\Scripts\Activate.ps1
```

2) Install requirements

The `requirements.txt` includes Flask, Pillow, and other base deps. PyTorch is optional and must be installed according to your platform.

Install base requirements:
```powershell
pip install -r requirements.txt
```

Install PyTorch & torchvision (CPU-only example)
```powershell
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

If you want CUDA-enabled wheels, visit https://pytorch.org/get-started/locally/ and choose the right command for your GPU and Python version.

3) Provide a model checkpoint

The backend looks for a model file by these options (in order):
- Environment variable `MODEL_PATH` (preferred)
- `best_plant_vision_model.pth` in this `Backend/` folder

Place your checkpoint file (for example `best_plant_vision_model.pth`) into `Backend/` or set `MODEL_PATH` to the full path.

4) Run the backend

From the `Backend/` folder (PowerShell):

- Using the helper script (recommended):
```powershell
# optional: pass model path as first argument
.\run_backend.ps1 "C:\full\path\to\best_plant_vision_model.pth"
```

- Or manually:
```powershell
# set MODEL_PATH only if your file is outside the Backend folder
$env:MODEL_PATH = "C:\full\path\to\best_plant_vision_model.pth"
python .\app.py
```

When the model loads successfully you should see log output indicating the model file was found and loaded. If you see `No model file found; continuing in mock mode`, the backend did not locate a checkpoint or `torch` is missing.

5) Test the `/analyze` endpoint

Using `curl` (from host machine):
```powershell
curl -X POST "http://127.0.0.1:5000/analyze" -F "file=@tests/image.png"
```

Using the included test script (from `Backend/`):
```powershell
python tests/test_predict.py tests/image.png
```

6) Notes for mobile testing (Expo / device)

- If you test from a physical device, use your machine's LAN IP (e.g. `http://192.168.1.123:5000`) and ensure Windows Firewall allows inbound connections on port 5000.
- Update the frontend `BACKEND_URL` (in `src/app/(tab)/camera.tsx`) to point to your machine IP so the app can reach the backend.

Troubleshooting
- If the server prints `PyTorch not available` — ensure PyTorch was installed into the same Python environment used to run the server.
- If you have a model file and the server still reports `No model file found`, either set `MODEL_PATH` or place the checkpoint into the `Backend/` folder and restart the server.

If you want, I can help by:
- Attempting to install the correct PyTorch wheel (I need permission to run commands in your environment).
- Verifying logs after you run the run script and helping debug any remaining issues.

---

Created to help get the backend out of mock mode and returning real predictions.

---

## User Management (Register/Login)

Users are stored in `Backend/users.json`. If you see `409 (CONFLICT)` on `/auth/register`, that phone is already registered.

Quick options:
- Edit `users.json` manually to remove or change the phone.
- Use the helper script:

```powershell
# From Backend/ (env activated)
python tools/users_admin.py list
python tools/users_admin.py remove --phone 6203608218
python tools/users_admin.py reset
```

After changing users, retry registration or login from the app.
