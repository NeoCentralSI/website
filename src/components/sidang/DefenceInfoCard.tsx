import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toTitleCaseName, formatDateOnlyId } from '@/lib/text';
import { Users, Calendar, MapPin, Video, Trophy } from 'lucide-react';
import type { DefenceInfo, ThesisDefenceStatus } from '@/types/defence.types';
import { DefenceStatusBadge } from '@/components/sidang/DefenceStatusBadge';

const FINALIZED_STATUSES: ThesisDefenceStatus[] = ['passed', 'passed_with_revision', 'failed'];
const SCHEDULED_STATUSES: ThesisDefenceStatus[] = ['scheduled', 'ongoing', 'passed', 'passed_with_revision', 'failed'];
const CARD_VISIBLE_STATUSES: ThesisDefenceStatus[] = [
  'examiner_assigned',
  'scheduled',
  'ongoing',
  'passed',
  'passed_with_revision',
];

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

interface DefenceInfoCardProps {
  defence: DefenceInfo;
  onClick?: () => void;
}

export function DefenceInfoCard({ defence, onClick }: DefenceInfoCardProps) {
  if (!CARD_VISIBLE_STATUSES.includes(defence.status)) return null;

  const showSchedule = SCHEDULED_STATUSES.includes(defence.status);
  const showScore = FINALIZED_STATUSES.includes(defence.status) && defence.finalScore !== null;
  const isOnline = !defence.room && !!defence.meetingLink;

  const activeExaminers = defence.examiners.filter(
    (e) => e.availabilityStatus === 'available'
  );

  let sectionCount = 0;
  if (activeExaminers.length > 0) sectionCount++;
  if (showSchedule) sectionCount++;
  if (showSchedule && (defence.room || isOnline)) sectionCount++;
  if (showScore) sectionCount++;

  const gridCols =
    sectionCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : sectionCount === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <Card
      className={onClick ? 'cursor-pointer transition-colors hover:bg-muted/50' : undefined}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Informasi Sidang</CardTitle>
          <DefenceStatusBadge status={defence.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridCols} gap-4`}>
          {activeExaminers.length > 0 && (
            <div className="flex gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Dosen Penguji</p>
                {activeExaminers.map((e) => (
                  <p key={e.id} className="text-sm truncate">
                    <span className="text-muted-foreground">Penguji {e.order}:</span>{' '}
                    <span className="font-medium">{toTitleCaseName(e.lecturerName)}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {showSchedule && (
            <div className="flex gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Jadwal</p>
                <p className="text-sm font-medium">{formatDateOnlyId(defence.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(defence.startTime, defence.endTime)}
                </p>
              </div>
            </div>
          )}

          {showSchedule && (
            <>
              {isOnline ? (
                <div className="flex gap-2.5">
                  <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Mode Sidang</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Daring</Badge>
                      {defence.meetingLink && (
                        <a
                          href={defence.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Buka Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : defence.room ? (
                <div className="flex gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Ruangan</p>
                    <p className="text-sm font-medium">{defence.room.name}</p>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {showScore && (
            <div className="flex gap-2.5">
              <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Nilai Akhir</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{defence.finalScore?.toFixed(2)}</span>
                  {defence.grade && (
                    <Badge
                      variant={defence.status === 'failed' ? 'destructive' : 'success'}
                      className="text-sm"
                    >
                      {defence.grade}
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
}
