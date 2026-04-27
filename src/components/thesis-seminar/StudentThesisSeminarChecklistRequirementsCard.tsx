import { Check, Clock } from 'lucide-react';
import type { SeminarChecklist } from '@/types/seminar.types';

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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 7,
        background: met ? '#f0fdf4' : '#fafaf8',
        border: `1px solid ${met ? '#bbf7d0' : '#e8e8e4'}`,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: met ? '#16A34A' : '#f3f4f6',
          border: met ? 'none' : '1.5px solid #d1d5db',
          color: met ? '#fff' : '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {met ? <Check size={11} strokeWidth={2.5} /> : <Clock size={11} strokeWidth={2} />}
      </div>

      <div>
        <strong style={{ fontSize: 12, fontWeight: 600, color: '#111', display: 'block' }}>
          {label}
        </strong>
        <span style={{ fontSize: 10.5, color: met ? '#16A34A' : '#aaa' }}>{statusText}</span>
      </div>
    </div>
  );
}

export function StudentThesisSeminarChecklistRequirementsCard({ checklist }: ChecklistPersyaratanProps) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e8e4', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 14 }}>
        Checklist Persyaratan
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
