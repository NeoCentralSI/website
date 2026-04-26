import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';
import { ChevronRight, Calendar, Users, Trophy, MapPin, Video } from 'lucide-react';
import type { SeminarHistoryItem } from '@/types/seminar.types';

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '-';
  const fmtTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  return `${fmtTime(startTime)} - ${fmtTime(endTime)} WIB`;
}

export const StudentThesisSeminarHistoryCard = ({ item, onClick }: { item: SeminarHistoryItem; onClick: () => void }) => {
  const isOnline = !item.room && !!item.meetingLink;
  const hasScore = item.finalScore !== null;

  const sectionCount = useMemo(() => {
    let count = 0;
    if (item.examiners.length > 0) count++;
    if (item.date) count++;
    if (item.room || isOnline) count++;
    if (hasScore) count++;
    return count;
  }, [item, isOnline, hasScore]);

  const gridCols =
    sectionCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : sectionCount === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:bg-muted/30 border-l-4 border-l-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Seminar Hasil</CardTitle>
          <div className="flex items-center gap-2">
            <ThesisEventStatusBadge status={item.status} />
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridCols} gap-4`}>
          {/* Examiners */}
          {item.examiners.length > 0 && (
            <div className="flex gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dosen Penguji</p>
                {item.examiners.map((e) => (
                  <p key={e.order} className="text-sm truncate">
                    <span className="text-muted-foreground">P{e.order}:</span>{' '}
                    <span className="font-medium">{toTitleCaseName(e.lecturerName)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          {item.date && (
            <div className="flex gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jadwal</p>
                <p className="text-sm font-medium">{formatDateOnlyId(item.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(item.startTime, item.endTime)}
                </p>
              </div>
            </div>
          )}

          {/* Room / Online */}
          {(item.room || isOnline) && (
            <div className="flex gap-2.5">
              {isOnline ? <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" /> : <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />}
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lokasi/Mode</p>
                {isOnline ? (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">Daring</Badge>
                ) : (
                  <p className="text-sm font-medium">{item.room?.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Score */}
          {hasScore && (
            <div className="flex gap-2.5">
              <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nilai Akhir</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">{item.finalScore?.toFixed(2)}</span>
                  {item.grade && (
                    <Badge variant="outline" className="text-xs font-bold border-primary text-primary">
                      {item.grade}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
