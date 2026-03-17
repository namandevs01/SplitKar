import { create } from 'zustand';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('sk_token') || null,
  loading: true,
  isAuthenticated: false,

  setAuth: (user, token) => {
    localStorage.setItem('sk_token', token);
    set({ user, token, isAuthenticated: true, loading: false });
  },

  logout: () => {
    localStorage.removeItem('sk_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('sk_token');
    if (!token) return set({ loading: false });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch {
      set({ loading: false, isAuthenticated: false });
    }
  },

  updateUser: (updates) => set((s) => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;
