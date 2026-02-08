import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateAccountAPI } from '@/services/auth.service';
import { toast } from 'sonner';

export const useActivateAccount = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email harus diisi');
      return;
    }

    setIsSending(true);

    try {
      const result = await activateAccountAPI(email);
      
      if (result.code === 'EMAIL_NOT_FOUND') {
        toast.error('Email tidak ditemukan', {
          description: result.message || 'Email tidak terdaftar. Silakan hubungi admin untuk aktivasi akun.',
        });
      } else if (result.code === 'ALREADY_VERIFIED') {
        toast.info('Akun sudah aktif', {
          description: 'Akun Anda sudah aktif. Silakan login.',
        });
        setEmail('');
        return true;
      } else {
        // Navigate to email sent confirmation page
        navigate('/activation-email-sent', { state: { email } });
        setEmail('');
        return true;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim email');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    email,
    setEmail,
    error,
    setError,
    isSending,
    handleSubmit,
  };
};
