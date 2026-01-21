require('dotenv').config();
module.exports = {
  apps: [
    {
      name: "app",
      script: "app.py",
      interpreter: "/home/azureuser/KishanSuchna-App/Backend/venv/bin/python3",
      env: {
        MODEL_PATH: "Backend/Model/model.pth",
        MONGO_URI: process.env.MONGO_URI,
        CLOUDINARY_CLOUD_NAME:"doiglu8td",
        CLOUDINARY_UPLOAD_PRESET:"kishan_suchna_uploads"
      }
    }
  ]
}
