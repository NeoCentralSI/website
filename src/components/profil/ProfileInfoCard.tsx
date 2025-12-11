import { User, Phone, CheckCircle, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="bg-orange-100 p-2 rounded-lg">
          <User className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900">Informasi Akun</h2>
          <p className="text-sm text-gray-600 mt-1">Data pribadi dan identitas Anda</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2 block">
            Nama Lengkap
          </Label>
          <Input
            id="fullName"
            type="text"
            value={user?.fullName || ''}
            disabled
            className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <Label htmlFor="identityNumber" className="text-sm font-medium text-gray-700 mb-2 block">
            Nomor Identitas ({user?.identityType || 'N/A'})
          </Label>
          <Input
            id="identityNumber"
            type="text"
            value={user?.identityNumber || ''}
            disabled
            className="bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div>
          <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700 mb-2 block">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Nomor Telepon {!user?.phoneNumber && <span className="text-red-500 ml-0.5">*</span>}
            </div>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            placeholder="Contoh: 081234567890"
            disabled={isSaving}
            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Status Verifikasi
            </div>
          </Label>
          <div className="mt-1.5">
            <Badge
              className={
                user?.isVerified
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-100'
              }
            >
              {user?.isVerified ? '✓ Terverifikasi' : 'Belum Terverifikasi'}
            </Badge>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role
            </div>
          </Label>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {user?.roles && user.roles.length > 0 ? (
              user.roles.map((role: { id: string; name: string; status: string }) => (
                <Badge
                  key={role.id}
                  className={
                    role.status === 'active'
                      ? 'capitalize bg-orange-100 text-orange-700 hover:bg-orange-100'
                      : 'capitalize bg-gray-100 text-gray-700 hover:bg-gray-100'
                  }
                >
                  <Shield className="h-3 w-3 mr-1" />
                  {role.name}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-400 italic">Tidak ada role</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
      </div>
    </form>
  );
}
