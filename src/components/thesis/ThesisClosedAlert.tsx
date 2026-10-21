import { CircleCheck, OctagonX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateShortId } from '@/lib/text';

interface ThesisClosedAlertProps {
  /** Gagal (dihentikan) atau Selesai. */
  status: 'failed' | 'completed';
  /** Tanggal penghentian (`terminatedAt`) atau tanggal selesai (`completedAt`). */
  closedAt?: string | null;
  className?: string;
}

/**
 * Pita di atas bimbingan dan milestone tugas akhir yang sudah ditutup: dihentikan
 * atau selesai. Isinya tetap terlihat, baca-saja.
 */
export function ThesisClosedAlert({ status, closedAt, className }: ThesisClosedAlertProps) {
  const date = closedAt ? formatDateShortId(closedAt) : '-';
  const stopped = status === 'failed';
  return (
    <Alert variant={stopped ? 'destructive' : 'success'} className={className}>
      {stopped ? <OctagonX className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
      <AlertTitle>
        {stopped ? `Tugas akhir ini dihentikan pada ${date}` : `Tugas akhir ini selesai pada ${date}`}
      </AlertTitle>
      <AlertDescription>
        {stopped
          ? 'Sesi bimbingan dan milestone di bawah ini hanya dapat dibaca, termasuk sesi yang dibatalkan sistem beserta alasannya.'
          : 'Sesi bimbingan dan milestone di bawah ini hanya dapat dibaca.'}
      </AlertDescription>
    </Alert>
  );
}
