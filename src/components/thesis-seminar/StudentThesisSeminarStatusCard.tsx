import { Check, Clock } from 'lucide-react';
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

interface SeminarStatusStepperProps {
  status: ThesisSeminarStatus | null;
  allChecklistMet: boolean;
}

export function StudentThesisSeminarStatusCard({ status, allChecklistMet }: SeminarStatusStepperProps) {
  const activeIndex = getActiveStepIndex(status, allChecklistMet);
  const completedCount = Math.max(0, activeIndex);
  const spinePct = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e8e8e4',
        borderRadius: 10,
        padding: '18px 18px 14px',
        height: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111', marginBottom: 6 }}>
        Status Seminar
      </div>
      <div style={{ fontSize: 10.5, color: '#aaa', marginBottom: 18 }}>
        Progres pengajuan seminar hasil
      </div>

      <div style={{ position: 'relative', paddingLeft: 32, flex: 1 }}>
        {/* Spine */}
        <div
          style={{
            position: 'absolute',
            left: 10,
            top: 6,
            bottom: 6,
            width: 2,
            background:
              spinePct > 0
                ? `linear-gradient(to bottom, #16A34A ${spinePct}%, #d1d5db ${spinePct}%)`
                : '#d1d5db',
          }}
        />

        {STEPS.map((step, i) => {
          const isCompleted = i < activeIndex;
          const isCurrent = i === activeIndex && activeIndex >= 0;
          const isActive = isCompleted || isCurrent;

          return (
            <div
              key={step.key}
              style={{ position: 'relative', paddingBottom: i < STEPS.length - 1 ? 22 : 0 }}
            >
              {/* Node */}
              <div
                style={{
                  position: 'absolute',
                  left: -32,
                  top: 2,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: isActive ? '#16A34A' : '#fff',
                  border: `2.5px solid ${isActive ? '#16A34A' : '#d1d5db'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isActive ? '#fff' : '#bbb',
                  zIndex: 1,
                  boxShadow: isActive ? '0 0 0 3px #dcfce7' : '0 0 0 3px #f3f4f6',
                }}
              >
                {isActive ? (
                  <Check size={10} strokeWidth={2.5} />
                ) : (
                  <Clock size={10} strokeWidth={2} />
                )}
              </div>

              {/* Step name */}
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isActive ? '#111' : '#aaa',
                  lineHeight: 1.3,
                  marginBottom: 3,
                }}
              >
                {step.label}
              </div>

              {/* Step status */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 10.5,
                  fontWeight: 500,
                  color: isActive ? '#16A34A' : '#bbb',
                }}
              >
                {isActive ? 'Terpenuhi' : 'Menunggu'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress summary */}
      <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #f0ede8' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: 10.5, color: '#888', fontWeight: 500 }}>Progres Keseluruhan</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16A34A' }}>{spinePct}%</span>
        </div>
        <div
          style={{ background: '#e8e8e4', borderRadius: 100, height: 6, overflow: 'hidden' }}
        >
          <div
            style={{
              width: `${spinePct}%`,
              height: '100%',
              borderRadius: 100,
              background: 'linear-gradient(to right, #16A34A, #22c55e)',
            }}
          />
        </div>
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 5 }}>
          {completedCount} dari {STEPS.length} tahap selesai
        </div>
      </div>
    </div>
  );
}
