**KishanSuchna — Project Overview**

This repository contains a simple mobile marketplace app (frontend) and a Python Flask backend that supports user accounts, profile photos, commodity listings, and a basic prediction endpoint. This README explains, in plain language, what each part does, how data and images flow, and the common tasks you (or a non-technical user) may want to know.

**Audience:** Non-technical users, product owners, and new contributors who want to understand how the app works.

**Contents:**
- **Overview:** short, plain-language summary of the system.
- **How it works:** user flows (register, profile, create listing, ask for item) and how images/data are stored.
- **Components:** what the frontend, backend, database, cloudinary, and CI/CD do.
- **Quick checks:** how to confirm the app is working (non-technical steps).
- **Deployment & troubleshooting:** simple instructions and what to ask your developer or support.
- **Environment variables & where to change the backend URL.**

**Overview**
- **Mobile App (Frontend):** Built with Expo (React Native). The mobile app shows listings, lets users sign up, edit their profile (including uploading a photo), and create commodity listings (with image, quantity and price).
- **Backend (Server):** A Flask (Python) app that receives requests from the mobile app. It stores users and listings in a cloud database and uploads images to Cloudinary (a service that hosts images and returns public URLs).
- **Database:** MongoDB Atlas is used for storing users, listings and inquiries.
- **Image hosting:** Cloudinary stores user profile photos and commodity images. If Cloudinary isn't configured, images are saved on the server as a fallback.
- **CI/CD:** GitHub Actions is used to deploy the backend to Microsoft Azure App Service (optional — only when configured by the developer/team).

**High-level user workflows**
- **Sign Up / Login**
  - User registers with full name, phone number and password. Passwords are stored securely (hashed) — meaning the actual password is not saved in plain text.
  - On login the server checks the phone and password and returns a small token the app can use as a session identifier.

- **Profile Photo (Update)**
  - From the Profile screen the user can take or choose a photo. The app sends the photo to the backend.
  - The backend uploads the photo to Cloudinary and stores the returned image URL in the user's record in the database.
  - The app displays the Cloudinary URL directly — no extra downloads are required.

- **Create Listing**
  - A user creates a commodity listing and optionally adds a photo, quantity and price.
  - The app sends the details and photo (as base64) to the backend.
  - The backend uploads the photo to Cloudinary and stores the listing (including the Cloudinary image URL) in MongoDB.
  - Listings are shown to all users with image, name, quantity, price, and owner information.

- **Request / Inquiry**
  - A user may send an inquiry (a request) about a listing. Inquiries are stored in the backend so the listing owner can view them.

**Where data and images live (simple map)**
- App (mobile) -> Backend (Flask) -> Database (MongoDB Atlas) — user/listing text and metadata
- App (mobile) -> Backend (Flask) -> Cloudinary — images (profile photos, listing photos)

Advantages of this setup:
- Cloudinary serves images quickly and gives a public URL that the app can display.
- MongoDB Atlas stores structured data (users, listings) and is accessible to the backend.

**Important files & locations**
- Frontend configuration for the backend URL: `src/config/backend.ts` — change the URL here if you point the app to another server.
- Backend main file: `Backend/app.py` — contains the server endpoints used by the mobile app.
- Backend environment file (local development): `Backend/.env` — stores sensitive values while developing locally (do not commit this file to public repositories).

**How to confirm basic health (non-technical)**
1. Open the backend public URL in a browser, e.g. `https://your-backend.example.com`. You should see some response from the server (a basic page or message).
2. Visit the backend health endpoint: `https://your-backend.example.com/health` — it should return a small JSON saying the server status is `ok`.
3. From the mobile app, try to register a new user and log in. If both succeed, the backend and frontend are communicating.

If any of the above fails, see the Troubleshooting section.

**Deployment & CI (short, non-technical explanation)**
- Developers use GitHub Actions to automatically send the current backend code to an Azure App Service. This is called CI/CD: when code is pushed to the repository the test/build/deploy steps can run automatically and update the server on Azure.
- For this to work, the repository must contain secure credentials (kept in GitHub Secrets) that allow GitHub to talk to Azure. Only a developer or administrator with Azure permissions should configure these secrets.

