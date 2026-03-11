import { CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DefenceChecklist } from '@/types/defence.types';

interface ChecklistItemProps {
  label: string;
  met: boolean;
  status: 'completed' | 'pending';
}

function ChecklistItem({ label, met, status }: ChecklistItemProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        status === 'completed' && 'bg-green-50 border-green-200',
        status === 'pending' && 'bg-muted/30 border-muted'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            status === 'completed' && 'bg-green-100 text-green-600',
            status === 'pending' && 'bg-muted text-muted-foreground'
          )}
        >
          {status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <Clock className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p
            className={cn(
              'text-xs mt-1',
              status === 'completed' && 'text-green-600',
              status === 'pending' && 'text-muted-foreground'
            )}
          >
            {met ? 'Terpenuhi' : 'Menunggu'}
          </p>
        </div>
      </div>
    </div>
  );
}

interface ChecklistPersyaratanSidangProps {
  checklist: DefenceChecklist;
}

export function ChecklistPersyaratanSidang({ checklist }: ChecklistPersyaratanSidangProps) {
  // Don't show revision card if seminar status is 'passed' (no revision needed)
  const showRevisiCard = checklist.revisiSeminar.seminarStatus !== 'passed';

  const items: { label: string; met: boolean; visible: boolean }[] = [
    { label: checklist.lulusSeminar.label, met: checklist.lulusSeminar.met, visible: true },
    { label: checklist.sks.label, met: checklist.sks.met, visible: true },
    { label: checklist.revisiSeminar.label, met: checklist.revisiSeminar.met, visible: showRevisiCard },
    { label: checklist.pembimbing.label, met: checklist.pembimbing.met, visible: true },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Checklist Persyaratan</h3>
      <div className="space-y-3">
        {items.filter((i) => i.visible).map((item) => (
          <ChecklistItem
            key={item.label}
            label={item.label}
            met={item.met}
            status={item.met ? 'completed' : 'pending'}
          />
        ))}
      </div>
    </div>
  );
}
