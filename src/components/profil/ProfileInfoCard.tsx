import { User } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/shared';
import { useProfileUpdate } from '@/hooks/profile';

export function ProfileInfoCard() {
  const { user } = useAuth();
  const {
    formData,
    updateField,
    error,
    isSaving,
    handleSubmit,
  } = useProfileUpdate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <User className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">Informasi Akun</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Nama Lengkap
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{user?.fullName || '-'}</p>
        </div>

        <div>
          <form onSubmit={handleSubmit}>
            <Label htmlFor="phoneNumber" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Nomor Telepon {!user?.phoneNumber && <span className="text-red-500">*</span>}
            </Label>
            {error && (
              <p className="text-xs text-red-600 mt-0.5">{error}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                placeholder="Contoh: 081234567890"
                disabled={isSaving}
                className="h-9 text-sm border-gray-300 focus:border-primary focus:ring-primary"
              />
              <Button
                type="submit"
                disabled={isSaving}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white h-9 px-5 shrink-0"
              >
                {isSaving ? <Spinner className="h-4 w-4" /> : 'Simpan'}
              </Button>
            </div>
          </form>
        </div>

        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Email
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">{user?.email || '-'}</p>
        </div>
      </div>
    </div>
  );
}
