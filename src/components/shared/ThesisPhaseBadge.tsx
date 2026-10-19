import { Badge } from '@/components/ui/badge';
import { getThesisPhaseLabel, getThesisPhaseVariant } from '@/lib/thesisLabels';

interface ThesisPhaseBadgeProps {
  phase: string | null | undefined;
  className?: string;
}

/** Badge jenis Proposal / Penelitian (`ThesisPhase`); label dari thesisLabels. */
export function ThesisPhaseBadge({ phase, className }: ThesisPhaseBadgeProps) {
  return (
    <Badge variant={getThesisPhaseVariant(phase)} className={className}>
      {getThesisPhaseLabel(phase)}
    </Badge>
  );
}