**Quick Troubleshooting (what to tell a developer or support)**
- Symptom: API endpoints return 404 (not found) while the root URL returns a page.
  - Likely cause: the Flask app is not being started from the correct folder or the startup command (how Azure runs the app) is incorrect.
  - What to ask the developer to check:
    - In Azure App Service check `Application settings` (environment variables) and confirm `MONGO_URI` and Cloudinary keys are present.
    - Use the Kudu console (Advanced Tools -> Debug Console) and confirm the app files are in `site/wwwroot` and `app.py` is present.
    - Confirm the App Service startup command is appropriate (for example: `gunicorn app:app` or `gunicorn Backend.app:app` depending on where `app.py` is deployed).

- Symptom: New profile photo doesn't show after upload.
  - Likely cause: Cloudinary upload failed or the app is incorrectly constructing the URL.
  - What to ask the developer to check: server logs for Cloudinary upload errors, and confirm Cloudinary `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` are configured.

**Common endpoints (for reference)**
- `GET /health` — basic server check
- `GET /debug/routes` — lists available server routes (useful for developers)
- `POST /auth/register` — register a new user (body: `fullName`, `phone`, `password`)
- `POST /auth/login` — login (body: `phone`, `password`)
- `POST /auth/update` — update user profile (can include `profilePhotoB64`)
- `GET /market/listings` — fetch listings
- `POST /market/listings` — create a listing (send `commodity`, `quantity`, `price`, `photoB64`)

Only a developer should call these endpoints directly; mobile app handles the interface for users.

**Environment variables (what they are and why they matter)**
- `MONGO_URI` — connection string to the MongoDB Atlas database. Without this the backend cannot store users or listings.
- `CLOUDINARY_CLOUD_NAME` — your Cloudinary account name so images can be uploaded.
- `CLOUDINARY_UPLOAD_PRESET` — an upload preset used by Cloudinary to accept unsigned uploads from the server.
- `MODEL_PATH` — (optional) local path to a machine learning model file used by the `/predict` endpoint. If missing, the server returns a safe mock response.

Where to set them:
- For local testing: `Backend/.env` (do not commit this file to a public repo).
- For a deployed server (Azure): set these as **Application settings** in the Azure App Service (these act like environment variables on the server).

**Security & privacy notes (plain language)**
- Passwords are stored using hashing (they are not saved in plain text). This is standard for protecting user passwords.
- Do not share the `Backend/.env` file or any credentials (Mongo connection strings, Cloudinary secrets) in public places.

**If you're non-technical and need help**
- Want me to deploy or verify the app? Provide the developer with:
  - The Azure App Service URL (so they can check endpoints).
  - Confirmation that `MONGO_URI`, `CLOUDINARY_CLOUD_NAME`, and `CLOUDINARY_UPLOAD_PRESET` are set in the App Service.
  - Ask them to check the App Service startup command and logs if endpoints are missing.

**Next steps common checklist for non-technical owners**
- Confirm Azure App Service has these Application settings: `MONGO_URI`, `CLOUDINARY_*` values.
- Confirm the backend `health` endpoint responds.
- From a phone with Expo Go, open the app and try a register / login / profile photo upload / create listing.
- If there are issues, capture screenshots of the mobile app errors and the Azure App Service logs and share them with your developer.

**Developer notes (if you want to pass this to an engineer)**
- Backend run (local dev):

```powershell
# from repository root
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# create .env with MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, optional MODEL_PATH
python app.py
```

- Frontend run (local dev):

```powershell
# from repository root
cd <frontend-folder-if-needed>
# Use the Expo CLI to start the dev server
npm install
npx expo start
```

If you want me to also commit and push this README, or to create a short one-page guide for testers, tell me and I'll add it.

---

File created: `README.md` at the repository root. If you'd like, I can now commit and push this file to the remote repository and/or open a pull request.
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
