import { User } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nama Lengkap
              </span>
              <p className="text-base font-medium text-gray-900 mt-1">{user?.fullName || '-'}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Email
              </span>
              <p className="text-base font-medium text-gray-900 mt-1">{user?.email || '-'}</p>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Nomor Telepon {!user?.phoneNumber && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => updateField('phoneNumber', e.target.value)}
                placeholder="Contoh: 081234567890"
                disabled={isSaving}
                className="h-9 text-sm border-gray-300 focus:border-primary focus:ring-primary mt-1"
              />
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Jenis Kelamin
              </span>
              <div className="h-9 px-3 flex items-center text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600 mt-1">
                {user?.gender === true ? 'Perempuan' : user?.gender === false ? 'Laki-laki' : 'Belum diatur'}
              </div>
              <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">
                * Hubungi admin untuk perubahan jenis kelamin
              </p>
            </div>

          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-4">{error}</p>
        )}

        <div className="flex justify-end mt-6">
          <Button
            type="submit"
            disabled={isSaving}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white h-9 px-8"
          >
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Menyimpan...
              </>
            ) : (
              'Simpan Perubahan'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

