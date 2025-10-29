import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type UIState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
    }),
    {
      name: 'ui-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, theme: s.theme }),
    }
  )
);
