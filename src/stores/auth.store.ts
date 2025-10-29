import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type User = {
  id: string;
  name: string;
  email: string;
  role?: string;
} | null;

type AuthState = {
  user: User;
  token: string | null;
  setAuth: (payload: { user: User; token: string | null }) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: ({ user, token }) => set({ user, token }),
      clear: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);
