import { Check, Clock } from 'lucide-react';
import type { ThesisSeminarStatus } from '@/types/seminar.types';
import { cn } from '@/lib/utils';
const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'verified', label: 'Dokumen Seminar Lengkap' },
  { key: 'examiner_assigned', label: 'Penetapan Dosen Penguji' },
  { key: 'scheduled', label: 'Penetapan Jadwal Seminar Hasil' },
  { key: 'seminar', label: 'Pelaksanaan Seminar Hasil' },
] as const;

function getActiveStepIndex(status: ThesisSeminarStatus | null, allChecklistMet: boolean): number {
  if (status === 'passed' || status === 'passed_with_revision') return 4;
  if (status === 'scheduled' || status === 'ongoing') return 3;
  if (status === 'examiner_assigned') return 2;
  if (status === 'verified') return 1;
  if (status === 'registered') return 0;
  
  if (allChecklistMet) return 0;
  
  return -1;
}

interface SeminarStatusStepperProps {
  status: ThesisSeminarStatus | null;
  allChecklistMet: boolean;
}

export function StudentThesisSeminarStatusCard({ status, allChecklistMet }: SeminarStatusStepperProps) {
  const activeIndex = getActiveStepIndex(status, allChecklistMet);
  const spinePct = activeIndex === -1 ? 0 : (activeIndex + 1) * 20;
  const completedCount = activeIndex + 1;

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[18px_18px_14px] h-full flex flex-col box-border">
      <div className="text-base font-semibold text-foreground mb-1.5">
        Status Seminar
      </div>
      <div className="text-xs text-muted-foreground mb-[18px]">
        Progres pengajuan seminar hasil
      </div>

      <div className="relative pl-8 flex-1 flex flex-col">
        {STEPS.map((step, i) => {
          const isActive = i <= activeIndex;

          return (
            <div
              key={step.key}
              className={cn(
                "relative",
                i < STEPS.length - 1 ? "pb-[22px]" : "pb-0"
              )}
            >
              {/* Segment to next node */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "absolute top-[13px] bottom-[-13px] w-[2px] z-[0]",
                    i < activeIndex ? "bg-[#16A34A]" : "bg-muted"
                  )}
                  style={{ left: '-21px' }}
                />
              )}
              {/* Node */}
              <div
                className={cn(
                  "absolute -left-8 top-[2px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[1] border-[2.5px]",
                  isActive
                    ? "bg-[#16A34A] border-[#16A34A] text-white shadow-[0_0_0_3px_#dcfce7]"
                    : "bg-white border-[#d1d5db] text-[#bbb] shadow-[0_0_0_3px_#f3f4f6]"
                )}
              >
                {isActive ? (
                  <Check size={10} strokeWidth={2.5} />
                ) : (
                  <Clock size={10} strokeWidth={2} />
                )}
              </div>

              {/* Step name */}
              <div
                className={cn(
                  "text-sm font-semibold leading-[1.3] mb-0.5",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </div>

              {/* Step status */}
              <div
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  isActive ? "text-[#16A34A]" : "text-muted-foreground"
                )}
              >
                {isActive ? 'Terpenuhi' : 'Menunggu'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress summary */}
      <div className="mt-[18px] pt-[14px] border-t border-gray-200">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">Progres Keseluruhan</span>
          <span className="text-xs font-bold text-[#16A34A]">{spinePct}%</span>
        </div>
        <div className="bg-muted rounded-full h-[6px] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${spinePct}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 font-medium">
          {completedCount > 0 ? `${completedCount} dari ${STEPS.length} tahap selesai` : 'Checklist Persyaratan Belum Terpenuhi'}
        </div>
      </div>
    </div>
  );
}
