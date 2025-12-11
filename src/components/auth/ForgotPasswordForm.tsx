import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="mx-auto grid w-[350px] gap-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Login</span>
      </button>

      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Lupa Password</h1>
        <p className="text-balance text-muted-foreground">
          Masukkan email Anda untuk menerima link reset password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
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

        <Button type="submit" disabled={isSending} className="w-full">
          {isSending ? 'Mengirim...' : 'Kirim Link Reset Password'}
        </Button>
      </form>
    </div>
  );
}
