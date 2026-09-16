import { Check, Clock, PartyPopper } from 'lucide-react';
import type { SeminarMilestone, ThesisSeminarStatus } from '@/types/seminar.types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SeminarStatusStepperProps {
  status: ThesisSeminarStatus | null;
  milestones: SeminarMilestone[];
}

export function StudentThesisSeminarStatusCard({ status, milestones }: SeminarStatusStepperProps) {
  const completedCount = milestones.filter((item) => item.checked).length;
  const progress = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;
  const isFinalized = status === 'passed' || status === 'passed_with_revision';

  return (
    <div className="bg-card border border-gray-200 rounded-[10px] p-[18px_18px_14px] h-full flex flex-col box-border">
      <div className="text-base font-semibold text-foreground mb-1.5 flex items-center justify-between">
        Status Seminar
        {isFinalized ? (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-5 px-1.5 text-[10px]">
            <PartyPopper className="mr-1 h-2.5 w-2.5" />
            Selesai
          </Badge>
        ) : null}
      </div>
      <div className="text-xs text-muted-foreground mb-[18px]">Progres pengajuan seminar hasil</div>

      <div className="relative pl-8 flex-1 flex flex-col">
        {milestones.map((step, index) => (
          <div
            key={step.id}
            className={cn('relative', index < milestones.length - 1 ? 'pb-[22px]' : 'pb-0')}
          >
            {index < milestones.length - 1 ? (
              <div
                className={cn(
                  'absolute top-[13px] bottom-[-13px] w-[2px] z-0',
                  step.checked && milestones[index + 1]?.checked ? 'bg-emerald-600' : 'bg-muted'
                )}
                style={{ left: '-21px' }}
              />
            ) : null}
            <div
              className={cn(
                'absolute -left-8 top-[2px] w-[22px] h-[22px] rounded-full flex items-center justify-center z-[1] border-[2.5px]',
                step.checked
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-[0_0_0_3px_#dcfce7]'
                  : 'bg-white border-gray-300 text-gray-400 shadow-[0_0_0_3px_#f3f4f6]'
              )}
            >
              {step.checked ? <Check size={10} strokeWidth={2.5} /> : <Clock size={10} strokeWidth={2} />}
            </div>
            <div className={cn('text-sm font-semibold leading-[1.3] mb-0.5', step.checked ? 'text-foreground' : 'text-muted-foreground')}>
              {step.label}
            </div>
            <div className={cn('text-xs font-medium', step.checked ? 'text-emerald-600' : 'text-muted-foreground')}>
              {step.checked ? 'Terpenuhi' : 'Menunggu'}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[18px] pt-[14px] border-t border-gray-200">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">Progres Keseluruhan</span>
          <span className="text-xs font-bold text-emerald-600">{progress}%</span>
        </div>
        <div className="bg-muted rounded-full h-[6px] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1.5 font-medium">
          {completedCount > 0
            ? `${completedCount} dari ${milestones.length} tahap selesai`
            : 'Checklist persyaratan belum terpenuhi'}
        </div>
      </div>
    </div>
  );
}
