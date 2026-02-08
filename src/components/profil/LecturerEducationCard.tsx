import { BookOpen } from 'lucide-react';
import type { User } from '@/services/auth.service';

interface LecturerEducationCardProps {
  lecturer: User['lecturer'];
}

export function LecturerEducationCard({ lecturer }: LecturerEducationCardProps) {
  if (!lecturer) return null;

  const lecturerData = lecturer.data;
  const educationHistory = lecturerData?.riwayat_pendidikan;

  if (!educationHistory || educationHistory.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-3 mb-5">
        <BookOpen className="h-6 w-6 text-primary" />
        <h3 className="text-lg font-bold text-gray-900">Riwayat Pendidikan</h3>
      </div>

      <div className="space-y-3">
        {educationHistory.map((edu, index) => (
          <div key={index} className="flex items-start gap-3">
            <span className="shrink-0 w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
              {edu.jenjang}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-base font-semibold text-gray-900 leading-tight">{edu.program_studi}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {edu.universitas}
              </p>
              {edu.fakultas && (
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-0.5">
                  Fak. {edu.fakultas}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
