import { API_CONFIG, getApiUrl } from '../config/api';
import { logApi } from '@/utils/logger';
import { clearAllAuthCookies, getCookie, setCookie } from '../utils/cookies';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
  status: 'active' | 'inactive';
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: Role[];
}

export interface LoginResponse {
  success: boolean;
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const loginAPI = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login gagal');
    }

    const data: LoginResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat menghubungi server');
  }
};

export const saveAuthTokens = (accessToken: string, refreshToken: string) => {
  // Access token tetap di localStorage (lebih mudah untuk API calls)
  localStorage.setItem('accessToken', accessToken);
  
  // Refresh token disimpan di cookies (lebih aman, httpOnly bisa ditambahkan di backend)
  setCookie('refreshToken', refreshToken, 7); // 7 hari
};

export const getAuthTokens = () => {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: getCookie('refreshToken')
  };
};

// Function untuk logout API
export const logoutAPI = async (): Promise<void> => {
  try {
    const { accessToken } = getAuthTokens();
    
    if (!accessToken) {
      throw new Error('Access token tidak ditemukan');
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Logout gagal');
    }

    clearAuthTokens();
  } catch (error) {
    clearAuthTokens();
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat logout');
  }
};

export const saveRememberedEmail = (email: string) => {
  setCookie('rememberedEmail', email, 30); // 30 hari
};

export const getRememberedEmail = (): string | null => {
  return getCookie('rememberedEmail');
};

export const clearAuthTokens = () => {
  localStorage.removeItem('accessToken');
  clearAllAuthCookies(); // Clear refresh token dan remembered email dari cookies
};

export const isAuthenticated = (): boolean => {
  const { accessToken } = getAuthTokens();
  return !!accessToken;
};

// Global lock to prevent multiple simultaneous refresh token calls
let refreshTokenPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

export const refreshTokenAPI = async (): Promise<{ accessToken: string; refreshToken: string }> => {
  // If a refresh is already in progress, return the existing promise
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  // Create and store the refresh promise
  refreshTokenPromise = (async () => {
    try {
      const { refreshToken } = getAuthTokens();
      
      if (!refreshToken) {
        throw new Error('Refresh token tidak ditemukan');
      }

      const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Refresh token gagal');
      }

      const data = await response.json();
      
      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error) {
      clearAuthTokens();
      throw error;
    } finally {
      // Clear the promise after completion (success or failure)
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

export const getUserProfileAPI = async (): Promise<User> => {
  try {
    const { accessToken } = getAuthTokens();
    
    if (!accessToken) {
      throw new Error('Access token tidak ditemukan');
    }

    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.ME), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        try {
          const newTokens = await refreshTokenAPI();
          saveAuthTokens(newTokens.accessToken, newTokens.refreshToken);
          
          const retryResponse = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.ME), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newTokens.accessToken}`,
            },
          });
          
          if (!retryResponse.ok) {
            throw new Error('Invalid session');
          }
          
          const userData = await retryResponse.json();
          return userData.user;
        } catch {
          // Don't clear tokens here - let the refresh token function handle it
          throw new Error('Session expired, silakan login kembali');
        }
      }
      
      // For other errors, don't clear tokens
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || 'Gagal mengambil data user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengambil data user');
  }
};

export const apiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const { accessToken } = getAuthTokens();
  
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const baseHeaders: HeadersInit = {
    ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
  };
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...baseHeaders,
      ...options.headers,
    },
  };

  const started = performance.now?.() ?? Date.now();
  let response = await fetch(url, requestOptions);
  logApi({ url, method: requestOptions.method, status: response.status, ok: response.ok, durationMs: (performance.now?.() ?? Date.now()) - started });

  if (response.status === 401 && accessToken) {
    try {
      const newTokens = await refreshTokenAPI();
      saveAuthTokens(newTokens.accessToken, newTokens.refreshToken);
      
      requestOptions.headers = {
        ...requestOptions.headers,
        Authorization: `Bearer ${newTokens.accessToken}`,
      };
      const retryStart = performance.now?.() ?? Date.now();
      response = await fetch(url, requestOptions);
      logApi({ url, method: requestOptions.method, status: response.status, ok: response.ok, durationMs: (performance.now?.() ?? Date.now()) - retryStart, note: 'retry-after-refresh' });
    } catch (refreshError) {
      clearAuthTokens();
      window.location.href = '/login';
      throw refreshError;
    }
  }

  return response;
};

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePasswordAPI = async (data: ChangePasswordRequest): Promise<void> => {
  try {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.CHANGE_PASSWORD), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengubah password');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengubah password');
  }
};

export interface ForgotPasswordRequest {
  email: string;
}

export const forgotPasswordAPI = async (email: string): Promise<void> => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengirim email reset password');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengirim email reset password');
  }
};

export interface ActivateAccountResponse {
  found: boolean;
  alreadyVerified?: boolean;
  sent?: boolean;
  message?: string;
  code?: string;
}

export const activateAccountAPI = async (email: string): Promise<ActivateAccountResponse> => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.ACTIVATE_ACCOUNT), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengirim email aktivasi');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mengirim email aktivasi');
  }
};

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export const resetPasswordAPI = async (data: ResetPasswordRequest): Promise<void> => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mereset password');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Terjadi kesalahan saat mereset password');
  }
};
