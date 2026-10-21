import { AlertCircle, Check, Clock, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { ProposalStep } from './studentProposalState';

/**
 * The vertical stepper of the student Proposal page, in the form of
 * `StudentThesisSeminarStatusCard` (emerald checks, a progress bar). A failed assessment is red.
 */
export function StudentProposalStatusCard({ steps }: { steps: ProposalStep[] }) {
  const completed = steps.filter((step) => step.state === 'done').length;
  const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;

  return (
    <div className="box-border flex h-full flex-1 self-stretch flex-col rounded-[10px] border border-gray-200 bg-card p-[18px_18px_14px]">
      <div className="mb-[18px] text-base font-semibold text-foreground">Status Proposal</div>

      <ol className="relative flex flex-1 flex-col pl-8" aria-label="Tahap proposal">
        {steps.map((step, index) => {
          const isDone = step.state === 'done';
          const isFailed = step.state === 'failed';
          const isAttention = step.state === 'attention';
          return (
            <li key={step.key} className={cn('relative', index < steps.length - 1 ? 'pb-[16px]' : 'pb-0')} data-state={step.state}>
              {index < steps.length - 1 ? (
                <div
                  className={cn('absolute bottom-[-13px] top-[13px] z-0 w-[2px]', isDone && steps[index + 1]?.state === 'done' ? 'bg-emerald-600' : 'bg-muted')}
                  style={{ left: '-21px' }}
                />
              ) : null}
              <div
                className={cn(
                  'absolute -left-8 top-[2px] z-[1] flex h-[22px] w-[22px] items-center justify-center rounded-full border-[2.5px]',
                  isDone && 'border-emerald-600 bg-emerald-600 text-white shadow-[0_0_0_3px_#dcfce7]',
                  isFailed && 'border-red-600 bg-red-600 text-white shadow-[0_0_0_3px_#fee2e2]',
                  isAttention && 'border-amber-500 bg-amber-500 text-white shadow-[0_0_0_3px_#fef3c7]',
                  step.state === 'waiting' && 'border-gray-300 bg-white text-gray-400 shadow-[0_0_0_3px_#f3f4f6]',
                )}
              >
                {isDone ? <Check size={10} strokeWidth={2.5} /> : isFailed ? <X size={10} strokeWidth={2.5} /> : isAttention ? <AlertCircle size={10} strokeWidth={2.5} /> : <Clock size={10} strokeWidth={2} />}
              </div>
              <div className={cn('mb-0.5 text-sm font-semibold leading-[1.3]', isDone || isFailed || isAttention ? 'text-foreground' : 'text-muted-foreground')}>
                {step.label}
              </div>
              <div className={cn('text-xs font-medium', isDone ? 'text-emerald-600' : isFailed ? 'text-red-600' : isAttention ? 'text-amber-600' : 'text-muted-foreground')}>
                {step.note}
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-[18px] border-t border-gray-200 pt-[14px]">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Progres Keseluruhan</span>
          <span className="text-xs font-bold text-emerald-600">{progress}%</span>
        </div>
        <div className="h-[6px] overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 text-xs font-medium text-muted-foreground">{completed} dari {steps.length} tahap selesai</div>
      </div>
    </div>
  );
}
