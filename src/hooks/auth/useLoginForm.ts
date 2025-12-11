import { useState } from "react";
import { useAuth } from '@/hooks/shared';
import { saveRememberedEmail } from '@/services/auth.service';

export const useLoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      
      // Simpan data ke cookies jika remember me dicentang
      if (rememberMe) {
        saveRememberedEmail(email);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    error,
    setError,
    isLoading,
    handleSubmit,
  };
};
