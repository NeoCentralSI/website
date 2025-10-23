import { ArrowLeft, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { activateAccountAPI, forgotPasswordAPI, getRememberedEmail, saveRememberedEmail } from '../services/auth.service';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isActivateAccount, setIsActivateAccount] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { login, isLoading } = useAuth();

  // Load remembered email dari cookies saat component mount
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }

    // Handle query params dari redirect aktivasi akun dan reset password
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get('verified');
    const reset = urlParams.get('reset');
    const message = urlParams.get('message');

    if (verified && message) {
      if (verified === 'success') {
        toast.success('Aktivasi Berhasil!', {
          description: decodeURIComponent(message),
          duration: 5000,
        });
      } else if (verified === 'error') {
        toast.error('Aktivasi Gagal', {
          description: decodeURIComponent(message),
          duration: 5000,
        });
      }

      // Clear query params dari URL
      window.history.replaceState({}, document.title, '/login');
    }

    if (reset && message) {
      if (reset === 'error') {
        toast.error('Reset Password Gagal', {
          description: decodeURIComponent(message),
          duration: 5000,
        });
      }

      // Clear query params dari URL
      window.history.replaceState({}, document.title, '/login');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password);
      
      // Simpan data ke cookies jika remember me dicentang
      if (rememberMe) {
        saveRememberedEmail(email);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat login');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email harus diisi');
      return;
    }

    setIsSendingEmail(true);

    try {
      await forgotPasswordAPI(email);
      toast.success('Email terkirim!', {
        description: 'Link reset password telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
      });
      setEmail('');
      setIsForgotPassword(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email harus diisi');
      return;
    }

    setIsSendingEmail(true);

    try {
      const result = await activateAccountAPI(email);
      
      if (result.code === 'EMAIL_NOT_FOUND') {
        toast.error('Email tidak ditemukan', {
          description: result.message || 'Email tidak terdaftar. Silakan hubungi admin untuk aktivasi akun.',
        });
      } else if (result.code === 'ALREADY_VERIFIED') {
        toast.info('Akun sudah aktif', {
          description: result.message || 'Akun Anda sudah terverifikasi. Silakan login.',
        });
        setEmail('');
        setIsActivateAccount(false);
      } else {
        toast.success('Email aktivasi terkirim!', {
          description: 'Link aktivasi dan password sementara telah dikirim ke email Anda. Silakan cek inbox atau folder spam.',
        });
        setEmail('');
        setIsActivateAccount(false);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim email');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md lg:max-w-6xl shadow-2xl border-0 overflow-hidden rounded-4xl">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
            <div className='hidden lg:block pl-10'>
              <img 
                src="https://placehold.co/400x400"
                alt="placeholder"
                className="w-full h-full object-cover rounded-2xl"
              />
            </div>
            <div className="p-6 lg:p-12 flex flex-col justify-center bg-white">
              <div className="max-w-md mx-auto w-full">
                <div className="text-center mb-8">
                  {(isForgotPassword || isActivateAccount) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setIsActivateAccount(false);
                        setError('');
                      }}
                      className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Kembali ke Login</span>
                    </button>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {isForgotPassword ? 'Lupa Password' : isActivateAccount ? 'Aktivasi Akun' : 'Selamat Datang'}
                  </h1>
                  <p className="text-gray-600">
                    {isForgotPassword 
                      ? 'Masukkan email Anda untuk menerima link reset password'
                      : isActivateAccount
                      ? 'Masukkan email Anda untuk menerima link aktivasi dan password sementara'
                      : 'Masuk ke akun Anda untuk melanjutkan'}
                  </p>
                </div>

                <form onSubmit={isForgotPassword ? handleForgotPassword : isActivateAccount ? handleActivateAccount : handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Masukkan email Anda"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  {!isForgotPassword && !isActivateAccount && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password Anda"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-12 border-gray-300 focus:border-primary focus:ring-primary"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                          />
                          <Label htmlFor="remember" className="text-sm text-gray-700">
                            Ingat saya
                          </Label>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setError('');
                          }}
                          className="text-sm text-primary hover:text-primary/80"
                        >
                          Lupa password?
                        </button>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    disabled={(isForgotPassword || isActivateAccount) ? isSendingEmail : isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isForgotPassword 
                      ? (isSendingEmail ? 'Mengirim...' : 'Kirim Link Reset Password')
                      : isActivateAccount
                      ? (isSendingEmail ? 'Mengirim...' : 'Kirim Link Aktivasi')
                      : (isLoading ? 'Memproses...' : 'Masuk')}
                  </Button>

                  {!isForgotPassword && !isActivateAccount && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Belum aktivasi akun?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsActivateAccount(true);
                            setError('');
                          }}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Aktivasi di sini
                        </button>
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
