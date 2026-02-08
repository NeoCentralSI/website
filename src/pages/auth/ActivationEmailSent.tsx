import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Lottie from 'lottie-react';
import completeAnimation from '@/assets/lottie/complete.json';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { activateAccountAPI } from '@/services/auth.service';
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

const COOLDOWN_SECONDS = 60;

export default function ActivationEmailSent() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [isSending, setIsSending] = useState(false);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = useCallback(async () => {
    if (!email || cooldown > 0) return;

    setIsSending(true);
    try {
      const result = await activateAccountAPI(email);

      if (result.code === 'EMAIL_NOT_FOUND') {
        toast.error('Email tidak ditemukan', {
          description: result.message || 'Email tidak terdaftar.',
        });
      } else if (result.code === 'ALREADY_VERIFIED') {
        toast.info('Akun sudah aktif', {
          description: 'Akun Anda sudah aktif. Silakan login.',
        });
        navigate('/login');
      } else {
        toast.success('Email aktivasi berhasil dikirim ulang!');
        setCooldown(COOLDOWN_SECONDS);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsSending(false);
    }
  }, [email, cooldown, navigate]);

  // If no email in state, redirect to login
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, '0')}`
      : `${secs} detik`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <Lottie
          animationData={completeAnimation}
          loop={false}
          className="w-56 h-56"
        />

        <div className="mt-2 flex items-center justify-center gap-2">
          <Mail className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-gray-900">
            Email Aktivasi Terkirim!
          </h1>
        </div>

        <p className="mt-3 text-base text-gray-500 max-w-sm">
          Link aktivasi telah dikirim ke <span className="font-semibold text-gray-700">{email}</span>. Silakan cek inbox Outlook Anda.
        </p>

        <p className="mt-2 text-sm text-gray-400">
          Jika tidak menerima email, cek folder spam atau kirim ulang.
        </p>

        <div className="mt-6 w-full max-w-sm space-y-3">
          <Button
            onClick={handleResend}
            disabled={isSending || cooldown > 0}
            variant="outline"
            className="w-full"
          >
            {isSending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Mengirim...
              </>
            ) : cooldown > 0 ? (
              `Kirim Ulang (${formatTime(cooldown)})`
            ) : (
              'Kirim Ulang Email Aktivasi'
            )}
          </Button>

          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Kembali ke Login
          </Button>
        </div>
      </div>
    </div>
  );
}
