import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { toTitleCaseName, formatDateOnlyId } from '@/lib/text';
import { ChevronRight, Users, Calendar, MapPin, Video, Trophy } from 'lucide-react';
import type { SeminarInfo, ThesisSeminarStatus } from '@/types/seminar.types';

/** Statuses that show full info including score/grade */
const FINALIZED_STATUSES: ThesisSeminarStatus[] = ['passed', 'passed_with_revision', 'failed'];

/** Statuses that show schedule info */
const SCHEDULED_STATUSES: ThesisSeminarStatus[] = [
  'scheduled',
  'ongoing',
  'passed',
  'passed_with_revision',
  'failed',
];

/** Statuses where the card should be rendered */
const CARD_VISIBLE_STATUSES: ThesisSeminarStatus[] = [
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

interface SeminarInfoCardProps {
  seminar: SeminarInfo;
  onClick?: () => void;
}

export function StudentThesisSeminarIdentityCard({ seminar, onClick }: SeminarInfoCardProps) {
  if (!CARD_VISIBLE_STATUSES.includes(seminar.status)) return null;

  const showSchedule = SCHEDULED_STATUSES.includes(seminar.status);
  const showScore = FINALIZED_STATUSES.includes(seminar.status) && seminar.finalScore !== null;
  const isOnline = !seminar.room && !!seminar.meetingLink;

  // Filter to available examiners only
  const activeExaminers = seminar.examiners.filter(
    (e) => e.availabilityStatus === 'available'
  );

  // Count how many sections are visible to determine grid cols
  let sectionCount = 0;
  if (activeExaminers.length > 0) sectionCount++;
  if (showSchedule) sectionCount++; // jadwal
  if (showSchedule && (seminar.room || isOnline)) sectionCount++; // ruangan/daring
  if (showScore) sectionCount++;

  const gridCols =
    sectionCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : sectionCount === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Informasi Seminar</CardTitle>
          <div className="flex items-center gap-2">
            <ThesisEventStatusBadge 
              status={seminar.status} 
              scheduledDate={seminar.date} 
              startTime={seminar.startTime} 
            />
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridCols} gap-4`}>
          {/* Examiners Section */}
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

          {/* Schedule Section */}
          {showSchedule && (
            <div className="flex gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Jadwal</p>
                <p className="text-sm font-medium">{formatDateOnlyId(seminar.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(seminar.startTime, seminar.endTime)}
                </p>
              </div>
            </div>
          )}

          {/* Room / Meeting Link */}
          {showSchedule && (
            <>
              {isOnline ? (
                <div className="flex gap-2.5">
                  <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Mode Seminar</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Daring</Badge>
                      {seminar.meetingLink && (
                        <a
                          href={seminar.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Buka Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ) : seminar.room ? (
                <div className="flex gap-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium text-muted-foreground">Ruangan</p>
                    <p className="text-sm font-medium">{seminar.room.name}</p>
                  </div>
                </div>
              ) : null}
            </>
          )}

          {/* Score Section */}
          {showScore && (
            <div className="flex gap-2.5">
              <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Nilai Akhir</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{seminar.finalScore?.toFixed(2)}</span>
                  {seminar.grade && (
                    <Badge
                      variant={seminar.status === 'failed' ? 'destructive' : 'success'}
                      className="text-sm"
                    >
                      {seminar.grade}
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
