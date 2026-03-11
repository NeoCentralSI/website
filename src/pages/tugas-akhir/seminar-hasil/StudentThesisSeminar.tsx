import { useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Loading } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStudentSeminarOverview, useStudentSeminarHistory } from '@/hooks/seminar';
import { SeminarStatusStepper } from '@/components/seminar/SeminarStatusStepper';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { SeminarInfoCard } from '@/components/seminar/SeminarInfoCard';
import { ChecklistPersyaratan } from '@/components/seminar/ChecklistPersyaratan';
import { UploadDokumenSeminar } from '@/components/seminar/UploadDokumenSeminar';
import { formatDateOnlyId } from '@/lib/text';
import { toTitleCaseName } from '@/lib/text';
import { ChevronRight, Calendar, Users, Trophy, MapPin, Video } from 'lucide-react';
import type { ThesisSeminarStatus, SeminarHistoryItem } from '@/types/seminar.types';

const TABS = [
  { label: 'Seminar Hasil', to: '/tugas-akhir/seminar/student', end: true },
  { label: 'Riwayat Kehadiran', to: '/tugas-akhir/seminar/student/attendance', end: false },
];

/** Statuses where the "Informasi Seminar" card is shown */
const INFO_CARD_STATUSES: ThesisSeminarStatus[] = [
  'examiner_assigned',
  'scheduled',
  'ongoing',
  'passed',
  'passed_with_revision',
];

/** Statuses where the result is finalized (passed / passed_with_revision) */
const PASSED_STATUSES: ThesisSeminarStatus[] = ['passed', 'passed_with_revision'];

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

function HistoryCard({ item, onClick }: { item: SeminarHistoryItem; onClick: () => void }) {
  const isOnline = !item.room && !!item.meetingLink;
  const hasScore = item.finalScore !== null;

  // Count sections to determine grid
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
    <Card
      className="cursor-pointer transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Seminar Hasil</CardTitle>
          <div className="flex items-center gap-2">
            <SeminarStatusBadge status={item.status} />
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
                <p className="text-xs font-medium text-muted-foreground">Dosen Penguji</p>
                {item.examiners.map((e) => (
                  <p key={e.order} className="text-sm truncate">
                    <span className="text-muted-foreground">Penguji {e.order}:</span>{' '}
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
                <p className="text-xs font-medium text-muted-foreground">Jadwal</p>
                <p className="text-sm font-medium">{formatDateOnlyId(item.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeRange(item.startTime, item.endTime)}
                </p>
              </div>
            </div>
          )}

          {/* Room / Online */}
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

          {/* Score */}
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

        {/* Cancelled reason */}
        {item.cancelledReason && (
          <p className="text-sm text-destructive mt-3">Alasan: {item.cancelledReason}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function StudentThesisSeminar() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading } = useStudentSeminarOverview();
  const { data: seminarHistory } = useStudentSeminarHistory();

  const seminarStatus = data?.seminar?.status ?? null;
  const isPassed = seminarStatus ? PASSED_STATUSES.includes(seminarStatus) : false;
  const showInfoCard = seminarStatus ? INFO_CARD_STATUSES.includes(seminarStatus) : false;
  const checklistIsRecap = isPassed;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Seminar Hasil</h1>
          <p className="text-gray-500">Status dan progres seminar hasil tugas akhir</p>
        </div>
      </div>

      <TabsNav tabs={TABS} />

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat data seminar..." />
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Status Seminar Stepper */}
          <SeminarStatusStepper
            status={data.seminar?.status ?? null}
            allChecklistMet={data.allChecklistMet}
          />

          {/* Informasi Seminar Card (progressive info) */}
          {data.seminar && showInfoCard && (
            <SeminarInfoCard
              seminar={data.seminar}
              onClick={() => navigate(`/tugas-akhir/seminar/student/history/${data.seminar!.id}`)}
            />
          )}

          {/* Checklist + Upload */}
          <div className="space-y-2">
            {checklistIsRecap && (
              <p className="text-sm text-muted-foreground">
                Rekap persyaratan dan dokumen seminar yang telah dikumpulkan.
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChecklistPersyaratan checklist={data.checklist} />
              <UploadDokumenSeminar allChecklistMet={data.allChecklistMet} />
            </div>
          </div>

          {/* Seminar History (only failed/cancelled — passed items are shown in InfoCard) */}
          {(() => {
            const historyItems = (seminarHistory ?? []).filter(
              (item) => !PASSED_STATUSES.includes(item.status)
            );
            if (historyItems.length === 0) return null;
            return (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Riwayat Seminar Hasil</h2>
                <div className="space-y-3">
                  {historyItems.map((item) => (
                    <HistoryCard
                      key={item.id}
                      item={item}
                      onClick={() => navigate(`/tugas-akhir/seminar/student/history/${item.id}`)}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data seminar tidak tersedia.
        </div>
      )}
    </div>
  );
}