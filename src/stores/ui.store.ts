import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// All available menu keys
export const MENU_KEYS = {
  DASHBOARD: 'Dashboard',
  KERJA_PRAKTIK: 'Kerja Praktek',
  TUGAS_AKHIR: 'Tugas Akhir',
  MASTER_DATA: 'Master Data',
  YUDISIUM: 'Yudisium',
} as const;

export type MenuKey = typeof MENU_KEYS[keyof typeof MENU_KEYS];

type UIState = {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  theme: 'light' | 'dark' | 'system';
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  // Sidebar menu visibility settings
  hiddenMenus: string[];
  toggleMenuVisibility: (menuTitle: string) => void;
  setHiddenMenus: (menus: string[]) => void;
  isMenuVisible: (menuTitle: string) => boolean;
  // Settings dialog
  sidebarSettingsOpen: boolean;
  setSidebarSettingsOpen: (v: boolean) => void;
};

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      theme: 'light',
      setTheme: (t) => set({ theme: t }),
      // Hidden menus - stores titles of menus that should be hidden
      hiddenMenus: [],
      toggleMenuVisibility: (menuTitle) => {
        const current = get().hiddenMenus;
        if (current.includes(menuTitle)) {
          set({ hiddenMenus: current.filter(m => m !== menuTitle) });
        } else {
          set({ hiddenMenus: [...current, menuTitle] });
        }
      },
      setHiddenMenus: (menus) => set({ hiddenMenus: menus }),
      isMenuVisible: (menuTitle) => !get().hiddenMenus.includes(menuTitle),
      // Settings dialog state
      sidebarSettingsOpen: false,
      setSidebarSettingsOpen: (v) => set({ sidebarSettingsOpen: v }),
    }),
    {
      name: 'ui-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ 
        sidebarCollapsed: s.sidebarCollapsed, 
        theme: s.theme,
        hiddenMenus: s.hiddenMenus,
      }),
    }
  )
);
