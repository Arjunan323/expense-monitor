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

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
    const status = error.response?.status;
    const url: string | undefined = error.config?.url;
    const isAuthAttempt = error.config?.headers?.['X-Auth-Attempt'] === 'true' || url === '/auth/login' || url === '/auth/register';
    if ((status === 401 || status === 403) && !isAuthAttempt) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // session expiry toast handled in apiCall for JWT expired messages; keep redirect here
      setTimeout(() => { window.location.href = '/login'; }, 1200);
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
  const eresp = error.response?.data;
    // Attempt to detect structured ErrorResponse
    if (eresp && typeof eresp === 'object' && 'code' in eresp && 'status' in eresp) {
      const structured = {
        message: eresp.message || 'Error',
        code: eresp.code,
        status: eresp.status,
        details: eresp.details as string[] | undefined,
        raw: eresp,
      };
      // Session expiration handling still applies
      if (structured.code === 'UNAUTHORIZED') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => { window.location.href = '/login'; }, 500);
      }
      const err = new Error(structured.message) as any;
      err.code = structured.code;
      err.status = structured.status;
      err.details = structured.details;
      err.raw = structured.raw;
      throw err;
    }
  const msg = (eresp?.message || eresp?.error || '') || error.message || '';
    if (
      msg.includes('JWT expired') ||
      msg.includes('ExpiredJwtException') ||
      msg.includes('jwt expired')
    ) {
      toast.error('Your session has expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      throw new Error('Session expired');
    }
    if (error.response?.status === 403) {
      toast.error('Your session has expired or you are not authorized. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setTimeout(() => { window.location.href = '/login'; }, 1500);
      throw new Error('Session expired or forbidden');
    }
    throw new Error(msg || 'An error occurred');
  }
};

// Auth-specific helper to mark auth attempts so 401 doesn't trigger global logout redirect
export const authApiCall = async <T>(method: 'POST', url: string, data: any): Promise<T> => {
  return apiCall<T>(method, url, data, { headers: { 'X-Auth-Attempt': 'true' }});
};

export default api;

// Analytics APIs
export const fetchAnalyticsSummary = async (params?: { startDate?: string; endDate?: string; }) => {
  const query = new URLSearchParams();
  if (params?.startDate) query.append('startDate', params.startDate);
  if (params?.endDate) query.append('endDate', params.endDate);
  const q = query.toString();
  const data = await apiCall<AnalyticsSummary>('GET', `/analytics/summary${q ? `?${q}` : ''}`);
  // Provide fallback formatting if server didn't set formatted fields
  const nf = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  if (!('totalInflowFormatted' in data) && typeof data.totalInflow === 'number') {
    (data as any).totalInflowFormatted = nf.format(data.totalInflow);
    (data as any).totalOutflowFormatted = nf.format(data.totalOutflow as number);
    (data as any).netCashFlowFormatted = nf.format(data.netCashFlow as number);
    (data as any).averageDailySpendFormatted = nf.format(data.averageDailySpend as number);
    data.topCategories?.forEach(c => {
      if (!c.amountFormatted && typeof c.amount === 'number') (c as any).amountFormatted = nf.format(c.amount as number);
    });
  }
  return data;
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