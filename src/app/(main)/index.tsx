import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import imagePath from '../../constants/imagePath';
import { useTranslation } from '../../context/TranslationContext';
import { homeStyles as styles } from '../../styles/homeStyles';

const Home = () => {
  const { t } = useTranslation();

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const handleWeatherPress = () => {
    router.push('/weather');
  };

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

      {/* Navigation Cards */}
      <View style={localStyles.cardsContainer}>
        {/* Camera Card */}
        <TouchableOpacity 
          style={[localStyles.card, localStyles.cameraCard]} 
          onPress={handleCameraPress}
        >
          <FontAwesome name="camera" size={40} color="white" />
          <Text style={localStyles.cardTitle}>{t('navigation.camera')}</Text>
          <Text style={localStyles.cardDescription}>{t('home.cameraDescription')}</Text>
        </TouchableOpacity>

        {/* Weather Card */}
        <TouchableOpacity 
          style={[localStyles.card, localStyles.weatherCard]} 
          onPress={handleWeatherPress}
        >
          <FontAwesome name="cloud" size={40} color="white" />
          <Text style={localStyles.cardTitle}>{t('navigation.weather')}</Text>
          <Text style={localStyles.cardDescription}>{t('home.weatherDescription')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  welcomeContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  subtitleText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  cardsContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    zIndex: 2,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 20,
    marginVertical: 10,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  weatherCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 5,
  },
});

export default Home;