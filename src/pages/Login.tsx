import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';
import { getRememberedEmail, saveRememberedEmail } from '../services/auth.service';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  // Load remembered email dari cookies saat component mount
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Selamat Datang
                  </h1>
                  <p className="text-gray-600">
                    Masuk ke akun Anda untuk melanjutkan
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                    <a href="#" className="text-sm text-primary hover:text-primary/80">
                      Lupa password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-sm text-gray-600">
                    Belum punya akun?{' '}
                    <a href="#" className="text-primary hover:text-primary/80 font-medium">
                      Daftar di sini
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
