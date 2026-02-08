import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';
import type { User } from '@/services/auth.service';

interface StudentInfoCardProps {
  student: User['student'];
}

export function StudentInfoCard({ student }: StudentInfoCardProps) {
  if (!student) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">Informasi Mahasiswa</h3>
      </div>

      <div className="grid grid-cols-3 gap-x-8 gap-y-4">
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Tahun Masuk
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">
            {student.enrollmentYear || '-'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            SKS Selesai
          </span>
          <p className="text-base font-medium text-gray-900 mt-0.5">
            {student.sksCompleted !== undefined ? `${student.sksCompleted} SKS` : '-'}
          </p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Status
          </span>
          <div className="mt-0.5">
            {student.status ? (
              <Badge variant={student.status === 'Aktif' ? 'default' : 'secondary'}>
                {student.status}
              </Badge>
            ) : (
              <span className="text-gray-400 italic">-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
