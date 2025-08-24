import axios, { AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { ApiResponse, PaginatedResponse } from '../types';
import { authEvents } from './eventBus';

const API_BASE_URL = 'https://koala-large-moderately.ngrok-free.app'; // Update for production

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// authEvents imported from custom event bus (simple implementation)

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
    const status = error.response?.status;
    const isAuthAttempt = error?.config?.headers?.['X-Auth-Attempt'] === 'true';
    if ((status === 401 || status === 403) && !isAuthAttempt) {
      // Clear secure store items defensively
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        await SecureStore.deleteItemAsync('user-preferences');
      } catch {}
      // Emit event so AuthContext can perform state reset & navigation
      authEvents.emit('auth-expired', { status });
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
    const response = await api.request({ method, url, data, ...config });
    return response.data;
  } catch (error: any) {
    const eresp = error?.response?.data;
    if (eresp && typeof eresp === 'object' && 'code' in eresp && 'status' in eresp) {
      const err: any = new Error(eresp.message || 'Error');
      err.code = eresp.code;
      err.status = eresp.status;
      err.details = eresp.details;
      throw err;
    }
    // Fallback for auth responses like { token:null, user:null, error:"Invalid credentials" }
    if (eresp && eresp.error && !eresp.message) {
      const authErr: any = new Error(eresp.error);
      authErr.status = error.response?.status;
      throw authErr;
    }
    throw error;
  }
};

export const fetchAnalyticsSummary = async (params?: { startDate?: string; endDate?: string; }) => {
  const query: string[] = [];
  if (params?.startDate) query.push(`startDate=${encodeURIComponent(params.startDate)}`);
  if (params?.endDate) query.push(`endDate=${encodeURIComponent(params.endDate)}`);
  const data = await apiCall<any>('GET', `/analytics/summary${query.length ? '?' + query.join('&') : ''}`);
  const nf = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  if (!data.totalInflowFormatted && typeof data.totalInflow === 'number') {
    data.totalInflowFormatted = nf.format(data.totalInflow);
    data.totalOutflowFormatted = nf.format(data.totalOutflow);
    data.netCashFlowFormatted = nf.format(data.netCashFlow);
    data.averageDailySpendFormatted = nf.format(data.averageDailySpend);
    data.topCategories?.forEach((c: any) => {
      if (!c.amountFormatted && typeof c.amount === 'number') c.amountFormatted = nf.format(c.amount);
    });
  }
  return data;
};

export const fetchStatementJob = (id: string) => apiCall<any>('GET', `/statement-jobs/${id}`);

// Email verification & password reset helpers
export const verifyEmailToken = async (token: string): Promise<boolean> => {
  try { await apiCall('GET', `/auth/verify?token=${encodeURIComponent(token)}`); return true; } catch { return false; }
};
export const resendVerification = async (email: string): Promise<void> => {
  await apiCall('POST', `/auth/verify/resend?email=${encodeURIComponent(email)}`);
};
export const requestPasswordReset = async (email: string): Promise<void> => {
  await apiCall('POST', '/auth/password/request', { email });
};
export const resetPassword = async (token: string, password: string): Promise<boolean> => {
  try { await apiCall('POST', '/auth/password/reset', { token, password }); return true; } catch { return false; }
};

// Notification Preferences (parity with web)
export interface MobileNotificationPreferenceDto { id: number; type: string; emailEnabled: boolean }
export const listNotificationPrefs = async (): Promise<MobileNotificationPreferenceDto[]> => {
  try {
    return await apiCall<MobileNotificationPreferenceDto[]>('GET', '/notifications/preferences');
  } catch {
    return [];
  }
};
export const upsertNotificationPref = async (type: string, emailEnabled: boolean): Promise<MobileNotificationPreferenceDto | null> => {
  try {
    return await apiCall<MobileNotificationPreferenceDto>('POST', '/notifications/preferences', null, { params: { type, emailEnabled } });
  } catch {
    return null;
  }
};

// (Optional) Low balance threshold placeholder endpoints – adjust when backend ready
export const fetchLowBalanceThreshold = async (): Promise<number | null> => {
  try {
    const data: any = await apiCall('GET', '/notifications/low-balance-threshold');
    if (typeof data?.threshold === 'number') return data.threshold;
    return null;
  } catch { return null; }
};
export const updateLowBalanceThreshold = async (threshold: number): Promise<boolean> => {
  try { await apiCall('POST', '/notifications/low-balance-threshold', { threshold }); return true; } catch { return false; }
};

// Auth-specific helper to avoid triggering global logout on invalid credentials
export const authApiCall = async <T>(url: string, body: any): Promise<T> => {
  return apiCall<T>('POST', url, body, { headers: { 'X-Auth-Attempt': 'true' }});
};

export const fetchMonthlySpendingSeriesMobile = async (from: string, to: string, opts?: { includeBanks?: boolean; includePrevYear?: boolean; topCategories?: number }) => {
  const params = new URLSearchParams({ from, to });
  if (opts?.includeBanks) params.append('includeBanks','true');
  if (opts?.includePrevYear) params.append('includePrevYear','true');
  if (opts?.topCategories) params.append('topCategories', String(opts.topCategories));
  return apiCall<any>('GET', `/analytics/trends/spending/monthly-series?${params.toString()}`);
};

export default api;