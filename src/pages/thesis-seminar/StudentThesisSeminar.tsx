import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import { StudentThesisSeminarOverviewPanel } from '@/components/thesis-seminar/StudentThesisSeminarOverviewPanel';
import { StudentThesisSeminarAttendanceHistoryPanel } from '@/components/thesis-seminar/StudentThesisSeminarAttendanceHistoryPanel';
import {
  useStudentSeminarOverview,
  useStudentSeminarHistory,
  useStudentAttendanceHistory
} from '@/hooks/thesis-seminar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function StudentThesisSeminar() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'ringkasan';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab }, { replace: true });
  };

  const {
    data: overview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
    error: overviewError,
    refetch: refetchOverview,
  } = useStudentSeminarOverview();
  const { data: history, isLoading: isHistoryLoading } = useStudentSeminarHistory();
  const { data: attendance, isLoading: isAttendanceLoading, isFetching: isAttendanceFetching } = useStudentAttendanceHistory();

  const isLoading = isOverviewLoading || isHistoryLoading;

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
      { label: activeTab === 'riwayat-kehadiran' ? 'Riwayat Kehadiran' : 'Status & Pendaftaran' },
    ],
    [activeTab]
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="p-4 space-y-6">
        <Skeleton className="h-10 w-[250px]" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[200px] w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  const tabs = [
    { label: 'Ringkasan', value: 'ringkasan' },
    { label: 'Riwayat Kehadiran', value: 'riwayat-kehadiran' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Seminar Hasil</h1>
          <p className="text-muted-foreground">
            Pantau status seminar, checklist persyaratan, unggah dokumen, dan lihat riwayat kehadiran seminar hasil
          </p>
        </div>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'riwayat-kehadiran' ? (
        <StudentThesisSeminarAttendanceHistoryPanel
          attendance={attendance}
          isLoading={isAttendanceLoading}
          isFetching={isAttendanceFetching}
        />
      ) : isOverviewError ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {overviewError instanceof Error
              ? overviewError.message
              : 'Gagal memuat data seminar hasil.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => refetchOverview()}>
            Coba lagi
          </Button>
        </div>
      ) : overview ? (
        <StudentThesisSeminarOverviewPanel
          overview={overview}
          history={history || []}
          onDetailClick={(id) => navigate(`/tugas-akhir/seminar-hasil/${id}`)}
        />
      ) : null}
    </div>
  );
}
