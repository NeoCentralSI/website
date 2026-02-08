import { Briefcase } from 'lucide-react';
import type { User } from '@/services/auth.service';

interface LecturerInfoCardProps {
  lecturer: User['lecturer'];
}

export function LecturerInfoCard({ lecturer }: LecturerInfoCardProps) {
  if (!lecturer) return null;

  const lecturerData = lecturer.data;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <Briefcase className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">Informasi Dosen</h3>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Kelompok Keilmuan
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">
            {lecturer.scienceGroup || <span className="text-gray-400 italic">-</span>}
          </p>
        </div>
        {lecturerData?.nidn && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              NIDN
            </span>
            <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.nidn}</p>
          </div>
        )}
        {lecturerData?.pangkat_golongan && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Pangkat / Golongan
            </span>
            <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.pangkat_golongan}</p>
          </div>
        )}
        {lecturerData?.jabatan_fungsional && (
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Jabatan Fungsional
            </span>
            <p className="text-base font-medium text-gray-900 mt-0.5">{lecturerData.jabatan_fungsional}</p>
          </div>
        )}
      </div>
    </div>
  );
}
