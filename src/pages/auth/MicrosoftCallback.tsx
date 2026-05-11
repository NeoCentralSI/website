import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exchangeMicrosoftCodeAPI } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toTitleCaseName } from '@/lib/text';

const processedMicrosoftCodes = new Set<string>();

/**
 * Microsoft OAuth callback handler (frontend).
 *
 * Token tidak lagi dikirim lewat URL. Server hanya mengirim `?code=<oneShot>`
 * yang kemudian ditukar via POST /auth/microsoft/exchange (HTTPS body).
 * Code valid sekali pakai dan expire dalam 60 detik.
 */
export default function MicrosoftCallback() {
  const navigate = useNavigate();
  const { completeLoginSession } = useAuth();

  // Guard: cegah effect dijalankan lebih dari sekali (StrictMode + re-render).
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const exchangeCode = urlParams.get('code');

    const handleCallback = async () => {
      try {
        if (!exchangeCode) {
          navigate('/login', { replace: true });
          return;
        }

        if (processedMicrosoftCodes.has(exchangeCode)) {
          return;
        }

        processedRef.current = true;
        processedMicrosoftCodes.add(exchangeCode);

        const { accessToken, refreshToken, user, hasCalendarAccess } =
          await exchangeMicrosoftCodeAPI(exchangeCode);

        await completeLoginSession({ accessToken, refreshToken, user });
        localStorage.setItem('hasCalendarAccess', JSON.stringify(hasCalendarAccess ?? false));

        toast.success('Login berhasil', {
          description: `Selamat datang, ${toTitleCaseName(user.fullName)}`,
        });

        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('[MicrosoftCallback] exchange failed:', error);
        processedRef.current = true;
        if (exchangeCode) {
          processedMicrosoftCodes.delete(exchangeCode);
        }
        const message =
          error instanceof Error ? error.message : 'Login Microsoft gagal';
        toast.error('Login Microsoft gagal', { description: message });
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [completeLoginSession, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md space-y-6 p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}
