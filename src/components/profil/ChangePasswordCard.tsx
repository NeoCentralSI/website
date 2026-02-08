import { Eye, EyeOff, Lock } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useChangePassword } from '@/hooks/profile';

export function ChangePasswordCard() {
  const {
    formData,
    updateField,
    error,
    isChanging,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    handleSubmit,
    resetForm,
  } = useChangePassword();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <Lock className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">Ubah Password</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 mb-4">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="currentPassword" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Password Saat Ini
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => updateField('currentPassword', e.target.value)}
                placeholder="••••••••"
                disabled={isChanging}
                className="h-9 text-sm pr-9 border-gray-300 focus:border-primary focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Password Baru
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => updateField('newPassword', e.target.value)}
                placeholder="Min. 8 karakter"
                disabled={isChanging}
                className="h-9 text-sm pr-9 border-gray-300 focus:border-primary focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
              Konfirmasi
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Ketik ulang password"
                disabled={isChanging}
                className="h-9 text-sm pr-9 border-gray-300 focus:border-primary focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isChanging}
            className="border-gray-300 hover:bg-gray-50 h-9"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isChanging}
            className="bg-primary hover:bg-primary/90 text-white h-9"
          >
            {isChanging ? (
              <>
                <Spinner className="mr-1.5 h-4 w-4" />
                Menyimpan...
              </>
            ) : (
              'Ubah Password'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
