import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  THESIS_ACTIVITY_DESCRIPTIONS,
  getThesisActivityLabel,
  getThesisActivityVariant,
  type ThesisActivityLevel,
} from '@/lib/thesisLabels';

interface ThesisActivityBadgeProps {
  /** Tingkat aktivitas; null untuk TA yang tidak berstatus Penelitian. */
  level: string | null | undefined;
  className?: string;
}

/**
 * Badge tingkat aktivitas TA (Lancar / Lambat / Berisiko) dengan tooltip aturannya.
 * Tingkat aktivitas hanya ada untuk TA berstatus Penelitian; selain itu tampil "-".
 */
export function ThesisActivityBadge({ level, className }: ThesisActivityBadgeProps) {
  if (!level) return <span className="text-muted-foreground">-</span>;
  const description = THESIS_ACTIVITY_DESCRIPTIONS[level as ThesisActivityLevel];
  const badge = (
    <Badge variant={getThesisActivityVariant(level)} className={className}>
      {getThesisActivityLabel(level)}
    </Badge>
  );
  if (!description) return badge;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{badge}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {description} Aktivitas dihitung dari bimbingan selesai, milestone selesai, dan seminar, paling awal sejak tugas akhir mulai atau kembali berstatus Penelitian.
      </TooltipContent>
    </Tooltip>
  );
}
