import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Loading } from '@/components/ui/spinner';
import { useStudentAttendanceHistory } from '@/hooks/seminar';
import { AttendanceSummaryCard } from '@/components/seminar/AttendanceHistory';
import { AttendanceHistoryTable } from '@/components/seminar/AttendanceHistoryTable';

const TABS = [
  { label: 'Seminar Hasil', to: '/tugas-akhir/seminar/student', end: true },
  { label: 'Riwayat Kehadiran', to: '/tugas-akhir/seminar/student/attendance' },
];

export default function StudentSeminarAttendance() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar/student' },
      { label: 'Riwayat Kehadiran' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const { data, isLoading, isFetching } = useStudentAttendanceHistory();

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Riwayat Kehadiran Seminar</h1>
          <p className="text-gray-500">Daftar kehadiran Anda pada seminar mahasiswa lain</p>
        </div>
      </div>

      <TabsNav tabs={TABS} />

      {isLoading ? (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center">
          <Loading size="lg" text="Memuat riwayat kehadiran..." />
        </div>
      ) : data ? (
        <div className="space-y-6">
          <AttendanceSummaryCard summary={data.summary} />
          <AttendanceHistoryTable
            records={data.records}
            isLoading={isLoading}
            isFetching={isFetching}
          />
        </div>
      ) : (
        <div className="flex h-[calc(100vh-280px)] items-center justify-center text-muted-foreground">
          Data kehadiran tidak tersedia.
        </div>
      )}
    </div>
  );
}
