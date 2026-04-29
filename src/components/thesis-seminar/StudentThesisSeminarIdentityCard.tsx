import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { toTitleCaseName, formatDateOnlyId } from '@/lib/text';
import { ChevronRight, Users, Calendar, MapPin, Video, Trophy } from 'lucide-react';
import type { SeminarInfo, ThesisSeminarStatus } from '@/types/seminar.types';
import { cn } from '@/lib/utils';

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
      <div key="examiners" className="flex flex-col gap-0.5">
        <div className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
          <Users size={12} className="opacity-50" />
          Dosen Penguji
        </div>
        {activeExaminers.map((e, idx) => (
          <div
            key={e.id}
            className={cn(
              "font-medium truncate",
              idx === 0 ? "text-[12.5px] text-foreground" : "text-[11px] text-muted-foreground"
            )}
          >
            {toTitleCaseName(e.lecturerName)}
          </div>
        ))}
      </div>
    );
  }

  if (showSchedule && seminar.date) {
    blocks.push(
      <div key="schedule" className="flex flex-col gap-0.5">
        <div className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
          <Calendar size={12} className="opacity-50" />
          Jadwal
        </div>
        <div className="text-[12.5px] text-foreground font-medium">
          {formatDateOnlyId(seminar.date)}
        </div>
        {timeRange && (
          <div className="text-[11px] text-muted-foreground">{timeRange}</div>
        )}
      </div>
    );
  }

  if (showSchedule && (seminar.room || isOnline)) {
    blocks.push(
      <div key="location" className="flex flex-col gap-0.5">
        <div className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
          {isOnline ? (
            <Video size={12} className="opacity-50" />
          ) : (
            <MapPin size={12} className="opacity-50" />
          )}
          {isOnline ? 'Mode Seminar' : 'Ruangan'}
        </div>
        {isOnline ? (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
              Daring
            </span>
            {seminar.meetingLink && (
              <a
                href={seminar.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-emerald-600 font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Buka Link
              </a>
            )}
          </div>
        ) : (
          <div className="text-[12.5px] text-foreground font-medium truncate">
            {seminar.room?.name}
          </div>
        )}
      </div>
    );
  }

  if (showScore) {
    blocks.push(
      <div key="score" className="flex flex-col gap-0.5">
        <div className="text-[10.5px] text-muted-foreground font-medium flex items-center gap-1">
          <Trophy size={12} className="opacity-50" />
          Nilai Akhir
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[16px] font-bold text-foreground">
            {seminar.finalScore?.toFixed(2)}
          </span>
          <span className="text-[11px] text-muted-foreground">/ {seminar.maxWeight || 100}</span>
        </div>
      </div>
    );
  }

  const colCount = blocks.length || 1;
  const gridCols = colCount === 1 ? 'grid-cols-1' : colCount === 2 ? 'grid-cols-2' : colCount === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border border-[#e8e8e4] rounded-[10px] p-[16px_18px] transition-all duration-200",
        onClick && "cursor-pointer hover:bg-gray-50/80 hover:border-gray-300/80 hover:shadow-sm"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-[14px]">
        <div className="text-[13px] font-bold text-foreground">Informasi Seminar</div>
        <div className="flex items-center gap-2">
          <ThesisEventStatusBadge
            status={seminar.status}
            scheduledDate={seminar.date}
            startTime={seminar.startTime}
          />
          {onClick && <ChevronRight size={16} className="text-muted-foreground opacity-50 shrink-0" />}
        </div>
      </div>

      {/* Info grid */}
      <div className={cn("grid gap-y-3 gap-x-4", gridCols)}>
        {blocks}
      </div>
    </div>
  );
}
