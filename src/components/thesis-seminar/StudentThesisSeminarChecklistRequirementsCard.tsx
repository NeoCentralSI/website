import { CheckCircle2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { SeminarChecklist } from '@/types/seminar.types';

interface ChecklistPersyaratanProps {
  checklist: SeminarChecklist;
}

function ChecklistItem({
  label,
  met,
  current,
  required,
  status,
}: {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
  status: 'completed' | 'in-progress' | 'pending';
}) {
  const hasProgress = current !== undefined && required !== undefined;
  const percentage = hasProgress ? Math.min((current / required) * 100, 100) : 0;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        status === 'completed' && 'bg-green-50 border-green-200',
        status === 'in-progress' && 'bg-amber-50 border-amber-200',
        status === 'pending' && 'bg-muted/30 border-muted'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
            status === 'completed' && 'bg-green-100 text-green-600',
            status === 'in-progress' && 'bg-amber-100 text-amber-600',
            status === 'pending' && 'bg-muted text-muted-foreground'
          )}
        >
          {status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : status === 'in-progress' && hasProgress ? (
            <span>{`${current}/${required}`}</span>
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {hasProgress && !met && (
            <Progress
              value={percentage}
              className={cn(
                'mt-2 h-2',
                status === 'in-progress' && '[&>div]:bg-amber-500'
              )}
            />
          )}
          <p
            className={cn(
              'text-xs mt-1',
              status === 'completed' && 'text-green-600',
              status === 'in-progress' && 'text-amber-600',
              status === 'pending' && 'text-muted-foreground'
            )}
          >
            {status === 'completed' && 'Terpenuhi'}
            {status === 'in-progress' && 'Dalam Proses'}
            {status === 'pending' && 'Menunggu'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function StudentThesisSeminarChecklistRequirementsCard({ checklist }: ChecklistPersyaratanProps) {
  const getStatus = (item: { met: boolean; current?: number; required?: number }) => {
    if (item.met) return 'completed' as const;
    if (item.current !== undefined && item.current > 0) return 'in-progress' as const;
    return 'pending' as const;
  };

  // Pembimbing: pending if not met and no progress indicator
  const pembimbingStatus = checklist.pembimbing.met ? 'completed' as const : 'pending' as const;

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Checklist Persyaratan</h3>
      <div className="space-y-3">
        <ChecklistItem
          label={checklist.bimbingan.label}
          met={checklist.bimbingan.met}
          current={checklist.bimbingan.current}
          required={checklist.bimbingan.required}
          status={getStatus(checklist.bimbingan)}
        />
        <ChecklistItem
          label={checklist.kehadiran.label}
          met={checklist.kehadiran.met}
          current={checklist.kehadiran.current}
          required={checklist.kehadiran.required}
          status={getStatus(checklist.kehadiran)}
        />
        <ChecklistItem
          label={checklist.pembimbing.label}
          met={checklist.pembimbing.met}
          status={pembimbingStatus}
        />
      </div>
    </div>
  );
}
