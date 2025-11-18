import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authStyles } from '../../styles/AuthStyle';

const Auth = () => {
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <View style={authStyles.scrollContainer}>
        <View style={authStyles.header}>
          <Text style={authStyles.title}>Kishan Suchna</Text>
          <Text style={authStyles.subtitle}>Agriculture Information System</Text>
          <Text style={authStyles.description}>
            Get the latest agricultural information, weather updates, and farming tips
          </Text>
        </View>

        <View style={authStyles.form}>
          <TouchableOpacity 
            style={authStyles.primaryButton}
            onPress={handleLogin}
          >
            <Text style={authStyles.primaryButtonText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={authStyles.secondaryButton}
            onPress={handleRegister}
          >
            <Text style={authStyles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>

          <View style={authStyles.dividerContainer}>
            <View style={authStyles.dividerLine} />
            <Text style={authStyles.dividerText}>OR</Text>
            <View style={authStyles.dividerLine} />
          </View>

          <TouchableOpacity style={authStyles.linkButton}>
            <Text style={authStyles.linkText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <View style={authStyles.termsContainer}>
          <Text style={authStyles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={authStyles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={authStyles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Auth;