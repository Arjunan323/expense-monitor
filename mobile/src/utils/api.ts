import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, PaginatedResponse } from '../types';

const API_BASE_URL = 'https://6558e7cec67a.ngrok-free.app'; // Update for production

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

export const apiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: any,
  config?: any
): Promise<T> => {
  try {
    const response = await api.request({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error: any) {
    const msg = error.response?.data?.message || error.message || '';
    if (
      msg.includes('JWT expired') ||
      msg.includes('ExpiredJwtException') ||
      msg.includes('jwt expired')
    ) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      throw new Error('Session expired');
    }
    if (error.response?.status === 403) {
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      throw new Error('Session expired or forbidden');
    }
    throw new Error(msg || 'An error occurred');
  }
};

export default api;