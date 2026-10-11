import { Badge } from '@/components/ui/badge';
import { getThesisStatusLabel, getThesisStatusVariant } from '@/lib/thesisLabels';

interface ThesisStatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

/** Badge status siklus hidup TA (`ThesisLifecycleStatus`), label dari `lib/thesisLabels`. */
export function ThesisStatusBadge({ status, className }: ThesisStatusBadgeProps) {
  return (
    <Badge variant={getThesisStatusVariant(status)} className={className}>
      {getThesisStatusLabel(status)}
    </Badge>
  );
}
