
// Vite env type fix for TypeScript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import axios, { AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from '../types';
import { BankRecord, CategoryRecord } from '../types';
import toast from 'react-hot-toast';
import { AnalyticsSummary, AnalyticsFeedbackPayload, FeedbackResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
    // Global JWT/session expired handling
    const msg = error.response?.data?.message || error.message || '';
    // If backend sends a JWT expired message
    if (
      msg.includes('JWT expired') ||
      msg.includes('ExpiredJwtException') ||
      msg.includes('jwt expired')
    ) {
      toast.error('Your session has expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      throw new Error('Session expired');
    }
    // If backend only sends 403 Forbidden for expired JWT
    if (error.response?.status === 403) {
      toast.error('Your session has expired or you are not authorized. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
      throw new Error('Session expired or forbidden');
    }
    throw new Error(msg || 'An error occurred');
  }
};

export default api;

// Analytics APIs
export const fetchAnalyticsSummary = async (params?: { startDate?: string; endDate?: string; }) => {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  const q = query.toString();
  return apiCall<AnalyticsSummary>('GET', `/analytics/summary${q ? `?${q}` : ''}`);
};

export const submitAnalyticsFeedback = async (payload: AnalyticsFeedbackPayload) => {
  return apiCall<FeedbackResponse>('POST', '/feedback/analytics', {
    email: payload.email,
    message: payload.message || 'Analytics feature feedback',
    type: 'ANALYTICS',
    meta: JSON.stringify({ features: payload.features })
  });
};

// Banks & Categories master data
export const fetchBanks = async (): Promise<BankRecord[]> => {
  return apiCall<BankRecord[]>('GET', '/banks');
};

export const fetchCategories = async (): Promise<CategoryRecord[]> => {
  return apiCall<CategoryRecord[]>('GET', '/categories');
};