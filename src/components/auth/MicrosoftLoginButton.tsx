import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ENV } from '@/config/env';

interface MicrosoftLoginButtonProps {
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

export function MicrosoftLoginButton({ 
  disabled = false, 
  variant = 'outline',
  className = ''
}: MicrosoftLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleMicrosoftLogin = () => {
    setIsLoading(true);
    // Redirect langsung ke backend endpoint yang akan redirect ke Microsoft
    window.location.href = `${ENV.API_BASE_URL}/auth/microsoft/login`;
  };

  return (
    <Button
      type="button"
      variant={variant}
      disabled={disabled || isLoading}
      onClick={handleMicrosoftLogin}
      className={`w-full h-12 rounded-xl border-gray-200 hover:border-[#F7931E] hover:bg-[#FFF8F0] text-gray-700 font-medium ${className}`}
    >
      <svg className="mr-2 h-5 w-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
      </svg>
      {isLoading ? 'Mengarahkan...' : 'Masuk dengan Microsoft'}
    </Button>
  );
}
