import { useFonts } from 'expo-font';

export function useRobotoFont() {
  const [fontsLoaded] = useFonts({
    'Roboto': require('../assets/fonts/Roboto-Regular.ttf'),
    'Roboto-Bold': require('../assets/fonts/Roboto-Bold.ttf'),
    'Roboto-Light': require('../assets/fonts/Roboto-Light.ttf'),
  });
  return fontsLoaded;
}
