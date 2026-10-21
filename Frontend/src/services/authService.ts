import {
  apiRequest,
  clearSessionToken,
  getSessionToken,
  setSessionToken,
} from '../api/client';
import type { CurrentUser, LoginResponse, MeResponse } from '../types/lead';

function extractToken(response: LoginResponse): string | null {
  return (
    response.session_token ??
    response.token ??
    response.data?.session_token ??
    response.data?.token ??
    null
  );
}

function extractUser(response: MeResponse): CurrentUser | null {
  return response.data ?? response.user ?? null;
}

export const authService = {
  hasToken(): boolean {
    return getSessionToken() !== null;
  },

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = extractToken(response);
    if (!token) {
      throw new Error('Backend đăng nhập thành công nhưng không trả session_token.');
    }

    setSessionToken(token);
    return response;
  },

  async me(): Promise<CurrentUser> {
    const response = await apiRequest<MeResponse>('/me');
    const user = extractUser(response);

    if (!user) {
      throw new Error('Không đọc được thông tin người dùng từ API /me.');
    }

    return user;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest<unknown>('/logout', { method: 'POST' });
    } finally {
      clearSessionToken();
    }
  },
};
