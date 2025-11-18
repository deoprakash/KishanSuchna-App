import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import imagePath from '../../constants/imagePath';
import { useTranslation } from '../../context/TranslationContext';
import { homeStyles as styles } from '../../styles/homeStyles';

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
      {/* Navigation Cards removed (Camera, Weather, Crop Prices) */}
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