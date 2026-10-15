import { OctagonX } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDateShortId } from '@/lib/text';

interface ThesisStoppedAlertProps {
  /** Tanggal penghentian tugas akhir (`terminatedAt`). */
  stoppedAt?: string | null;
  className?: string;
}

/**
 * Pita di atas bimbingan dan milestone tugas akhir yang dihentikan (Paket E4, 7). Isinya tetap
 * terlihat, baca-saja (K14).
 */
export function ThesisStoppedAlert({ stoppedAt, className }: ThesisStoppedAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <OctagonX className="h-4 w-4" />
      <AlertTitle>
        Tugas akhir ini dihentikan pada {stoppedAt ? formatDateShortId(stoppedAt) : '-'}
      </AlertTitle>
      <AlertDescription>
        Sesi bimbingan dan milestone di bawah ini hanya dapat dibaca, termasuk sesi yang dibatalkan sistem beserta alasannya.
      </AlertDescription>
    </Alert>
  );
}
