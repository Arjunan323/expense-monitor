import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthContextType } from '../types';
import { apiCall } from '../utils/api';
import Toast from 'react-native-toast-message';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiCall<{ token: string; user: User }>('POST', '/auth/login', {
        username,
        password,
      });

      const { token: newToken, user: userData } = response;
      
      setToken(newToken);
      setUser(userData);
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiCall<{ token: string; user: User }>('POST', '/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });

      const { token: newToken, user: userData } = response;
      
      setToken(newToken);
      setUser(userData);
      await SecureStore.setItemAsync('token', newToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      
      Toast.show({
        type: 'success',
        text1: 'Account created successfully!',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully',
    });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};