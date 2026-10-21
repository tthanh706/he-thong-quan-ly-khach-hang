import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginPayload } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (payload) => {
        const res = await authApi.login(payload);
        localStorage.setItem('session_token', res.session_token);
        set({ user: res.user, token: res.session_token });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Bỏ qua lỗi backend nếu có
        } finally {
          localStorage.removeItem('session_token');
          localStorage.removeItem('auth-store');
          sessionStorage.clear();
          set({ user: null, token: null });
        }
      },

      setUser: (user) => set({ user }),
    }),
    { name: 'auth-store', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);
