import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThesisSeminarStatus } from '@/types/seminar.types';

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'verified', label: 'Dokumen Seminar Tervalidasi' },
  { key: 'examiner_assigned', label: 'Penetapan Dosen Penguji' },
  { key: 'scheduled', label: 'Penetapan Jadwal' },
  { key: 'seminar', label: 'Seminar' },
] as const;

function getActiveStepIndex(status: ThesisSeminarStatus | null, allChecklistMet: boolean): number {
  if (!status) return allChecklistMet ? 0 : -1;

  const statusMap: Record<string, number> = {
    registered: 1,
    verified: 2,
    examiner_assigned: 3,
    scheduled: 4,
    passed: 5,
    passed_with_revision: 5,
    failed: 5,
    cancelled: -1,
  };

  return statusMap[status] ?? -1;
}

interface SeminarStatusStepperProps {
  status: ThesisSeminarStatus | null;
  allChecklistMet: boolean;
}

export function SeminarStatusStepper({ status, allChecklistMet }: SeminarStatusStepperProps) {
  const activeIndex = getActiveStepIndex(status, allChecklistMet);

  return (
    <div className="rounded-lg border bg-card p-6">
      <h3 className="text-lg font-semibold mb-6">Status Seminar</h3>
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isCurrent = i === activeIndex;

          return (
            <div key={step.key} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* Left connector line */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i === 0 ? 'bg-transparent' : isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-primary/10 text-primary',
                    !isCompleted && !isCurrent && 'border-muted bg-muted/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </div>
                {/* Right connector line */}
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    i === STEPS.length - 1 ? 'bg-transparent' : isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs text-center max-w-[100px]',
                  (isCompleted || isCurrent) ? 'text-primary font-medium' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
