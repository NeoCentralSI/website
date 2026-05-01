import { Check, Clock } from 'lucide-react';
import type { DefenceChecklist } from '@/types/defence.types';
import { cn } from '@/lib/utils';

interface ChecklistPersyaratanProps {
  checklist: DefenceChecklist;
}

function ChecklistRow({
  label,
  met,
  current,
  required,
}: {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
}) {
  const hasProgress = current !== undefined && required !== undefined;
  const isInProgress = !met && hasProgress && current > 0;

  const statusText = met
    ? 'Terpenuhi'
    : isInProgress
      ? `${current}/${required}`
      : 'Menunggu';

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
          met ? "bg-[#16A34A] text-white" : "bg-muted border-[1.5px] border-border text-muted-foreground"
        )}
      >
        {met ? <Check size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2} />}
      </div>

      <div>
        <strong className="text-sm font-medium text-foreground block leading-tight">
          {label}
        </strong>
        <span className={cn("text-xs font-medium", met ? "text-[#16A34A]" : "text-muted-foreground")}>
          {statusText}
        </span>
      </div>
    </div>
  );
}

export function StudentThesisDefenceChecklistRequirementsCard({ checklist }: ChecklistPersyaratanProps) {
  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[16px_18px]">
      <div className="text-base font-semibold text-foreground mb-[14px]">
        Checklist Persyaratan
      </div>
      <div className="flex flex-col gap-1.5">
        <ChecklistRow
          label={checklist.lulusSeminar.label}
          met={checklist.lulusSeminar.met}
        />
        <ChecklistRow
          label={checklist.sks.label}
          met={checklist.sks.met}
          current={checklist.sks.current}
          required={checklist.sks.required}
        />
        <ChecklistRow
          label={checklist.revisiSeminar.label}
          met={checklist.revisiSeminar.met}
          current={checklist.revisiSeminar.finished}
          required={checklist.revisiSeminar.total}
        />
        <ChecklistRow
          label={checklist.pembimbing.label}
          met={checklist.pembimbing.met}
        />
      </div>
    </div>
  );
}
