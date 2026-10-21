import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getEvaluationDueLabel, type SupervisionClock } from '@/lib/thesisLabels';

interface SupervisionClockCellProps {
  clock: SupervisionClock | null | undefined;
  className?: string;
  /** Narrow column: the BSS note and the due badge may wrap instead of widening the cell. */
  wrap?: boolean;
}

/**
 * Masa bimbingan: lama berjalan ("7 bulan 12 hari") dan, bila ada, badge evaluasi yang
 * jatuh tempo. Selama BSS masa bimbingan berhenti dan diberi keterangan.
 */
export function SupervisionClockCell({ clock, className, wrap }: SupervisionClockCellProps) {
  if (!clock || !clock.startedAt) return <span className="text-muted-foreground">-</span>;
  return (
    <div className={cn('flex flex-col items-start gap-1', className)}>
      <span className={cn('text-sm', wrap ? 'whitespace-normal' : 'whitespace-nowrap')}>
        <span className="whitespace-nowrap">{clock.elapsedLabel}</span>
        {clock.isPaused && <span className="text-xs text-muted-foreground"> (berhenti selama BSS)</span>}
      </span>
      {clock.evaluationDue && (
        <Badge variant="warning" className={cn('text-[11px]', wrap ? 'rounded-md whitespace-normal' : 'whitespace-nowrap')}>
          {getEvaluationDueLabel(clock.evaluationDue)}
        </Badge>
      )}
    </div>
  );
}
