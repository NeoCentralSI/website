/**
 * DEV TOOLS — shared badges and cells.
 * ⚠️ DELETE THIS DIRECTORY (components/dev-tools/) when dev tools are no longer needed.
 */
import { Check, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type {
  DevToolsMetopenEligibility,
  DevToolsThesisCourseEligibility,
  StudentStatus,
} from '@/types/devTools.types';

export const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: 'active', label: 'Aktif' },
  { value: 'dropout', label: 'Dropout' },
  { value: 'bss', label: 'BSS' },
  { value: 'lulus', label: 'Lulus' },
  { value: 'mengundurkan_diri', label: 'Mengundurkan Diri' },
];

const STUDENT_STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  lulus: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  dropout: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  bss: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  mengundurkan_diri: 'bg-muted text-muted-foreground',
};

export function BoolIcon({ value }: { value: boolean }) {
  return value
    ? <Check className="h-4 w-4 text-emerald-600" aria-label="Ya" />
    : <X className="h-4 w-4 text-red-400" aria-label="Tidak" />;
}

export function StudentStatusBadge({ status }: { status: string }) {
  const label = STUDENT_STATUSES.find((item) => item.value === status)?.label ?? status;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        STUDENT_STATUS_CLASSES[status] || 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </span>
  );
}

export function MetopenEligibilityBadge({ metopenEligibility }: { metopenEligibility: DevToolsMetopenEligibility }) {
  if (!metopenEligibility.hasExternalStatus) {
    return <Badge variant="outline" className="text-xs">Belum ada status</Badge>;
  }
  if (metopenEligibility.eligibleMetopen) {
    return <Badge variant="default" className="text-xs bg-emerald-600">Eligible</Badge>;
  }
  return <Badge variant="outline" className="text-xs border-red-200 text-red-700">Tidak eligible</Badge>;
}

export function ThesisCourseEligibilityBadge({ thesisCourseEligibility }: { thesisCourseEligibility: DevToolsThesisCourseEligibility }) {
  if (!thesisCourseEligibility.hasExternalStatus) {
    return <Badge variant="outline" className="text-xs">Belum ada status</Badge>;
  }
  if (thesisCourseEligibility.takingThesisCourse) {
    return <Badge variant="default" className="text-xs bg-blue-600">MK TA aktif</Badge>;
  }
  return <Badge variant="outline" className="text-xs border-slate-300 text-slate-700">Belum MK TA</Badge>;
}

/** One-line text that never widens the table; the full value is in the tooltip. */
export function TruncatedText({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text) return <span className="text-muted-foreground">-</span>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('block truncate', className)}>{text}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">{text}</TooltipContent>
    </Tooltip>
  );
}
