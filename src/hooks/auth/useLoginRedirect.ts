import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/shared';

export const useLoginRedirect = () => {
  const { isLoading, isLoggedIn, user } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    if (!isLoading && isLoggedIn && user) {
      window.location.href = '/dashboard';
    }
  }, [isLoading, isLoggedIn, user]);

  useEffect(() => {
    // Handle query params dari redirect aktivasi akun dan reset password
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const reset = urlParams.get('reset');
    const message = urlParams.get('message');
    const oauthError = urlParams.get('error');

    if (verified && message) {
      if (verified === 'success') {
        toast.success('Aktivasi Berhasil!', {
          description: 'Akun Anda sudah aktif. Silakan login dengan Microsoft.',
          duration: 5000,
        });
      } else if (verified === 'error') {
        toast.error('Aktivasi Gagal', {
          description: decodeURIComponent(message),
          duration: 5000,
        });
      }

      // Clear query params dari URL
      window.history.replaceState({}, document.title, '/login');
    }

    if (reset && message) {
      if (reset === 'error') {
        toast.error('Reset Password Gagal', {
          description: decodeURIComponent(message),
          duration: 5000,
        });
      }

      // Clear query params dari URL
      window.history.replaceState({}, document.title, '/login');
    }

    // Handle Microsoft OAuth errors
    if (oauthError) {
      toast.error('Login Microsoft Gagal', {
        description: decodeURIComponent(oauthError),
        duration: 5000,
      });

      // Clear query params dari URL
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);
};
