import { create } from 'zustand';
import axios from 'axios';

interface User {
  _id: string;
  email: string;
  name?: string;
  token?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isLoading: true,
  login: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isLoading: false });
  },
  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspaceId');
    set({ user: null, isLoading: false });
  },
  checkAuth: async () => {
    const existing = get().user;
    if (!existing || !existing.token) {
      get().logout();
      return;
    }
    try {
      const { data } = await axios.get('/api/auth/profile');
      const updatedUser = { ...data, token: existing.token };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser, isLoading: false });
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      get().logout();
    }
  },
}));
