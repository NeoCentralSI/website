import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthTokens, getAuthTokens, getUserProfileAPI, loginAPI, logoutAPI, saveAuthTokens, type User } from '@/services/auth.service';
import { unregisterFcmToken } from '@/services/notification.service';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedRef = useRef(false);
  const navigate = useNavigate();

  // Check authentication on mount - ONLY ONCE (survives StrictMode double mount)
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;
    
    const checkAuth = async () => {
      try {
        const { accessToken } = getAuthTokens();
        
        if (accessToken) {
          const userData = await getUserProfileAPI();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('[useAuth] Error checking auth:', error);
        const errorMessage = error instanceof Error ? error.message : '';
        
        if (errorMessage.includes('Session expired') || errorMessage.includes('Invalid')) {
          clearAuthTokens();
        }
        
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await loginAPI({ email, password });
      
      saveAuthTokens(response.accessToken, response.refreshToken);
      setUser(response.user);
      navigate('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
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
      setUser(null);
      hasCheckedRef.current = false;
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const userData = await getUserProfileAPI();
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      clearAuthTokens();
      setUser(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const setUserDirectly = (userData: User) => {
    setUser(userData);
    setIsLoading(false);
    setHasChecked(true);
  };

  const value: AuthContextType = {
    user,
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
