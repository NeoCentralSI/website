import { useState } from 'react';
import { forgotPasswordAPI } from '@/services/auth.service';
import { toast } from 'sonner';

export const useForgotPassword = () => {
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
      await forgotPasswordAPI(email);
      toast.success('Email terkirim!', {
        description: 'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
      });
      setEmail('');
      return true;
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
