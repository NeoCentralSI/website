import { AlertCircle } from 'lucide-react';

export function ProfileIncompleteAlert() {
  return (
    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
      <div>
        <h3 className="text-sm font-bold text-amber-900">Data Belum Lengkap</h3>
        <p className="text-sm text-amber-700 mt-0.5">
          Mohon lengkapi data profil Anda untuk pengalaman yang lebih baik.
        </p>
      </div>
    </div>
  );
}
