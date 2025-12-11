import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/services/auth.service';

interface StudentInfoCardProps {
  student: User['student'];
}

export function StudentInfoCard({ student }: StudentInfoCardProps) {
  if (!student) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Mahasiswa</h2>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm text-gray-600">Tahun Masuk</Label>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {student.enrollmentYear || <span className="text-gray-400 italic">Belum diisi</span>}
            </p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">SKS Selesai</Label>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {student.sksCompleted !== undefined ? (
                `${student.sksCompleted} SKS`
              ) : (
                <span className="text-gray-400 italic">Belum diisi</span>
              )}
            </p>
          </div>
          <div>
            <Label className="text-sm text-gray-600">Status Mahasiswa</Label>
            <div className="mt-1">
              {student.status ? (
                <Badge variant={student.status === 'Aktif' ? 'default' : 'secondary'}>
                  {student.status}
                </Badge>
              ) : (
                <span className="text-sm text-gray-400 italic">Belum diisi</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
