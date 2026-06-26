import Lottie from 'lottie-react';
import serverErrorAnimation from '@/assets/lottie/server_eror.json';
import { Button } from '@/components/ui/button';

interface ServerErrorProps {
  onRetry: () => void;
}

export default function ServerError({ onRetry }: ServerErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <Lottie animationData={serverErrorAnimation} loop={true} className="w-64 h-64 mx-auto" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Terjadi Kesalahan Server</h1>
          <p className="text-muted-foreground text-sm">
            Maaf, server sedang mengalami gangguan atau masalah internal saat ini. Silakan coba beberapa saat lagi.
          </p>
        </div>
        <Button onClick={onRetry} className="w-full sm:w-auto">
          Kembali & Coba Lagi
        </Button>
      </div>
    </div>
  );
}
