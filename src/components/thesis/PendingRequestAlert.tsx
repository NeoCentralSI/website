import { Button } from '@/components/ui/button';

interface PendingRequestAlertProps {
  supervisorName: string;
  dateStr: string;
  onViewDetail: () => void;
}

export function PendingRequestAlert({ supervisorName, dateStr, onViewDetail }: PendingRequestAlertProps) {
  return (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-amber-900 mb-1">Pengajuan Menunggu Response</h4>
          <p className="text-sm text-amber-800">
            Anda memiliki pengajuan bimbingan yang belum direspon oleh <strong>{supervisorName}</strong> (jadwal:{' '}
            <strong>{dateStr}</strong>). Anda tidak dapat mengajukan bimbingan baru hingga pengajuan sebelumnya
            disetujui atau ditolak.
          </p>
          <Button
            variant="link"
            size="sm"
            className="px-0 h-auto mt-2 text-amber-900 hover:text-amber-700"
            onClick={onViewDetail}
          >
            Lihat Detail Pengajuan →
          </Button>
        </div>
      </div>
    </div>
  );
}
