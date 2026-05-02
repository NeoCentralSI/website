import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';
import type { StudentDefenceHistoryItem } from '@/types/defence.types';

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

export const StudentThesisDefenceHistoryCard = ({
  index,
  item,
  onClick,
}: {
  index: number;
  item: StudentDefenceHistoryItem;
  onClick: () => void;
}) => {
  const isOnline = !item.room && !!item.meetingLink;
  const timeRange = formatTimeRange(item.startTime, item.endTime);

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-[40px_1.5fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center p-[10px] bg-card border border-gray-200 rounded-[8px] cursor-pointer hover:bg-accent/50 hover:shadow-sm transition-all duration-200"
    >
      {/* # */}
      <span className="text-xs font-semibold text-muted-foreground">{index}</span>

      {/* Examiners */}
      <div className="min-w-0 flex flex-col">
        {item.examiners.length > 0 ? (
          item.examiners.map((e: { lecturerName: string; order: number }) => (
            <div
              key={e.order}
              className="truncate text-sm font-medium text-foreground"
            >
              {toTitleCaseName(e.lecturerName)}
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {/* Date + time */}
      <div className="flex flex-col">
        {item.date ? (
          <>
            <div className="text-sm text-foreground font-medium">{formatDateOnlyId(item.date)}</div>
            {timeRange && (
              <div className="text-xs text-muted-foreground font-medium">{timeRange}</div>
            )}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {/* Room */}
      <div className="text-sm text-foreground font-medium truncate">
        {item.room ? (
          item.room.name
        ) : isOnline ? (
          <span className="bg-blue-50 text-blue-600 text-[10.5px] font-semibold px-[7px] py-[2px] rounded">
            Daring
          </span>
        ) : (
          '—'
        )}
      </div>

      {/* Score */}
      <div>
        {item.finalScore !== null ? (
          <span className="text-base font-bold text-foreground">
            {item.finalScore.toFixed(2)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </div>

      {/* Status */}
      <div>
        <ThesisEventStatusBadge status={item.status} />
      </div>

      {/* Detail button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="px-[9px] py-[3px] border border-[#e8e8e4] bg-white text-[#888] text-[10.5px] rounded-[5px] cursor-pointer font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-[#111] transition-all duration-200"
      >
        Detail
      </button>
    </div>
  );
};
