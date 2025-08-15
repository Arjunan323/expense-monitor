import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { apiCall } from '../utils/api';
import { getDefaultCurrency } from '../utils/formatters';
import { usePreferences } from './PreferencesContext';
import toast from 'react-hot-toast';

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
  const { setPreferences } = usePreferences();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      // If user object carries preference hints
      if (parsed?.currency || parsed?.locale) {
        setPreferences({ currency: parsed.currency || 'USD', locale: parsed.locale || 'en-US' });
      }
    }
    setLoading(false);
  }, []);

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
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData?.currency || userData?.locale) {
        setPreferences({ currency: userData.currency || 'USD', locale: userData.locale || 'en-US' });
      } else {
        const detected = getDefaultCurrency();
        setPreferences({ currency: detected.currency, locale: detected.locale });
      }
      
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
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
      const detected = getDefaultCurrency();
      const response = await apiCall<{ token: string; user: User }>('POST', '/auth/register', {
        email,
        password,
        firstName,
        lastName,
        currency: detected.currency,
        locale: detected.locale,
      });

  const { token: newToken, user: userData } = response;
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData?.currency || userData?.locale) {
        setPreferences({ currency: userData.currency || 'USD', locale: userData.locale || 'en-US' });
      } else {
        const detected = getDefaultCurrency();
        setPreferences({ currency: detected.currency, locale: detected.locale });
      }
      
      toast.success('Account created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
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