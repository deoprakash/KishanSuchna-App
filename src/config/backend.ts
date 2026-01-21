// Central backend URL for the app
// Prefer setting EXPO_PUBLIC_BACKEND_URL for different environments
// Default to the Azure App Service URL (production). You can override
// this by setting `EXPO_PUBLIC_BACKEND_URL` in your environment when building.
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const inferDevHostIp = (): string | null => {
	const hostUri =
		Constants.expoConfig?.hostUri ??
		(Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
		(Constants as any)?.manifest?.debuggerHost;

	if (typeof hostUri !== 'string' || hostUri.length === 0) return null;
	const host = hostUri.split(':')[0];
	return host || null;
};

const normalizeUrl = (url: string) => url.replace(/\/$/, '');

const getBackendUrl = () => {
	const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
	if (envUrl) return normalizeUrl(envUrl);

	// In Expo mobile, 127.0.0.1 points to the device/emulator itself.
	// Prefer the dev machine LAN IP when available.
	const devHostIp = inferDevHostIp();
	if (devHostIp) return `http://${devHostIp}:5000`;

	// Fallbacks when host IP isn't available.
	if (Platform.OS === 'android') return 'http://10.0.2.2:5000';
	if (Platform.OS === 'ios') return 'http://localhost:5000';
	return 'http://127.0.0.1:5000';
};

// export const BACKEND_URL = "https://be.shubhamdev.tech"
export const BACKEND_URL = getBackendUrl();
