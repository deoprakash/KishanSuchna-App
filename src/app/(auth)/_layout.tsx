import { Stack } from 'expo-router';
import React from 'react';

const AuthStack = () => {
  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify_otp" />
      <Stack.Screen name="forgot_password" />
    </Stack>
  )
}

export default AuthStack;