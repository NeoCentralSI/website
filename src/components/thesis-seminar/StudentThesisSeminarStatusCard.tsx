import { Check, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { ThesisSeminarStatus } from '@/types/seminar.types';

const STEPS = [
  { 
    id: 'registration', 
    label: 'Pendaftaran', 
    statuses: ['registered'],
    description: 'Mahasiswa mendaftar seminar hasil'
  },
  { 
    id: 'validation', 
    label: 'Validasi Admin', 
    statuses: ['verified'],
    description: 'Dokumen sedang divalidasi oleh admin'
  },
  { 
    id: 'assignment', 
    label: 'Penetapan Penguji', 
    statuses: ['examiner_assigned'],
    description: 'Penetapan tim penguji oleh Departemen'
  },
  { 
    id: 'scheduling', 
    label: 'Penjadwalan', 
    statuses: ['scheduled'],
    description: 'Penentuan jadwal dan ruang seminar'
  },
  { 
    id: 'ongoing', 
    label: 'Pelaksanaan', 
    statuses: ['ongoing'],
    description: 'Seminar hasil sedang berlangsung'
  },
  { 
    id: 'result', 
    label: 'Selesai', 
    statuses: ['passed', 'passed_with_revision', 'failed'],
    description: 'Hasil seminar telah diputuskan'
  }
];

interface StepperProps {
  status: ThesisSeminarStatus | null;
  allChecklistMet: boolean;
}

export const SeminarStatusStepper = ({ status, allChecklistMet }: StepperProps) => {
  // Determine current step index
  const currentStepIndex = STEPS.findIndex(step => step.statuses.includes(status as string));
  const isCancelled = status === 'cancelled';

  return (
    <Card className="overflow-hidden border-none shadow-sm bg-muted/20">
      <CardContent className="p-6">
        <div className="relative flex justify-between">
          {/* Connector Line */}
          <div className="absolute top-5 left-0 w-full h-0.5 bg-muted -z-0" />
          
          {STEPS.map((step, index) => {
            const isCompleted = currentStepIndex > index || (status === 'passed' && index === STEPS.length - 1);
            const isCurrent = currentStepIndex === index;
            const isLocked = !allChecklistMet && index > 0;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-4 bg-background",
                  isCompleted ? "border-primary bg-primary text-primary-foreground" : 
                  isCurrent ? "border-primary text-primary scale-110 shadow-md ring-4 ring-primary/20" : 
                  "border-muted text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="h-5 w-5" /> : 
                   isCurrent ? <Clock className="h-5 w-5 animate-pulse" /> : 
                   <span className="text-xs font-bold">{index + 1}</span>}
                </div>
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter leading-none",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </p>
                </div>
                
                {/* Tooltip-like description on hover */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-popover text-popover-foreground text-[10px] p-2 rounded shadow-lg border w-32 text-center z-20">
                  {step.description}
                </div>
              </div>
            );
          })}
        </div>

        {isCancelled && (
          <div className="mt-6 flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
            <AlertCircle className="h-5 w-5" />
            <span>Seminar ini telah dibatalkan.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const StudentThesisSeminarStatusCard = SeminarStatusStepper;
