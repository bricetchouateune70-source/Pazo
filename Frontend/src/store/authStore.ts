import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet, apiPost } from '@/lib/api';
import type { Role } from '@pazo/shared';

interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await apiPost<{ success: boolean; data: { user: User } }>(
      '/api/auth/login',
      { email, password }
    );
    set({ user: response.data.user, isAuthenticated: true });
  },

  register: async (email, password, name) => {
    const response = await apiPost<{ success: boolean; data: { user: User } }>(
      '/api/auth/register',
      { email, password, name }
    );
    set({ user: response.data.user, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await apiPost('/api/auth/logout');
    } catch (e) {
      // Ignorieren - logout trotzdem durchführen
    }
    set({ user: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const response = await apiGet<{ success: boolean; data: User }>('/api/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (e) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));
