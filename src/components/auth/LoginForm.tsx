import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { MicrosoftLoginButton } from '@/components/auth/MicrosoftLoginButton';
import { useLoginForm } from '@/hooks/auth';

interface LoginFormProps {
  onForgotPassword: () => void;
  onActivateAccount: () => void;
}

export function LoginForm({ onForgotPassword, onActivateAccount }: LoginFormProps) {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    error,
    isLoading,
    handleSubmit,
  } = useLoginForm();

  return (
    <div className="mx-auto grid w-[380px] gap-8">
      <div className="grid gap-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Selamat Datang</h1>
        <p className="text-gray-600">
          Masuk ke akun Neo Central Anda
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@unand.ac.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-xl border-gray-200 focus:border-[#F7931E] focus:ring-[#F7931E]"
            required
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="ml-auto inline-block text-sm text-[#F7931E] hover:text-[#E08319] font-medium"
            >
              Lupa password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-xl border-gray-200 focus:border-[#F7931E] focus:ring-[#F7931E] pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
            className="border-gray-300 data-[state=checked]:bg-[#F7931E] data-[state=checked]:border-[#F7931E]"
          />
          <Label htmlFor="remember" className="text-sm font-normal text-gray-600">
            Ingat saya
          </Label>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading} 
          className="w-full h-12 rounded-xl bg-[#F7931E] hover:bg-[#E08319] text-white font-semibold text-base"
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Memproses...
            </>
          ) : (
            'Masuk'
          )}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-gray-500">
              Atau
            </span>
          </div>
        </div>

        <MicrosoftLoginButton disabled={isLoading} />
      </form>

      <div className="text-center text-sm text-gray-600">
        Belum aktivasi akun?{' '}
        <button
          type="button"
          onClick={onActivateAccount}
          className="text-[#F7931E] hover:text-[#E08319] font-semibold"
        >
          Aktivasi di sini
        </button>
      </div>
    </div>
  );
}
