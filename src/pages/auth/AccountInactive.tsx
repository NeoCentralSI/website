import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Lottie from 'lottie-react';
import failedAnimation from '@/assets/lottie/failed.json';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { activateAccountAPI } from '@/services/auth.service';
import { toast } from 'sonner';

export default function AccountInactive() {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [isSending, setIsSending] = useState(false);

  const handleActivate = async () => {
    if (!email) {
      toast.error('Email harus diisi');
      return;
    }

    setIsSending(true);
    try {
      const result = await activateAccountAPI(email);

      if (result.code === 'EMAIL_NOT_FOUND') {
        toast.error('Email tidak ditemukan', {
          description: result.message || 'Email tidak terdaftar. Silakan hubungi admin.',
        });
      } else if (result.code === 'ALREADY_VERIFIED') {
        toast.info('Akun sudah aktif', {
          description: 'Akun Anda sudah aktif. Silakan login.',
        });
        navigate('/login');
      } else {
        // Navigate to email sent confirmation page
        navigate('/activation-email-sent', { state: { email } });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md w-full">
        <Lottie
          animationData={failedAnimation}
          loop={false}
          className="w-64 h-64"
        />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Akun Belum Diaktivasi
        </h1>
        <p className="mt-2 text-base text-gray-500 max-w-sm">
          Akun Anda belum aktif. Silakan kirim ulang email aktivasi untuk mengaktifkan akun Anda.
        </p>

        <div className="mt-6 w-full max-w-sm space-y-3">
          {!emailFromState && (
            <Input
              type="email"
              placeholder="Masukkan email Anda"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-center"
            />
          )}
          <Button
            onClick={handleActivate}
            disabled={isSending || !email}
            className="w-full"
          >
            {isSending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Mengirim...
              </>
            ) : (
              'Kirim Email Aktivasi'
            )}
          </Button>
          <Button
            variant="outline"
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
