import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthTokens, getAuthTokens, getUserProfileAPI, loginAPI, logoutAPI, saveAuthTokens, type User } from '@/services/auth.service';

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
  const [hasChecked, setHasChecked] = useState(false);
  const navigate = useNavigate();

  // Check authentication on mount - ONLY ONCE
  useEffect(() => {
    if (hasChecked) return;
    
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
        setHasChecked(true);
      }
    };

    checkAuth();
  }, [hasChecked]);

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
      if (getAuthTokens().accessToken) {
        await logoutAPI();
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      clearAuthTokens();
      setUser(null);
      setHasChecked(false);
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
