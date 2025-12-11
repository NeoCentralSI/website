import { useState } from 'react';
import { LoginCarousel } from '@/components/auth/LoginCarousel';
import { LoginForm } from '@/components/auth/LoginForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { ActivateAccountForm } from '@/components/auth/ActivateAccountForm';
import { useLoginRedirect } from '@/hooks/auth';

const Login = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isActivateAccount, setIsActivateAccount] = useState(false);

  // Handle redirects and URL params
  useLoginRedirect();

  const handleBack = () => {
    setIsForgotPassword(false);
    setIsActivateAccount(false);
  };

  const handleForgotPassword = () => {
    setIsForgotPassword(true);
    setIsActivateAccount(false);
  };

  const handleActivateAccount = () => {
    setIsForgotPassword(false);
    setIsActivateAccount(true);
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2">
      <LoginCarousel />

      <div className="flex items-center justify-center py-12">
        {isForgotPassword ? (
          <ForgotPasswordForm onBack={handleBack} />
        ) : isActivateAccount ? (
          <ActivateAccountForm onBack={handleBack} />
        ) : (
          <LoginForm
            onForgotPassword={handleForgotPassword}
            onActivateAccount={handleActivateAccount}
          />
        )}
      </div>
    </div>
  );
};

export default Login;
