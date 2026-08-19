import { Eye } from 'lucide-react';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { Button } from '@/components/ui/button';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';
import type { SeminarHistoryItem } from '@/types/seminar.types';

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '';
  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  return `${formatTime(startTime)} – ${formatTime(endTime)} WIB`;
}

interface StudentThesisSeminarHistoryCardProps {
  index: number;
  item: SeminarHistoryItem;
  onClick: () => void;
}

export function StudentThesisSeminarHistoryCard({
  index,
  item,
  onClick,
}: StudentThesisSeminarHistoryCardProps) {
  const isOnline = !item.room && Boolean(item.meetingLink);
  const timeRange = formatTimeRange(item.startTime, item.endTime);

  return (
    <div className="grid min-w-[820px] grid-cols-[48px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_80px_minmax(145px,1fr)_104px] items-center gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-muted/30">
      <span className="text-center text-sm text-muted-foreground">{index}</span>

      <div className="min-w-0 space-y-0.5">
        {item.examiners.length > 0 ? (
          item.examiners.map((examiner) => (
            <div key={examiner.order} className="truncate text-sm font-medium text-foreground">
              {toTitleCaseName(examiner.lecturerName)}
            </div>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>

      <div className="min-w-0">
        {item.date ? (
          <>
            <div className="text-sm font-medium text-foreground">{formatDateOnlyId(item.date)}</div>
            {timeRange ? <div className="mt-0.5 text-xs text-muted-foreground">{timeRange}</div> : null}
          </>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </div>

      <div className="truncate text-sm text-foreground">
        {item.room ? item.room.name : isOnline ? 'Daring' : '-'}
      </div>

      <div className="text-sm font-semibold text-foreground">
        {item.finalScore !== null ? item.finalScore.toFixed(2) : '-'}
      </div>

      <div>
        <ThesisEventStatusBadge status={item.status} />
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onClick}>
        <Eye className="mr-2 h-4 w-4" />
        Detail
      </Button>
    </div>
  );
}
