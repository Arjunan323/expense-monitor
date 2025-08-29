import api from '../utils/api';

export async function verifyEmailToken(token: string): Promise<boolean> {
  try {
  await api.get(`/auth/verify`, { params: { token } });
    return true;
  } catch (e) {
    return false;
  }
}

export async function resendVerification(email: string): Promise<void> {
  await api.post(`/auth/verify/resend?email=${encodeURIComponent(email)}`);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await api.post(`/auth/password/request`, { email });
}

export async function resetPassword(token: string, password: string): Promise<boolean> {
  try {
  await api.post(`/auth/password/reset`, { token, password });
    return true;
  } catch (e) {
    return false;
  }
}
