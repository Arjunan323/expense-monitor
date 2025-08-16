import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { User, AuthContextType, UsageStats } from '../types';
import { apiCall, authApiCall } from '../utils/api';
import { authEvents } from '../utils/eventBus';
import { usePreferences } from './PreferencesContext';
import Toast from 'react-native-toast-message';
import { setItemSafe } from '../utils/secureStoreSafe';

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
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const { setPreferences } = usePreferences();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Listen for global 401/403 to force logout
  useEffect(() => {
    const handler = () => {
      // perform logout but avoid toast spam if already logged out
      forcedLogout();
    };
    authEvents.on('auth-expired', handler);
    return () => {
      authEvents.off('auth-expired', handler);
    };
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      const storedPrefs = await SecureStore.getItemAsync('user-preferences');

      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Only apply defaults from user record if no stored preferences exist
        if (!storedPrefs) {
          if (parsed?.currency || parsed?.locale) {
            setPreferences({ currency: parsed.currency || (/-IN$/i.test(parsed?.locale || '') ? 'INR' : 'USD'), locale: parsed.locale || 'en-US' });
          } else {
            // Detect from device
            let cur = 'USD';
            let loc = 'en-US';
            try { loc = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale || 'en-US'; if (/-IN$/i.test(loc)) cur = 'INR'; } catch {}
            setPreferences({ currency: cur, locale: loc });
          }
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsage = async () => {
    if (!token) return;
    try {
      setUsageLoading(true);
      const data = await apiCall<UsageStats>('GET', '/user/usage');
      setUsage(data);
    } catch (e) {
      // ignore
    } finally {
      setUsageLoading(false);
    }
  };

  // Fetch usage after login token present
  useEffect(() => {
    if (token) {
      refreshUsage();
    } else {
      setUsage(null);
    }
  }, [token]);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setLoading(true);
    const response = await authApiCall<{ token: string; user: User }>('/auth/login', { username, password });

      const { token: newToken, user: userData } = response;
      
      setToken(newToken);
      setUser(userData);
      try {
        await setItemSafe('token', newToken);
        await setItemSafe('user', userData);
      } catch (storeErr: any) {
        console.error('SecureStore login save failed:', storeErr, { tokenPreview: newToken?.slice(0,10) });
        Toast.show({ type: 'error', text1: 'Storage error', text2: storeErr.message });
      }
      // trigger usage fetch
      refreshUsage();
      
      Toast.show({ type: 'success', text1: 'Welcome back!' });
      // On login, only set preferences if user provides currency/locale AND no stored prefs yet
      const existingPrefs = await SecureStore.getItemAsync('user-preferences');
      if (!existingPrefs && (userData?.currency || userData?.locale)) {
        setPreferences({ currency: userData.currency || 'USD', locale: userData.locale || 'en-US' });
      }
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
      // Detect currency: if device locale indicates India use INR else USD
      let detectedCurrency = 'USD';
      try {
        const loc = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.().locale || '';
        if (/-IN$/i.test(loc)) detectedCurrency = 'INR';
      } catch {}
      const response = await apiCall<any>('POST', '/auth/register', {
        email,
        password,
        firstName,
        lastName,
        currency: detectedCurrency,
      });
      // Support both legacy and new DTO shapes
      const newToken: string | null = response.token || null;
      const userData: User | null = response.user || null;
      if (!newToken || !userData) {
        throw new Error(response.message || 'Registration did not return auth data');
      }
      
      setToken(newToken);
      setUser(userData);
      try {
        await setItemSafe('token', newToken);
        await setItemSafe('user', userData);
      } catch (storeErr: any) {
        console.error('SecureStore register save failed:', storeErr, { tokenPreview: newToken?.slice(0,10) });
        Toast.show({ type: 'error', text1: 'Storage error', text2: storeErr.message });
      }
      refreshUsage();
      
      Toast.show({ type: 'success', text1: 'Account created successfully!' });
      const existingPrefsReg = await SecureStore.getItemAsync('user-preferences');
      if (!existingPrefsReg) {
        if (userData?.currency || userData?.locale) {
          setPreferences({ currency: userData.currency || 'USD', locale: userData.locale || 'en-US' });
        } else {
          // fallback detection already done when sending registration, reuse detectedCurrency
          setPreferences({ currency: detectedCurrency, locale: 'en-US' });
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
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
    setUsage(null);
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('user-preferences');
    Toast.show({
      type: 'success',
      text1: 'Logged out successfully',
    });
  };

  // Internal silent variant used for auth expiration
  const forcedLogout = async () => {
    setUser(null);
    setToken(null);
    setUsage(null);
    try {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('user-preferences');
    } catch {}
    Toast.show({ type: 'info', text1: 'Session expired', text2: 'Please log in again.' });
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  usage,
  usageLoading,
  refreshUsage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};