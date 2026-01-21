import { Image, StyleSheet, Text, View } from 'react-native';
import WeatherComponent from '../../components/WeatherComponent';
import imagePath from '../../constants/imagePath';
import { useTranslation } from '../../context/TranslationContext';
import { homeStyles as styles } from '../../styles/homeStyles';

// Weather summary for white card
import React, { useEffect, useState } from 'react';

const HomeTab = () => {
  const { t } = useTranslation();
  
  // Removed Crop Prices tab
  
  return (
    <View style={styles.container}>
      <Image 
        source={imagePath.banner} 
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <View style={styles.overlay} />
        
        {/* Welcome Text */}
        <View style={localStyles.welcomeContainer}>
          <Text style={localStyles.welcomeText}>{t('home.welcome')}</Text>
          <Text style={localStyles.subtitleText}>{t('home.subtitle')}</Text>
        </View>
      {/* Weather Card Widget */}
      <View style={localStyles.weatherCardContainer}>
        <WeatherComponent />
      </View>
      {/* Simple White Card */}
      <View style={localStyles.simpleWhiteCard}>
        {/* Weather Update Summary */}
        <WeatherComponentSummary />
      </View>
      {/* Navigation Cards removed (Camera, Weather, Crop Prices) */}
    </View>
  );
};


const WeatherComponentSummary = () => {
  const [weather, setWeather] = useState<any>(null);
  useEffect(() => {
    // Try to get cached weather from AsyncStorage
    (async () => {
      try {
        const data = await import('@react-native-async-storage/async-storage');
        const AsyncStorage = data.default;
        const cached = await AsyncStorage.getItem('lastWeatherData');
        if (cached) setWeather(JSON.parse(cached));
      } catch {}
    })();
  }, []);
  if (!weather) return <Text style={{ color: '#333', fontSize: 16 }}>Loading weather update...</Text>;
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Weather Update</Text>
      <Text style={{ fontSize: 16, color: '#333' }}>{weather.location}</Text>
      <Text style={{ fontSize: 32, fontWeight: 'bold', color: '#008000' }}>{weather.temperature}°C</Text>
      <Text style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>{weather.condition}</Text>
      <Text style={{ fontSize: 14, color: '#666' }}>Humidity: {weather.humidity}% | Wind: {weather.windSpeed} km/h</Text>
    </View>
  );
};

const localStyles = StyleSheet.create({
  simpleWhiteCard: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  weatherCardContainer: {
    marginTop: 160,
    marginHorizontal: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    padding: 0,
    overflow: 'hidden',
  },
  cardsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardIcon: {
    marginRight: 15,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
});

export default HomeTab;