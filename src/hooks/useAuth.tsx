import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthTokens, getAuthTokens, getUserProfileAPI, loginAPI, logoutAPI, saveAuthTokens, type User } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  const navigate = useNavigate();

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { accessToken } = getAuthTokens();
        if (accessToken) {
          // Jika ada token, coba ambil data user
          const userData = await getUserProfileAPI();
          setUser(userData);
        }
      } catch (error) {
        // Jika gagal, clear tokens dan set user null
        console.error('Auth check failed:', error);
        clearAuthTokens();
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
      
      // Simpan token ke localStorage
      saveAuthTokens(response.accessToken, response.refreshToken);
      
      // Set user data
      setUser(response.user);
      
      // Navigate ke dashboard
      navigate('/dashboard');
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Panggil logout API jika ada token
      if (getAuthTokens().accessToken) {
        await logoutAPI();
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Meskipun API gagal, tetap clear local state
    } finally {
      // Clear local state dan redirect
      clearAuthTokens();
      setUser(null);
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
      // Jika gagal refresh, mungkin token expired, logout user
      clearAuthTokens();
      setUser(null);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
