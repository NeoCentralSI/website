import { Badge } from '@/components/ui/badge';
import type { ThesisTa04Snapshot } from '@/services/monitoring.service';
import { formatDateId } from '@/lib/text';

interface Ta04StatusBadgeProps {
  ta04: ThesisTa04Snapshot | null | undefined;
  /** Tampilkan tanggal terbit di bawah badge (dipakai di halaman detail). */
  showIssuedAt?: boolean;
}

/**
 * Status penugasan TA-04 per mahasiswa, read-only.
 * Penerbitan dan finalisasi batch tetap wewenang KaDep tunggal (BR-24);
 * komponen ini tidak menyediakan aksi apa pun.
 */
export function Ta04StatusBadge({ ta04, showIssuedAt = false }: Ta04StatusBadgeProps) {
  if (!ta04?.issued) {
    return (
      <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
        Belum Terbit
      </Badge>
    );
  }

  return (
    <div className="space-y-0.5">
      <Badge className="whitespace-nowrap border-emerald-200 bg-emerald-500/15 text-emerald-700">
        Terbit
      </Badge>
      {showIssuedAt && ta04.issuedAt && (
        <p className="text-xs text-muted-foreground">{formatDateId(ta04.issuedAt)}</p>
      )}
    </div>
  );
}
