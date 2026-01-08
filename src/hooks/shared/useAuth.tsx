import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearAuthTokens, getAuthTokens, getUserProfileAPI, loginAPI, logoutAPI, saveAuthTokens, type User } from '@/services/auth.service';
import { unregisterFcmToken } from '@/services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// Key untuk menyimpan FCM token di localStorage
const FCM_TOKEN_KEY = 'fcm_token';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUserDirectly: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Gunakan React Query untuk management state user & auth checking
  // Ini otomatis handle caching, deduplication, dan revalidation
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { accessToken } = getAuthTokens();
      if (!accessToken) return null;
      return await getUserProfileAPI();
    },
    staleTime: Infinity, // User data jarang berubah, manual refresh jika perlu
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 mins
    retry: false, // Jangan retry jika 401, langsung logout
    enabled: location.pathname !== '/auth/microsoft/callback', // Skip fetch saat callback process
  });

  // Handle error (misal token expired atau invalid)
  useEffect(() => {
    if (error) {
      console.error('[useAuth] Auth check failed:', error);
      clearAuthTokens();
      queryClient.setQueryData(['auth-user'], null);
    }
  }, [error, queryClient]);

  const login = async (email: string, password: string) => {
    try {
      const response = await loginAPI({ email, password });
      
      saveAuthTokens(response.accessToken, response.refreshToken);
      queryClient.setQueryData(['auth-user'], response.user);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Unregister FCM token first, before logout invalidates the auth token
      const fcmToken = localStorage.getItem(FCM_TOKEN_KEY);
      if (fcmToken && getAuthTokens().accessToken) {
        try {
          await unregisterFcmToken(fcmToken);
          localStorage.removeItem(FCM_TOKEN_KEY);
        } catch (fcmError) {
          console.error('FCM unregister error (ignored):', fcmError);
        }
      }
      
      // Now call logout API
      if (getAuthTokens().accessToken) {
        await logoutAPI();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthTokens();
      localStorage.removeItem(FCM_TOKEN_KEY);
      queryClient.setQueryData(['auth-user'], null);
      queryClient.clear(); // Clear all cache
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      clearAuthTokens();
      queryClient.setQueryData(['auth-user'], null);
      navigate('/login');
    }
  };

  const setUserDirectly = (userData: User) => {
    queryClient.setQueryData(['auth-user'], userData);
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    refreshUser,
    setUserDirectly
  };


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
