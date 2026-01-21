import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: any) => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in when app starts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      let userData = null;
      let authToken = null;
      if (Platform.OS === 'web') {
        userData = window.localStorage.getItem('userData');
        authToken = window.localStorage.getItem('authToken');
      } else {
        userData = await AsyncStorage.getItem('userData');
        authToken = await AsyncStorage.getItem('authToken');
      }
      if (userData && authToken) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
        console.log('User found in storage - Auto login successful');
      } else {
        console.log('No user data found - User needs to login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData: any) => {
    try {
      const token = 'dummy_auth_token_' + Date.now();
      if (Platform.OS === 'web') {
        window.localStorage.setItem('userData', JSON.stringify(userData));
        window.localStorage.setItem('authToken', token);
      }
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', token);
      setUser(userData);
      setIsAuthenticated(true);
      console.log('Login successful');
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      if (Platform.OS === 'web') {
        window.localStorage.removeItem('userData');
        window.localStorage.removeItem('authToken');
      }
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout successful - User data cleared');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const updateUser = async (updates: any) => {
    try {
      const current = user || {};
      const merged = { ...current, ...updates };
      await AsyncStorage.setItem('userData', JSON.stringify(merged));
      setUser(merged as any);
    } catch (error) {
      console.error('Error updating user locally:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    updateUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};