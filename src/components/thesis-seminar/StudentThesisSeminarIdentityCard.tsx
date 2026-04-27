import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { toTitleCaseName, formatDateOnlyId } from '@/lib/text';
import { ChevronRight, Users, Calendar, MapPin, Video, Trophy } from 'lucide-react';
import type { SeminarInfo, ThesisSeminarStatus } from '@/types/seminar.types';

const FINALIZED_STATUSES: ThesisSeminarStatus[] = ['passed', 'passed_with_revision', 'failed'];

const SCHEDULED_STATUSES: ThesisSeminarStatus[] = [
  'scheduled',
  'ongoing',
  'passed',
  'passed_with_revision',
  'failed',
];

const CARD_VISIBLE_STATUSES: ThesisSeminarStatus[] = [
  'examiner_assigned',
  'scheduled',
  'ongoing',
  'passed',
  'passed_with_revision',
];

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '';
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  return `${fmtTime(startTime)} – ${fmtTime(endTime)} WIB`;
}

interface SeminarInfoCardProps {
  seminar: SeminarInfo;
  onClick?: () => void;
}

export function StudentThesisSeminarIdentityCard({ seminar, onClick }: SeminarInfoCardProps) {
  if (!CARD_VISIBLE_STATUSES.includes(seminar.status)) return null;

  const showSchedule = SCHEDULED_STATUSES.includes(seminar.status);
  const showScore = FINALIZED_STATUSES.includes(seminar.status) && seminar.finalScore !== null;
  const isOnline = !seminar.room && !!seminar.meetingLink;
  const timeRange = formatTimeRange(seminar.startTime, seminar.endTime);

  const activeExaminers = seminar.examiners.filter(
    (e) => e.availabilityStatus === 'available'
  );

  // Build visible info blocks for dynamic column count
  const blocks: React.ReactNode[] = [];

  if (activeExaminers.length > 0) {
    blocks.push(
      <div key="examiners" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Users size={12} style={{ opacity: 0.5 }} />
          Dosen Penguji
        </div>
        {activeExaminers.map((e, idx) => (
          <div
            key={e.id}
            style={{
              fontSize: idx === 0 ? 12.5 : 11,
              color: idx === 0 ? '#111' : '#888',
              fontWeight: 500,
            }}
          >
            {toTitleCaseName(e.lecturerName)}
          </div>
        ))}
      </div>
    );
  }

  if (showSchedule && seminar.date) {
    blocks.push(
      <div key="schedule" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} style={{ opacity: 0.5 }} />
          Jadwal
        </div>
        <div style={{ fontSize: 12.5, color: '#111', fontWeight: 500 }}>
          {formatDateOnlyId(seminar.date)}
        </div>
        {timeRange && (
          <div style={{ fontSize: 11, color: '#888' }}>{timeRange}</div>
        )}
      </div>
    );
  }

  if (showSchedule && (seminar.room || isOnline)) {
    blocks.push(
      <div key="location" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          {isOnline ? (
            <Video size={12} style={{ opacity: 0.5 }} />
          ) : (
            <MapPin size={12} style={{ opacity: 0.5 }} />
          )}
          {isOnline ? 'Mode Seminar' : 'Ruangan'}
        </div>
        {isOnline ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                background: '#dbeafe',
                color: '#2563eb',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 4,
                padding: '2px 7px',
              }}
            >
              Daring
            </span>
            {seminar.meetingLink && (
              <a
                href={seminar.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11.5, color: '#16A34A', textDecoration: 'underline' }}
                onClick={(e) => e.stopPropagation()}
              >
                Buka Link
              </a>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: '#111', fontWeight: 500 }}>
            {seminar.room?.name}
          </div>
        )}
      </div>
    );
  }

  if (showScore) {
    blocks.push(
      <div key="score" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ fontSize: 10.5, color: '#aaa', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Trophy size={12} style={{ opacity: 0.5 }} />
          Nilai Akhir
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>
            {seminar.finalScore?.toFixed(2)}
          </span>
          <span style={{ fontSize: 11, color: '#aaa' }}>/ {seminar.maxWeight || 100}</span>
        </div>
      </div>
    );
  }

  const colCount = blocks.length || 1;
  const gridCols = `repeat(${Math.min(colCount, 4)}, 1fr)`;

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        border: '1px solid #e8e8e4',
        borderRadius: 10,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Informasi Seminar</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThesisEventStatusBadge
            status={seminar.status}
            scheduledDate={seminar.date}
            startTime={seminar.startTime}
          />
          {onClick && <ChevronRight size={16} style={{ color: '#aaa', flexShrink: 0 }} />}
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: '12px 16px' }}>
        {blocks}
      </div>
    </div>
  );
}
