import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TranslationProvider } from '../context/TranslationContext';

SplashScreen.preventAutoHideAsync();

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      console.log('App ready - hiding splash screen');
      SplashScreen.hideAsync();
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return null; // Show splash screen while loading
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // User is logged in - show main app (default to tabs)
        <>
          <Stack.Screen 
            name="(tab)" 
            options={{ 
              headerShown: false 
            }} 
          />
          <Stack.Screen 
            name="(main)" 
            options={{ 
              headerShown: false 
            }} 
          />
        </>
      ) : (
        // User is not logged in - show auth screens
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false 
          }} 
        />
      )}
    </Stack>
  );
};

const RootNavigation = () => {
  return (
    <>
      <Head>
        <title>Kishan Suchna - Agriculture Information App</title>
        <meta name="description" content="Complete agriculture information app with weather, crop prices, and plant disease detection" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <TranslationProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </TranslationProvider>
    </>
  );
};

export default RootNavigation;