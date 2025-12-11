import { Label } from '@/components/ui/label';
import type { User } from '@/services/auth.service';

interface LecturerInfoCardProps {
  lecturer: User['lecturer'];
}

export function LecturerInfoCard({ lecturer }: LecturerInfoCardProps) {
  if (!lecturer) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Dosen</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-gray-600">Kelompok Keilmuan</Label>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {lecturer.scienceGroup || <span className="text-gray-400 italic">Belum diisi</span>}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
