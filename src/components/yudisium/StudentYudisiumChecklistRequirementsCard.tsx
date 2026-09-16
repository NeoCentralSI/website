import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StudentYudisiumChecklistItem } from '@/types/student-yudisium.types';

const formatDateTime = (date: any) => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return '-';
    return d.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return '-';
  }
};

const checklistEntries = (checklist: Record<string, StudentYudisiumChecklistItem>) =>
  Object.entries(checklist).map(([key, value]) => ({ key, ...value }));

function ChecklistRow({
  label,
  met,
  current,
  required,
  submittedAt,
  revisionFinalizedAt,
  isExitSurvey,
  isYudisiumOpen,
  canAccessExitSurvey,
  onExitSurveyClick,
}: {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
  submittedAt?: string | null;
  revisionFinalizedAt?: string | null;
  isExitSurvey?: boolean;
  isYudisiumOpen?: boolean;
  canAccessExitSurvey?: boolean;
  onExitSurveyClick?: () => void;
}) {
  const hasProgress = current !== undefined && required !== undefined;
  const isInProgress = !met && hasProgress && current > 0;

  const statusText = met
    ? 'Terpenuhi'
    : isInProgress
      ? `${current}/${required}`
      : 'Menunggu';

  const exitSurveyDisabledReason =
    isExitSurvey && !met && !canAccessExitSurvey
      ? isYudisiumOpen
        ? 'Lengkapi seluruh persyaratan akademik terlebih dahulu'
        : 'Exit survey aktif saat pendaftaran yudisium dibuka'
      : null;

  return (
    <div
      className={cn(
        "flex items-center gap-[10px] p-[8px_12px] rounded-[7px] border transition-all duration-200",
        met ? "bg-emerald-50/50 border-emerald-200" : "bg-card border border-gray-200"
      )}
    >
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0",
          met ? "bg-emerald-600 text-white" : "bg-muted border-[1.5px] border-border text-muted-foreground"
        )}
      >
        {met ? <Check size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2} />}
      </div>

      <div className="flex-1 min-w-0">
        <strong className="text-sm font-medium text-foreground block truncate leading-tight">
          {label}
        </strong>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn("text-xs font-medium", met ? "text-emerald-600" : "text-muted-foreground")}>
            {statusText}
          </span>
          {submittedAt && (
            <span className="text-[10px] text-muted-foreground">
              • {formatDateTime(submittedAt)}
            </span>
          )}
          {revisionFinalizedAt && (
            <span className="text-[10px] text-muted-foreground">
              • {formatDateTime(revisionFinalizedAt)}
            </span>
          )}
        </div>
        {exitSurveyDisabledReason && (
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            {exitSurveyDisabledReason}
          </p>
        )}
      </div>

      {isExitSurvey && (
        <button
          type="button"
          onClick={(canAccessExitSurvey || met) ? onExitSurveyClick : undefined}
          disabled={!canAccessExitSurvey && !met}
          className={cn(
            "shrink-0 px-[9px] py-[4px] text-xs font-semibold rounded-[5px] transition-all duration-200 border",
            met
              ? "border-gray-200 text-foreground bg-transparent hover:bg-accent cursor-pointer"
              : canAccessExitSurvey
                ? "border-primary text-primary bg-transparent hover:bg-primary/5 cursor-pointer"
                : "border-gray-200 text-muted-foreground bg-transparent cursor-default opacity-50"
          )}
          title={exitSurveyDisabledReason ?? undefined}
        >
          {met ? 'Lihat Respon' : 'Isi Survey'}
        </button>
      )}
    </div>
  );
}

interface StudentYudisiumChecklistRequirementsCardProps {
  checklist: Record<string, StudentYudisiumChecklistItem>;
  isYudisiumOpen: boolean;
  onExitSurveyClick: () => void;
}

export function StudentYudisiumChecklistRequirementsCard({
  checklist,
  isYudisiumOpen,
  onExitSurveyClick,
}: StudentYudisiumChecklistRequirementsCardProps) {
  if (!checklist) return null;
  const items = checklistEntries(checklist);

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Checklist Persyaratan
      </div>
      <div className="flex flex-col gap-1.5">
        {items.map((item: any) => (
          <ChecklistRow
            key={item.key}
            label={item.label}
            met={item.met}
            current={item.current}
            required={item.required}
            submittedAt={item.submittedAt}
            revisionFinalizedAt={item.revisionFinalizedAt}
            isExitSurvey={item.key === 'exitSurvey'}
            isYudisiumOpen={isYudisiumOpen}
            canAccessExitSurvey={item.key === 'exitSurvey' ? !!item.isAvailable : undefined}
            onExitSurveyClick={onExitSurveyClick}
          />
        ))}
      </div>
    </div>
  );
}
