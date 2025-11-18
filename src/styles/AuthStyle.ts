import { StyleSheet } from 'react-native';

export const authStyles = StyleSheet.create({
  // Main containers
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  
  // Header section
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Form styles
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  
  // Input styles
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#333',
  },
  inputFocused: {
    borderColor: '#008000',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  inputWithIcon: {
    paddingLeft: 45,
  },
  
  // Input icons
  inputIcon: {
    position: 'absolute',
    left: 15,
    top: 48,
    zIndex: 1,
  },
  
  // Error messages
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: '#008000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButtonDisabled: {
    backgroundColor: '#ccc',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#008000',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  secondaryButtonText: {
    color: '#008000',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Links and text buttons
  linkButton: {
    alignItems: 'center',
    marginVertical: 10,
  },
  linkText: {
    color: '#008000',
    fontSize: 14,
    fontWeight: '500',
  },
  
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: '#008000',
    fontSize: 14,
  },
  
  // Navigation links
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  navigationText: {
    color: '#666',
    fontSize: 16,
  },
  navigationLink: {
    color: '#008000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Dividers
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#666',
    fontSize: 14,
  },
  
  // Social buttons
  socialContainer: {
    marginTop: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  
  // Success states
  successContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008000',
    marginBottom: 10,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  
  // Terms and conditions
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  termsText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#008000',
    fontWeight: '500',
  },
  
  // Checkbox styles
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 3,
    marginRight: 10,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#008000',
    borderColor: '#008000',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  
  // OTP input styles
  otpContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  otpInput: {
    width: 40,
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#f9f9f9',
    marginHorizontal: 6,
  },
  otpInputFocused: {
    borderColor: '#008000',
    backgroundColor: '#fff',
  },
  
  // Timer styles
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  resendButton: {
    padding: 5,
  },
  resendButtonText: {
    color: '#008000',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  
  // Additional OTP styles
  phoneDisplay: {
    fontSize: 16,
    fontWeight: '600',
    color: '#008000',
    marginTop: 8,
    textAlign: 'center',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  otpInputFilled: {
    borderColor: '#008000',
    backgroundColor: '#fff',
  },
  hintText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
});