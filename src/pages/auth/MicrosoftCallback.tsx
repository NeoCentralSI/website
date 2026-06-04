import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAuthTokens } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toTitleCaseName } from '@/lib/text';
import { API_CONFIG, getApiUrl } from '@/config/api';

export default function MicrosoftCallback() {
  const navigate = useNavigate();
  const { setUserDirectly } = useAuth();
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

        processedRef.current = true;

        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.MICROSOFT_EXCHANGE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: exchangeCode }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Exchange failed');
        }

        const { accessToken, refreshToken, user, hasCalendarAccess } = result.data;

        saveAuthTokens(accessToken, refreshToken);
        localStorage.setItem('hasCalendarAccess', JSON.stringify(hasCalendarAccess ?? false));
        setUserDirectly(user);

        toast.success('Login berhasil', {
          description: `Selamat datang, ${toTitleCaseName(user.fullName)}`,
        });

        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Callback error:', error);
        processedRef.current = true;
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, setUserDirectly]);

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
