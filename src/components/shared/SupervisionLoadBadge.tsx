import { Badge } from '@/components/ui/badge';
import { getSupervisionLoadLevelLabel, getSupervisionLoadLevelVariant } from '@/lib/thesisLabels';

interface SupervisionLoadBadgeProps {
  activeCount: number;
  hardLimit: number;
  level: string;
  className?: string;
}

/** Beban bimbingan dosen terhadap batas keras yang berlaku, mis. "9/10 · Mendekati Batas". */
export function SupervisionLoadBadge({ activeCount, hardLimit, level, className }: SupervisionLoadBadgeProps) {
  return (
    <Badge variant={getSupervisionLoadLevelVariant(level)} className={className}>
      {activeCount}/{hardLimit} · {getSupervisionLoadLevelLabel(level)}
    </Badge>
  );
}
