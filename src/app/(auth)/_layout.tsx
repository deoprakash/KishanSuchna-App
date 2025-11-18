import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router';

const AuthStack = () => {
  return (
    <Stack screenOptions={{headerShown:false}}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="verify_otp" />
    </Stack>
  )
}

export default AuthStack;