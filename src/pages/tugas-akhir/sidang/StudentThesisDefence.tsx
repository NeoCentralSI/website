import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/spinner';
import { useStudentDefenceOverview, useStudentDefenceHistory } from '@/hooks/defence';
import { DefenceStatusStepper } from '@/components/sidang/DefenceStatusStepper';
import { DefenceInfoCard } from '@/components/sidang/DefenceInfoCard';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { ChecklistPersyaratanSidang } from '@/components/sidang/ChecklistPersyaratanSidang';
import { UploadDokumenSidang } from '@/components/sidang/UploadDokumenSidang';
import type { ThesisDefenceStatus, StudentDefenceHistoryItem } from '@/types/defence.types';
import { formatDateOnlyId, toTitleCaseName } from '@/lib/text';
import { ChevronRight, Calendar, Users, Trophy, MapPin, Video } from 'lucide-react';

const PASSED_STATUSES: ThesisDefenceStatus[] = ['passed', 'passed_with_revision'];
const HISTORY_STATUSES: ThesisDefenceStatus[] = ['failed', 'cancelled'];
const INFO_CARD_STATUSES: ThesisDefenceStatus[] = [
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

function HistoryCard({ item, onClick }: { item: StudentDefenceHistoryItem; onClick: () => void }) {
  const isOnline = !item.room && !!item.meetingLink;
  const hasScore = item.finalScore !== null;

  let sectionCount = 0;
  if (item.examiners.length > 0) sectionCount++;
  if (item.date) sectionCount++;
  if (item.room || isOnline) sectionCount++;
  if (hasScore) sectionCount++;

  const gridCols =
    sectionCount <= 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : sectionCount === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <Card className="cursor-pointer transition-colors hover:bg-muted/50" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Sidang Tugas Akhir</CardTitle>
          <div className="flex items-center gap-2">
            <ThesisEventStatusBadge status={item.status} />
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridCols} gap-4`}>
          {item.examiners.length > 0 && (
            <div className="flex gap-2.5">
              <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">Dosen Penguji</p>
                {item.examiners.map((e) => (
                  <p key={`${e.lecturerId}-${e.order}`} className="text-sm truncate">
                    <span className="text-muted-foreground">Penguji {e.order}:</span>{' '}
                    <span className="font-medium">{toTitleCaseName(e.lecturerName || '-')}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {item.date && (
            <div className="flex gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Jadwal</p>
                <p className="text-sm font-medium">{formatDateOnlyId(item.date)}</p>
                <p className="text-xs text-muted-foreground">{formatTimeRange(item.startTime, item.endTime)}</p>
              </div>
            </div>
          )}

          {isOnline ? (
            <div className="flex gap-2.5">
              <Video className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Mode</p>
                <Badge variant="outline" className="text-xs">Daring</Badge>
              </div>
            </div>
          ) : item.room ? (
            <div className="flex gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Ruangan</p>
                <p className="text-sm font-medium">{item.room.name}</p>
              </div>
            </div>
          ) : null}

          {hasScore && (
            <div className="flex gap-2.5">
              <Trophy className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground">Nilai Akhir</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">{item.finalScore?.toFixed(2)}</span>
                  {item.grade && (
                    <Badge variant="destructive" className="text-sm">
                      {item.grade}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {item.cancelledReason && (
          <p className="text-sm text-destructive mt-3">Alasan: {item.cancelledReason}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentThesisDefence() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading } = useStudentDefenceOverview();
  const { data: defenceHistory } = useStudentDefenceHistory();

  const defenceStatus = data?.defence?.status ?? null;
  const isPassed = defenceStatus ? PASSED_STATUSES.includes(defenceStatus) : false;
  const isOngoing = defenceStatus === 'ongoing';
  const showInfoCard = defenceStatus ? INFO_CARD_STATUSES.includes(defenceStatus) : false;
  const checklistIsRecap = isPassed || isOngoing;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Sidang Tugas Akhir</h1>
        <p className="text-gray-500">Status dan progres sidang tugas akhir</p>
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data sidang..." />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <DefenceStatusStepper
            status={data.defence?.status ?? null}
            allChecklistMet={data.allChecklistMet}
          />

          {data.defence && showInfoCard && (
            <DefenceInfoCard
              defence={data.defence}
              onClick={() => navigate(`/tugas-akhir/sidang/student/history/${data.defence!.id}`)}
            />
          )}

          <div className="space-y-2">
            {checklistIsRecap && (
              <p className="text-sm text-muted-foreground">
                Rekap persyaratan dan dokumen sidang yang telah dikumpulkan.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChecklistPersyaratanSidang checklist={data.checklist} />
              <UploadDokumenSidang allChecklistMet={data.allChecklistMet} />
            </div>
          </div>

          {(() => {
            const baseHistoryItems = (defenceHistory ?? []).filter(
              (item) => HISTORY_STATUSES.includes(item.status)
            );

            const overviewDefence = data.defence;
            const shouldInjectOverviewAsHistory =
              !!overviewDefence &&
              ['failed', 'cancelled'].includes(overviewDefence.status) &&
              !baseHistoryItems.some((item) => item.id === overviewDefence.id);

            const historyItems = shouldInjectOverviewAsHistory
              ? [
                  {
                    id: overviewDefence.id,
                    status: overviewDefence.status,
                    registeredAt: overviewDefence.registeredAt,
                    date: overviewDefence.date,
                    startTime: overviewDefence.startTime,
                    endTime: overviewDefence.endTime,
                    meetingLink: overviewDefence.meetingLink,
                    finalScore: overviewDefence.finalScore,
                    grade: overviewDefence.grade,
                    resultFinalizedAt: overviewDefence.resultFinalizedAt,
                    cancelledReason: overviewDefence.cancelledReason,
                    room: overviewDefence.room,
                    examiners: overviewDefence.examiners,
                  },
                  ...baseHistoryItems,
                ]
              : baseHistoryItems;

            if (historyItems.length === 0) return null;
            return (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Riwayat Sidang</h2>
                <div className="space-y-3">
                  {historyItems.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onClick={() => navigate(`/tugas-akhir/sidang/student/history/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data sidang tidak tersedia.
        </div>
      )}
    </div>
  );
}
