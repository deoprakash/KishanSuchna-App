// Central backend URL for the app
// Prefer setting EXPO_PUBLIC_BACKEND_URL for different environments
// Default to the Azure App Service URL (production). You can override
// this by setting `EXPO_PUBLIC_BACKEND_URL` in your environment when building.
export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'https://kishansuchna-backend-bwhcb9ebc6crf4dg.centralindia-01.azurewebsites.net';
