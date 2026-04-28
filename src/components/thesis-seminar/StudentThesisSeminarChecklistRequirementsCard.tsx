import { Check, Clock } from 'lucide-react';
import type { SeminarChecklist } from '@/types/seminar.types';
import { cn } from '@/lib/utils';

interface ChecklistPersyaratanProps {
  checklist: SeminarChecklist;
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
        met ? "bg-[#f0fdf4] border-[#bbf7d0]" : "bg-[#fafaf8] border-[#e8e8e4]"
      )}
    >
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0",
          met ? "bg-[#16A34A] text-white" : "bg-[#f3f4f6] border-[1.5px] border-[#d1d5db] text-[#9ca3af]"
        )}
      >
        {met ? <Check size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2} />}
      </div>

      <div>
        <strong className="text-[12px] font-semibold text-[#111] block">
          {label}
        </strong>
        <span className={cn("text-[10.5px]", met ? "text-[#16A34A]" : "text-[#aaa]")}>
          {statusText}
        </span>
      </div>
    </div>
  );
}

export function StudentThesisSeminarChecklistRequirementsCard({ checklist }: ChecklistPersyaratanProps) {
  return (
    <div className="bg-white border border-[#e8e8e4] rounded-[10px] p-[16px_18px]">
      <div className="text-[13px] font-bold text-[#111] mb-[14px]">
        Checklist Persyaratan
      </div>
      <div className="flex flex-col gap-1.5">
        <ChecklistRow
          label={checklist.metopen?.label || "Lulus Mata Kuliah Metode Penelitian"}
          met={checklist.metopen?.met || false}
        />
        <ChecklistRow
          label={checklist.bimbingan.label}
          met={checklist.bimbingan.met}
          current={checklist.bimbingan.current}
          required={checklist.bimbingan.required}
        />
        <ChecklistRow
          label={checklist.kehadiran.label}
          met={checklist.kehadiran.met}
          current={checklist.kehadiran.current}
          required={checklist.kehadiran.required}
        />
        <ChecklistRow
          label={checklist.pembimbing.label}
          met={checklist.pembimbing.met}
        />
      </div>
    </div>
  );
}
