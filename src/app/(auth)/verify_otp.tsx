import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import { authStyles as styles } from '../../styles/AuthStyle';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const otpRefs = useRef<TextInput[]>([]);
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get phone number from navigation params
  const phoneNumber = params.phone as string || '9876543210';

  // Timer for resend OTP
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (value: string, index: number) => {
    if (value === '' && index > 0) {
      // Focus previous input on backspace
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    // Hardcoded OTP for testing
    const validOTP = '123456';

    setLoading(true);
    
    try {
      // Simulate API call
      setTimeout(() => {
        if (otpString === validOTP) {
          Alert.alert(
            'Success', 
            'OTP verified successfully!', 
            [
              { 
                text: 'OK', 
                onPress: () => {
                  // Navigate to main app or complete registration
                  router.replace('/(tab)');
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', 'Invalid OTP. Please try again.');
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          otpRefs.current[0]?.focus();
        }
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'OTP verification failed. Please try again.');
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setResendLoading(true);
    
    try {
      // Simulate API call to resend OTP
      setTimeout(() => {
        Alert.alert('Success', 'OTP has been resent to your phone number');
        setTimer(60);
        setCanResend(false);
        setResendLoading(false);
        // Clear current OTP
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }, 1000);
      
    } catch (error) {
      setResendLoading(false);
      Alert.alert('Error', 'Failed to resend OTP. Please try again.');
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

  const formatPhoneNumber = (phone: string) => {
    if (phone.length === 10) {
      return `+91 ${phone.slice(0, 5)}***${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We've sent a 6-digit code to
          </Text>
          <Text style={styles.phoneDisplay}>
            {formatPhoneNumber(phoneNumber)}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter OTP</Text>
            <Text style={styles.description}>
              Please enter the 6-digit verification code
            </Text>
          </View>
          
          <View style={styles.otpContainer}>
            <View style={styles.otpInputContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    if (ref) otpRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace') {
                      handleBackspace(digit, index);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  selectTextOnFocus
                  textAlign="center"
                  autoFocus={index === 0}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={handleResendOTP}
                disabled={resendLoading}
              >
                <Text style={styles.linkText}>
                  {resendLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.timerText}>
                Resend OTP in {timer}s
              </Text>
            )}
          </View>

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={handleBackToLogin}
          >
            <Text style={styles.linkText}>
              Back to Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default VerifyOTP;
