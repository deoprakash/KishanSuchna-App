import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { BACKEND_URL } from '../../config';
import { authStyles as styles } from '../../styles/AuthStyle';

const ForgotPassword = () => {
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      if (Platform.OS === 'web') {
        window.alert('Please enter your phone number');
      } else {
        Alert.alert('Error', 'Please enter your phone number');
      }
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a valid 10-digit phone number');
      } else {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
      }
      return;
    }

    if (!newPassword.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a new password');
      } else {
        Alert.alert('Error', 'Please enter a new password');
      }
      return;
    }

    if (newPassword.length < 6) {
      if (Platform.OS === 'web') {
        window.alert('Password must be at least 6 characters long');
      } else {
        Alert.alert('Error', 'Password must be at least 6 characters long');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (Platform.OS === 'web') {
        window.alert('Passwords do not match');
      } else {
        Alert.alert('Error', 'Passwords do not match');
      }
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmedPhone, newPassword }),
      });

      const body = await resp.json().catch(() => ({} as any));
      if (!resp.ok) {
        if (resp.status === 404 && body?.error === 'user_not_found') {
          throw new Error('No account found for this phone number.');
        }
        if (resp.status === 503 && body?.error === 'database_unavailable') {
          throw new Error('Server database is unavailable. Please try again later.');
        }
        throw new Error(body?.error ? `${body.error} (${resp.status})` : `Reset failed (${resp.status})`);
      }

      if (Platform.OS === 'web') {
        window.alert('Password changed successfully');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Success', 'Password changed successfully', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (error: any) {
      if (Platform.OS === 'web') {
        window.alert(error?.message || 'Reset failed. Please try again.');
      } else {
        Alert.alert('Error', error?.message || 'Reset failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    const canGoBack = (router as any)?.canGoBack?.() ?? false;
    if (canGoBack) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
          <Text style={styles.description}>
            Enter your phone number and a new password
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={handleBackToLogin}>
            <Text style={styles.linkText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
