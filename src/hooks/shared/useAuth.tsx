import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearAuthTokens, getAuthTokens, getUserProfileAPI, loginAPI, logoutAPI, saveAuthTokens, type User } from '@/services/auth.service';
import { unregisterFcmToken } from '@/services/notification.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toTitleCaseName } from '@/lib/text';

// Key untuk menyimpan FCM token di localStorage
const FCM_TOKEN_KEY = 'fcm_token';

// Stable query key — JANGAN masukkan accessToken ke key.
// Memasukkan token ke key menyebabkan cache miss setiap kali token di-refresh
// sehingga isLoggedIn sempat false → redirect ke /login.
const AUTH_QUERY_KEY = ['auth-user'] as const;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeLoginSession: (session: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => Promise<void>;
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
  const hasAccessToken = Boolean(getAuthTokens().accessToken);

  // Ref untuk mencegah race condition:
  // Jika login berhasil, jangan biarkan background auth check yang gagal
  // menghapus token baru via clearAuthTokens().
  const loginInProgressRef = useRef(false);

  // Gunakan React Query untuk management state user & auth checking.
  // Query key STABIL (tidak mengandung accessToken) sehingga setQueryData
  // langsung match tanpa cache-miss.
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { accessToken } = getAuthTokens();
      if (!accessToken) return null;
      return await getUserProfileAPI();
    },
    staleTime: Infinity, // User data jarang berubah, manual refresh jika perlu
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 mins
    retry: false, // Jangan retry jika 401, langsung logout
    enabled: hasAccessToken && location.pathname !== '/auth/microsoft/callback', // Skip fetch saat callback process
  });

  // Handle error (misal token expired atau invalid)
  useEffect(() => {
    if (error) {
      console.error('[useAuth] Auth check failed:', error);
      if (location.pathname === '/auth/microsoft/callback') {
        return;
      }
      // Jangan clear token jika ada login baru yang sedang berjalan
      if (!loginInProgressRef.current) {
        clearAuthTokens();
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
      }
    }
  }, [error, location.pathname, queryClient]);

  // ─── Semua fungsi di-memoize dengan useCallback ───────────────────────
  // Ini KRITIS agar komponen consumer (terutama MicrosoftCallback) yang
  // memakai fungsi sebagai useEffect dependency tidak re-run setiap kali
  // AuthProvider re-render. Tanpa memoize, setUserDirectly berubah setiap
  // render → MicrosoftCallback useEffect re-run → URL sudah berubah →
  // tokensString null → redirect ke /login.

  const completeLoginSession = useCallback(async ({
    accessToken,
    refreshToken,
    user: userData,
  }: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => {
    loginInProgressRef.current = true;
    await queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY, exact: true });
    saveAuthTokens(accessToken, refreshToken);
    queryClient.setQueryData(AUTH_QUERY_KEY, userData);

    window.setTimeout(() => {
      loginInProgressRef.current = false;
    }, 1000);
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      // Tandai login sedang berlangsung agar background auth check
      // yang gagal tidak menghapus token baru
      loginInProgressRef.current = true;

      // Cancel query lama yang mungkin masih berjalan (stale session check)
      queryClient.cancelQueries({ queryKey: AUTH_QUERY_KEY });

      const response = await loginAPI({ email, password });
      await completeLoginSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      });
      toast.success('Login berhasil', {
        description: `Selamat datang, ${toTitleCaseName(response.user.fullName)}`,
      });
      navigate('/dashboard');
    } catch (error) {
      // If account is not verified, redirect to account-inactive page
      if ((error as any)?.code === 'NOT_VERIFIED') {
        navigate('/auth/inactive', { state: { email } });
        return;
      }
      throw error;
    } finally {
      loginInProgressRef.current = false;
    }
  }, [completeLoginSession, navigate, queryClient]);

  const logout = useCallback(async () => {
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
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear(); // Clear all cache
      navigate('/login');
    }
  }, [navigate, queryClient]);

  const refreshUser = useCallback(async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      clearAuthTokens();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      navigate('/login');
    }
  }, [refetch, navigate, queryClient]);

  // ─── Memoize context value ─────────────────────────────────────────────
  // Mencegah semua consumer re-render kecuali data yang mereka pakai berubah.
  const value: AuthContextType = useMemo(() => ({
    user: user || null,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    refreshUser,
    completeLoginSession,
  }), [user, isLoading, login, logout, refreshUser, completeLoginSession]);


  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
