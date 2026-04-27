import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import { StudentThesisSeminarOverviewPanel } from '@/components/thesis-seminar/StudentThesisSeminarOverviewPanel';
import { StudentThesisSeminarAttendanceHistoryPanel } from '@/components/thesis-seminar/StudentThesisSeminarAttendanceHistoryPanel';
import { useStudentThesisSeminar } from '@/hooks/thesis-seminar/useStudentThesisSeminar';
import { Skeleton } from '@/components/ui/skeleton';

const TAB_ITEMS: TabItem[] = [
  { label: 'Ringkasan', to: '/tugas-akhir/seminar-hasil/ringkasan' },
  { label: 'Riwayat Kehadiran', to: '/tugas-akhir/seminar-hasil/riwayat-kehadiran' },
];

export default function StudentThesisSeminar() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeTab = pathname.includes('riwayat-kehadiran') ? 'attendance' : 'overview';
  const { overview, history, attendance, isLoading, isAttendanceLoading, isAttendanceFetching } =
    useStudentThesisSeminar();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil' },
      { label: activeTab === 'attendance' ? 'Riwayat Kehadiran' : 'Status & Pendaftaran' },
    ],
    [activeTab]
  );

  useEffect(() => {
    if (pathname === '/tugas-akhir/seminar-hasil' || pathname === '/tugas-akhir/seminar-hasil/') {
      navigate('/tugas-akhir/seminar-hasil/ringkasan', { replace: true });
    }
    setBreadcrumbs(breadcrumbs);
    setTitle('Seminar Hasil');
  }, [pathname, navigate, setBreadcrumbs, setTitle, breadcrumbs]);

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

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Seminar Hasil</h1>
          <p className="text-gray-500">
            Pantau status seminar, unggah dokumen, dan lihat riwayat kehadiran seminar
          </p>
        </div>
      </div>

      <TabsNav tabs={TAB_ITEMS} />

      {activeTab === 'attendance' ? (
        <StudentThesisSeminarAttendanceHistoryPanel
          attendance={attendance}
          isLoading={isAttendanceLoading}
          isFetching={isAttendanceFetching}
        />
      ) : overview ? (
        <StudentThesisSeminarOverviewPanel
          overview={overview}
          history={history}
          onDetailClick={(id) => navigate(`/tugas-akhir/seminar-hasil/student/history/${id}`)}
        />
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Data seminar hasil belum tersedia.
        </div>
      )}
    </div>
  );
}
