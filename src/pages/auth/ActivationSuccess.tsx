import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import completeAnimation from '@/assets/lottie/complete.json';
import { Button } from '@/components/ui/button';

export default function ActivationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <Lottie
          animationData={completeAnimation}
          loop={false}
          className="w-64 h-64"
        />
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          Akun Berhasil Diaktivasi!
        </h1>
        <p className="mt-2 text-base text-gray-500 max-w-sm">
          Akun Anda sudah aktif. Silakan login dengan password yang telah dikirim ke email Anda.
        </p>
        <Button
          onClick={() => navigate('/login')}
          className="mt-6"
        >
          Ke Halaman Login
        </Button>
      </div>
    </div>
  );
}
