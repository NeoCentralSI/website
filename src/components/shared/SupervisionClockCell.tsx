import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getEvaluationDueLabel, type SupervisionClock } from '@/lib/thesisLabels';

interface SupervisionClockCellProps {
  clock: SupervisionClock | null | undefined;
  className?: string;
}

/**
 * Masa bimbingan: lama berjalan ("7 bulan 12 hari") dan, bila ada, badge evaluasi yang
 * jatuh tempo. Selama BSS masa bimbingan berhenti dan diberi keterangan.
 */
export function SupervisionClockCell({ clock, className }: SupervisionClockCellProps) {
  if (!clock || !clock.startedAt) return <span className="text-muted-foreground">-</span>;
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span className="text-sm whitespace-nowrap">
        {clock.elapsedLabel}
        {clock.isPaused && <span className="text-xs text-muted-foreground"> (berhenti selama BSS)</span>}
      </span>
      {clock.evaluationDue && (
        <Badge variant="warning" className="whitespace-nowrap text-[11px]">
          {getEvaluationDueLabel(clock.evaluationDue)}
        </Badge>
      )}
    </div>
  );
}
