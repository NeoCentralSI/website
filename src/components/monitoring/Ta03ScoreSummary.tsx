import { Badge } from '@/components/ui/badge';
import type { ThesisTa03Snapshot } from '@/services/monitoring.service';
import { cn } from '@/lib/utils';

interface Ta03ScoreSummaryProps {
  ta03: ThesisTa03Snapshot | null | undefined;
  className?: string;
}

function formatScore(value: number | null): string {
  return value === null || value === undefined ? '-' : String(value);
}

/**
 * Ringkasan nilai TA-03A / TA-03B beserta status finalisasinya, read-only.
 *
 * Auto-nol presensi (BR-28) ditandai terpisah dari finalisasi biasa karena
 * keduanya sama-sama menutup penilaian tetapi berarti berbeda bagi pembaca
 * laporan. Penilaian tetap milik P1/P2 dan Koordinator (BR-19, BR-20).
 */
export function Ta03ScoreSummary({ ta03, className }: Ta03ScoreSummaryProps) {
  if (!ta03) {
    return <span className={cn('text-sm text-muted-foreground', className)}>Belum dinilai</span>;
  }

  return (
    <div className={cn('space-y-1', className)}>
      <p className="whitespace-nowrap text-sm">
        <span className="text-muted-foreground">TA-03A</span> {formatScore(ta03.ta03a)}
        <span className="mx-1 text-muted-foreground">/</span>
        <span className="text-muted-foreground">TA-03B</span> {formatScore(ta03.ta03b)}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {ta03.autoZeroed ? (
          <Badge className="whitespace-nowrap border-red-200 bg-red-500/15 text-red-700">
            Auto-nol Presensi
          </Badge>
        ) : ta03.isFinalized ? (
          <Badge className="whitespace-nowrap border-emerald-200 bg-emerald-500/15 text-emerald-700">
            Final {formatScore(ta03.finalScore)}
          </Badge>
        ) : (
          <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
            Belum Final
          </Badge>
        )}
        {ta03.coSigned && !ta03.autoZeroed && (
          <Badge variant="outline" className="whitespace-nowrap text-muted-foreground">
            P2 Co-sign
          </Badge>
        )}
      </div>
    </div>
  );
}
