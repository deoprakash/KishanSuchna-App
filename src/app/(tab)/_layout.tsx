import { FontAwesome } from '@expo/vector-icons';
import { Tabs, router, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import React from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import LanguageSelector from '../../components/LanguageSelector';
import { useTranslation } from '../../context/TranslationContext';

const TabLayout = () => {
  const { t } = useTranslation();
  const segments = useSegments();
  
  // Get the current tab name from segments - check if we're on home (no specific tab segment)
  const isOnHome = segments.length === 1 && segments[0] === '(tab)';
  const currentTab = isOnHome ? 'home' : segments[segments.length - 1];
  
  // Function to get page title and description based on current route
  const getPageInfo = () => {
    if (isOnHome || currentTab === 'home') {
      return {
        title: `${t('app.name')} - ${t('navigation.home')}`,
        description: t('home.subtitle')
      };
    } else if (currentTab === 'camera') {
      return {
        title: `${t('app.name')} - ${t('navigation.camera')}`,
        description: t('camera.description')
      };
    } else if (currentTab === 'weather') {
      return {
        title: `${t('app.name')} - ${t('navigation.weather')}`,
        description: t('weather.title')
      };
    } else if (currentTab === 'profile') {
      return {
        title: `${t('app.name')} - ${t('navigation.profile')}`,
        description: 'User profile and account information'
      };
    } else {
      return {
        title: t('app.name'),
        description: 'Complete agriculture information app'
      };
    }
  };
  
  const pageInfo = getPageInfo();
  
  const handleMicPress = () => {
    // TODO: Implement voice input functionality
    console.log('Microphone pressed');
  };

  const handleChatbotPress = () => {
    Alert.alert(
      t('chatbot.title'),
      t('chatbot.comingSoon'),
      [{ text: t('common.ok'), style: 'default' }]
    );
  };

  const handleBackPress = () => {
    router.push('/(tab)');
  };
  
  return (
    <>
      <Head>
        <title>{pageInfo.title}</title>
        <meta name="description" content={pageInfo.description} />
      </Head>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'green',
          tabBarInactiveTintColor: 'gray',
          headerShown: true,
          headerStyle: { backgroundColor: 'green' },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: 'bold'
          }
        }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('app.name'),
          tabBarLabel: t('navigation.home'),
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="home" size={24} color={color} />
          ),
          headerRight: () => (
            <View style={headerStyles.headerButtonsContainer}>
              <TouchableOpacity 
                style={headerStyles.chatbotButton}
                onPress={handleChatbotPress}
              >
                <FontAwesome name="comments" size={20} color="white" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={headerStyles.micButton}
                onPress={handleMicPress}
              >
                <FontAwesome name="microphone" size={20} color="white" />
              </TouchableOpacity>
              <LanguageSelector showAsButton={true} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title:'Market',
          tabBarLabel:'Market',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="exchange" size={24} color={color} />
          ),
          headerLeft: () => (
            <TouchableOpacity 
              style={headerStyles.backButton}
              onPress={handleBackPress}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={headerStyles.headerButtonsContainer}>
              <TouchableOpacity 
                style={headerStyles.micButton}
                onPress={handleMicPress}
              >
                <FontAwesome name="microphone" size={20} color="white" />
              </TouchableOpacity>
              <LanguageSelector showAsButton={true} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: t('navigation.camera'),
          tabBarLabel: t('navigation.camera'),
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="camera" size={24} color={color} />
          ),
          headerLeft: () => (
            <TouchableOpacity 
              style={headerStyles.backButton}
              onPress={handleBackPress}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={headerStyles.headerButtonsContainer}>
              <TouchableOpacity 
                style={headerStyles.micButton}
                onPress={handleMicPress}
              >
                <FontAwesome name="microphone" size={20} color="white" />
              </TouchableOpacity>
              <LanguageSelector showAsButton={true} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          title: t('navigation.weather'),
          tabBarLabel: t('navigation.weather'),
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="cloud" size={24} color={color} />
          ),
          headerLeft: () => (
            <TouchableOpacity 
              style={headerStyles.backButton}
              onPress={handleBackPress}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={headerStyles.headerButtonsContainer}>
              <TouchableOpacity 
                style={headerStyles.micButton}
                onPress={handleMicPress}
              >
                <FontAwesome name="microphone" size={20} color="white" />
              </TouchableOpacity>
              <LanguageSelector showAsButton={true} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('navigation.profile'),
          tabBarLabel: t('navigation.profile'),
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
          headerLeft: () => (
            <TouchableOpacity 
              style={headerStyles.backButton}
              onPress={handleBackPress}
            >
              <FontAwesome name="arrow-left" size={20} color="white" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={headerStyles.headerButtonsContainer}>
              <TouchableOpacity 
                style={headerStyles.micButton}
                onPress={handleMicPress}
              >
                <FontAwesome name="microphone" size={20} color="white" />
              </TouchableOpacity>
              <LanguageSelector showAsButton={true} />
            </View>
          ),
        }}
      />
    </Tabs>
    </>
  );
};

const headerStyles = StyleSheet.create({
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  micButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  chatbotButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  backButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
});

export default TabLayout;