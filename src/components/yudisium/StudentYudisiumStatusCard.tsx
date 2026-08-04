import { Check, Clock, PartyPopper } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StudentYudisiumOverviewResponse } from '@/types/student-yudisium.types';

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan & Survey' },
  { key: 'verification', label: 'Verifikasi Dokumen & Validasi CPL' },
  { key: 'eligible', label: 'Eligibel' },
  { key: 'appointed', label: 'Ditetapkan sebagai Peserta' },
  { key: 'finalized', label: 'Lulus Yudisium' },
] as const;

function getActiveStepIndex(
  participantStatus: string | null,
  allChecklistMet: boolean,
): number {
  if (participantStatus === 'finalized') return 4;
  if (participantStatus === 'appointed') return 3;
  if (participantStatus === 'eligible') return 2;
  if (participantStatus === 'registered') return 1;
  if (allChecklistMet) return 0;
  return -1;
}

interface StudentYudisiumStatusCardProps {
  overview: StudentYudisiumOverviewResponse;
}

export function StudentYudisiumStatusCard({ overview }: StudentYudisiumStatusCardProps) {
  const currentStep = getActiveStepIndex(overview.participantStatus, overview.allChecklistMet);
  const isFinalized = currentStep >= 4;
  const spinePct = currentStep === -1 ? 0 : (currentStep + 1) * 20;
  const completedCount = currentStep + 1;

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[18px_18px_14px] h-full flex flex-col box-border">
      <div className="text-base font-semibold text-foreground mb-1.5 flex items-center justify-between">
        Status Yudisium
        {isFinalized && (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-5 px-1.5 text-[10px]">
            <PartyPopper className="mr-1 h-2.5 w-2.5" />
            Selesai
          </Badge>
        )}
      </div>
      <div className="text-xs text-muted-foreground mb-[18px]">
        Progres pengajuan yudisium Anda
      </div>

      <div className="relative pl-8 flex-1 flex flex-col">
        {STEPS.map((step, i) => {
          const isActive = i <= currentStep;

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
                    i < currentStep ? "bg-emerald-600" : "bg-muted"
                  )}
                  style={{ left: '-21px' }}
                />
              )}
              {/* Node */}
              <div
                className={cn(
                  "absolute -left-8 top-[2px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[1] border-[2.5px]",
                  isActive
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-[0_0_0_3px_#dcfce7]"
                    : "bg-white border-gray-300 text-gray-400 shadow-[0_0_0_3px_#f3f4f6]"
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
                  "text-xs font-medium",
                  isActive ? "text-emerald-600" : "text-muted-foreground"
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
          <span className="text-xs font-bold text-emerald-600">{spinePct}%</span>
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
