import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';
import type { SeminarHistoryItem } from '@/types/seminar.types';

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

export const StudentThesisSeminarHistoryCard = ({
  index,
  item,
  onClick,
}: {
  index: number;
  item: SeminarHistoryItem;
  onClick: () => void;
}) => {
  const isOnline = !item.room && !!item.meetingLink;
  const timeRange = formatTimeRange(item.startTime, item.endTime);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 1.5fr 1fr 1fr 1fr 1fr auto',
        gap: 8,
        alignItems: 'center',
        padding: '10px 10px',
        background: '#fafaf8',
        border: '1px solid #eeece8',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      {/* # */}
      <span style={{ fontSize: 12, fontWeight: 600, color: '#bbb' }}>{index}</span>

      {/* Examiners */}
      <div style={{ minWidth: 0 }}>
        {item.examiners.length > 0 ? (
          item.examiners.map((e) => (
            <div
              key={e.order}
              style={{
                fontSize: e.order === 1 ? 12 : 10.5,
                fontWeight: e.order === 1 ? 500 : 400,
                color: e.order === 1 ? '#111' : '#aaa',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {toTitleCaseName(e.lecturerName)}
            </div>
          ))
        ) : (
          <span style={{ fontSize: 11.5, color: '#bbb' }}>—</span>
        )}
      </div>

      {/* Date + time */}
      <div>
        {item.date ? (
          <>
            <div style={{ fontSize: 11.5, color: '#555' }}>{formatDateOnlyId(item.date)}</div>
            {timeRange && (
              <div style={{ fontSize: 10.5, color: '#aaa' }}>{timeRange}</div>
            )}
          </>
        ) : (
          <span style={{ fontSize: 11.5, color: '#bbb' }}>—</span>
        )}
      </div>

      {/* Room */}
      <div style={{ fontSize: 11.5, color: '#555' }}>
        {item.room ? (
          item.room.name
        ) : isOnline ? (
          <span
            style={{
              background: '#dbeafe',
              color: '#2563eb',
              fontSize: 10.5,
              fontWeight: 600,
              borderRadius: 4,
              padding: '2px 7px',
            }}
          >
            Daring
          </span>
        ) : (
          '—'
        )}
      </div>

      {/* Score */}
      <div>
        {item.finalScore !== null ? (
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
            {item.finalScore.toFixed(2)}
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: '#bbb' }}>—</span>
        )}
      </div>

      {/* Status */}
      <div>
        <ThesisEventStatusBadge status={item.status} />
      </div>

      {/* Detail button */}
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        style={{
          padding: '3px 9px',
          border: '1px solid #e8e8e4',
          background: '#fff',
          color: '#888',
          fontSize: 10.5,
          borderRadius: 5,
          cursor: 'pointer',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        Detail
      </button>
    </div>
  );
};
