import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveAuthTokens } from '@/services/auth.service';
import { useAuth } from '@/hooks/shared';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { toTitleCaseName } from '@/lib/text';

export default function MicrosoftCallback() {
  console.log('🔵 [MicrosoftCallback] Component MOUNTED');
  
  const navigate = useNavigate();
  const { setUserDirectly } = useAuth();

  useEffect(() => {
    console.log('🔵 [MicrosoftCallback] useEffect RUNNING');
    
    const handleCallback = async () => {
      try {
        console.log('🔍 Callback started');
        console.log('📍 Current URL:', window.location.href);
        
        // Get tokens from URL query params (backend redirect with tokens)
        const urlParams = new URLSearchParams(window.location.search);
        const tokensString = urlParams.get('tokens');
        
        console.log('🔑 Tokens string:', tokensString ? 'EXISTS' : 'MISSING');

        if (!tokensString) {
          console.error('⚠️ Tokens not found, redirecting to login...');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          return;
        }

        // Decode base64 tokens
        console.log('🔓 Decoding tokens...');
        const decodedString = atob(tokensString);
        const { accessToken, refreshToken, user, hasCalendarAccess } = JSON.parse(decodedString);
        
        console.log('✅ User:', user.fullName);
        console.log('📅 Calendar Access:', hasCalendarAccess ? 'Yes' : 'No');

        // Save tokens
        console.log('💾 Saving tokens...');
        saveAuthTokens(accessToken, refreshToken);

        // Save calendar access status
        localStorage.setItem('hasCalendarAccess', JSON.stringify(hasCalendarAccess ?? false));

        // Delay untuk ensure tokens saved
        await new Promise(resolve => setTimeout(resolve, 300));

        // Set user langsung tanpa fetch API (hindari double load)
        console.log('👤 Setting user directly...');
        setUserDirectly(user);

        // Delay untuk ensure state updated
        await new Promise(resolve => setTimeout(resolve, 300));

        // Clear URL query params
        window.history.replaceState(null, '', '/auth/microsoft/callback');

        // Final delay before redirect
        console.log('⏳ Finalizing...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Show login success notification
        toast.success('Login berhasil', {
          description: `Selamat datang, ${toTitleCaseName(user.fullName)}`,
        });

        // Redirect to dashboard dengan SPA navigation
        console.log('🚀 Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('❌ Callback error:', error);
        // Jangan tampilkan error, langsung redirect ke login
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
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
