import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useForgotPassword } from '@/hooks/auth';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const {
    email,
    setEmail,
    error,
    isSending,
    handleSubmit,
  } = useForgotPassword();

  return (
    <div className="mx-auto grid w-[380px] gap-8">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#F7931E] transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Login</span>
      </button>

      <div className="grid gap-3 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Lupa Password</h1>
        <p className="text-gray-600">
          Masukkan email Anda untuk menerima link reset password
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

        <Button 
          type="submit" 
          disabled={isSending} 
          className="w-full h-12 rounded-xl bg-[#F7931E] hover:bg-[#E08319] text-white font-semibold text-base"
        >
          {isSending ? (
            <>
              <Spinner className="mr-2" />
              Mengirim...
            </>
          ) : (
            'Kirim Link Reset Password'
          )}
        </Button>
      </form>
    </div>
  );
}
