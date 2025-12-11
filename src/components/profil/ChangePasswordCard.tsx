import { Lock, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="bg-red-100 p-2 rounded-lg">
          <Lock className="h-5 w-5 text-red-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Keamanan Akun</h2>
          <p className="text-sm text-gray-600 mt-1">Ubah password untuk meningkatkan keamanan</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700 mb-2 block">
            Password Saat Ini
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={(e) => updateField('currentPassword', e.target.value)}
              placeholder="••••••••••••••"
              disabled={isChanging}
              className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700 mb-2 block">
            Password Baru
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={(e) => updateField('newPassword', e.target.value)}
              placeholder="Min. 6 karakter"
              disabled={isChanging}
              className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-2 block">
            Konfirmasi Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="Ketik ulang password"
              disabled={isChanging}
              className="pr-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={resetForm}
            disabled={isChanging}
            className="px-6 py-2 border-gray-300 hover:bg-gray-50"
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isChanging}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8"
          >
            {isChanging ? 'Menyimpan...' : 'Ubah Password'}
          </Button>
        </div>
      </form>
    </div>
  );
}
