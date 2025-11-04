import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { activateAccountAPI, forgotPasswordAPI, getRememberedEmail, saveRememberedEmail } from '../services/auth.service';
import { toast } from 'sonner';
import { Carousel, CarouselContent, CarouselItem } from '../components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isActivateAccount, setIsActivateAccount] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const { login, isLoading, isLoggedIn, user } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && isLoggedIn && user) {
      window.location.href = '/dashboard';
    }
  }, [isLoading, isLoggedIn, user]);

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

  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const carouselImages = [
    {
      url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80',
      alt: 'University Campus',
    },
    {
      url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop&q=80',
      alt: 'Students Studying',
    },
    {
      url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1200&auto=format&fit=crop&q=80',
      alt: 'Library Study',
    },
    {
      url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&auto=format&fit=crop&q=80',
      alt: 'Education Workspace',
    },
  ];

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      {/* Left Column - Image Carousel */}
      <div className="hidden bg-muted lg:block relative">
        <Carousel
          plugins={[plugin.current]}
          className="w-full h-full"
          onMouseEnter={() => plugin.current.stop()}
          onMouseLeave={() => plugin.current.play()}
        >
          <CarouselContent>
            {carouselImages.map((image, index) => (
              <CarouselItem key={index}>
                <div className="h-screen relative">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        {/* Logo or Quote Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white z-10">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Sistem informasi tugas akhir yang memudahkan mahasiswa dan dosen dalam mengelola proses bimbingan."
            </p>
            <footer className="text-sm">Neo Central - Sistem Informasi DSI</footer>
          </blockquote>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          {(isForgotPassword || isActivateAccount) && (
            <button
              type="button"
              onClick={() => {
                setIsForgotPassword(false);
                setIsActivateAccount(false);
                setError('');
              }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Login</span>
            </button>
          )}
          
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold">
              {isForgotPassword ? 'Lupa Password' : isActivateAccount ? 'Aktivasi Akun' : 'Login'}
            </h1>
            <p className="text-balance text-muted-foreground">
              {isForgotPassword 
                ? 'Masukkan email Anda untuk menerima link reset password'
                : isActivateAccount
                ? 'Masukkan email Anda untuk menerima link aktivasi dan password sementara'
                : 'Masukkan email Anda di bawah untuk login ke akun Anda'}
            </p>
          </div>

          <form onSubmit={isForgotPassword ? handleForgotPassword : isActivateAccount ? handleActivateAccount : handleSubmit} className="grid gap-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {!isForgotPassword && !isActivateAccount && (
              <>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                      }}
                      className="ml-auto inline-block text-sm underline"
                    >
                      Lupa password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Ingat saya
                  </Label>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={(isForgotPassword || isActivateAccount) ? isSendingEmail : isLoading}
              className="w-full"
            >
              {isForgotPassword 
                ? (isSendingEmail ? 'Mengirim...' : 'Kirim Link Reset Password')
                : isActivateAccount
                ? (isSendingEmail ? 'Mengirim...' : 'Kirim Link Aktivasi')
                : (isLoading ? 'Memproses...' : 'Login')}
            </Button>
          </form>

          {!isForgotPassword && !isActivateAccount && (
            <div className="mt-4 text-center text-sm">
              Belum aktivasi akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsActivateAccount(true);
                  setError('');
                }}
                className="underline"
              >
                Aktivasi di sini
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
