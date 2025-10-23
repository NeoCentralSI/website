import { ENV } from './env';

// Konfigurasi API
export const API_CONFIG = {
  BASE_URL: ENV.API_BASE_URL,
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      LOGOUT: '/auth/logout',
      ME: '/auth/me',
    },
    USER: {
      PROFILE: '/user/profile',
    },
  },
  TIMEOUT: 10000, // 10 detik
};

// Helper function untuk membuat full URL
export const getApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
