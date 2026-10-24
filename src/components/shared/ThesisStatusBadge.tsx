import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getThesisStatusLabel, getThesisStatusVariant, THESIS_ON_LEAVE_LABEL } from '@/lib/thesisLabels';

interface ThesisStatusBadgeProps {
  status: string | null | undefined;
  /** The student is on leave: a "Cuti" badge beside the status (the thesis is paused). */
  onLeave?: boolean;
  className?: string;
}

/** Badge "Cuti" for a thesis paused by the student's leave. */
export function ThesisOnLeaveBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className} title="Mahasiswa sedang cuti. Tugas akhir dijeda dan masa bimbingan berhenti.">
      {THESIS_ON_LEAVE_LABEL}
    </Badge>
  );
}

/** Badge status siklus hidup TA (`ThesisLifecycleStatus`), label dari `lib/thesisLabels`. */
export function ThesisStatusBadge({ status, onLeave = false, className }: ThesisStatusBadgeProps) {
  const badge = (
    <Badge variant={getThesisStatusVariant(status)} className={className}>
      {getThesisStatusLabel(status)}
    </Badge>
  );
  if (!onLeave) return badge;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1')}>
      {badge}
      <ThesisOnLeaveBadge className={className} />
    </span>
  );
}
