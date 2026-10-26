import { Badge } from '@/components/ui/badge';
import { getSupervisionLoadLevelVariant } from '@/lib/thesisLabels';

interface SupervisionLoadBadgeProps {
  activeCount: number;
  totalLimit: number;
  acceptedCount?: number;
  semesterQuota?: number;
  level: string;
  className?: string;
}

/** Semester intake and current supervision load, without disabling selection. */
export function SupervisionLoadBadge({ activeCount, totalLimit, acceptedCount, semesterQuota, level, className }: SupervisionLoadBadgeProps) {
  return (
    <Badge variant={getSupervisionLoadLevelVariant(level)} className={className}>
      {semesterQuota != null && <>Semester ini {acceptedCount ?? 0}/{semesterQuota} · </>}Total {activeCount}/{totalLimit}
    </Badge>
  );
}
