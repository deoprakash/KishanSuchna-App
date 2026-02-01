import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';
import { loginStyles as styles } from '../../styles/loginStyles';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const formatLoginError = (status: number, errorCode?: string) => {
    if (status === 401 && errorCode === 'invalid_credentials') {
      return 'Invalid phone number or password.';
    }
    if (status === 400 && errorCode) {
      return errorCode;
    }
    if (status === 503 && errorCode === 'database_unavailable') {
      return 'Server database is unavailable. Please try again later.';
    }
    if (errorCode) {
      return `${errorCode} (${status})`;
    }
    return `Login failed (${status})`;
  };

  const handleLogin = async () => {
    if (!phone || !password) {
      if (Platform.OS === 'web') {
        window.alert('Please fill in all fields');
      } else {
        Alert.alert('Error', 'Please fill in all fields');
      }
      setErrorMessage('Please fill in all fields');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const resp = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({} as any));
        const errorCode = body?.error as string | undefined;
        const msg = formatLoginError(resp.status, errorCode);
        setErrorMessage(msg);
        throw new Error(msg);
      }
      const data = await resp.json();
      const userData = {
        phone: data.user?.phone || phone,
        fullName: data.user?.fullName || '',
        name: data.user?.fullName || 'User',
        loginTime: new Date().toISOString(),
      };
      await login(userData);
      setLoading(false);
      router.replace('/(tab)');
    } catch (error: any) {
      setLoading(false);
      const message = error?.message || 'Login failed. Please try again.';
      setErrorMessage(message);
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Kishan Suchna</Text>
          <Text style={styles.subtitle}>Welcome Back!</Text>
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
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={{ position: 'relative', justifyContent: 'center' }}>
              <TextInput
                style={[styles.input, { paddingRight: 40 }]}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((prev) => !prev)}
                style={{ position: 'absolute', right: 10, height: '100%', justifyContent: 'center', alignItems: 'center' }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color="gray" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText} onPress={() => router.push('/(auth)/forgot_password')}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          {errorMessage ? (
            <Text style={{ color: 'red', marginTop: 12 }}>{errorMessage}</Text>
          ) : null}

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Login;