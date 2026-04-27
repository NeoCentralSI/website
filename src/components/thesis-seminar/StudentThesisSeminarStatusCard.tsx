import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ThesisSeminarStatus } from '@/types/seminar.types';

const STEPS = [
  { key: 'checklist', label: 'Checklist Persyaratan' },
  { key: 'verified', label: 'Dokumen Seminar Lengkap' },
  { key: 'examiner_assigned', label: 'Penetapan Dosen Penguji' },
  { key: 'scheduled', label: 'Penetapan Jadwal Seminar Hasil' },
  { key: 'seminar', label: 'Pelaksanaan Seminar Hasil' },
] as const;

function getActiveStepIndex(status: ThesisSeminarStatus | null, allChecklistMet: boolean): number {
  if (!status) return allChecklistMet ? 0 : -1;

  // Failed → reset back to checklist phase (student starts over)
  if (status === 'failed' || status === 'cancelled') return allChecklistMet ? 0 : -1;

  const statusMap: Record<string, number> = {
    registered: 1,
    verified: 2,
    examiner_assigned: 3,
    scheduled: 4,
    ongoing: 4,
    passed: 5,
    passed_with_revision: 5,
  };

  return statusMap[status] ?? -1;
}

type StepperTheme = 'default' | 'success';

function getStepperTheme(status: ThesisSeminarStatus | null): StepperTheme {
  if (status === 'passed' || status === 'passed_with_revision') return 'success';
  return 'default';
}

interface SeminarStatusStepperProps {
  status: ThesisSeminarStatus | null;
  allChecklistMet: boolean;
}

export function StudentThesisSeminarStatusCard({ status, allChecklistMet }: SeminarStatusStepperProps) {
  const activeIndex = getActiveStepIndex(status, allChecklistMet);
  const theme = getStepperTheme(status);

  // Theme color classes
  const themeClasses = {
    default: {
      completed: 'border-primary bg-primary text-primary-foreground',
      current: 'border-primary bg-primary/10 text-primary',
      line: 'bg-primary',
      text: 'text-primary',
    },
    success: {
      completed: 'border-emerald-500 bg-emerald-500 text-white',
      current: 'border-emerald-500 bg-emerald-50 text-emerald-600',
      line: 'bg-emerald-500',
      text: 'text-emerald-600',
    },
  };

  const colors = themeClasses[theme];

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
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
                    i === 0 ? 'bg-transparent' : isCompleted ? colors.line : 'bg-muted'
                  )}
                />
                {/* Circle */}
                <div
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isCompleted && colors.completed,
                    isCurrent && colors.current,
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
                    i === STEPS.length - 1 ? 'bg-transparent' : isCompleted ? colors.line : 'bg-muted'
                  )}
                />
              </div>
              <span
                className={cn(
                  'mt-2 text-xs text-center max-w-[100px]',
                  (isCompleted || isCurrent) ? cn(colors.text, 'font-medium') : 'text-muted-foreground'
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
