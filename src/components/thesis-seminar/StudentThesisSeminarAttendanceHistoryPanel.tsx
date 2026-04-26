import { Loading } from '@/components/ui/spinner';
import { StudentThesisSeminarAttendanceHistoryCard } from './StudentThesisSeminarAttendanceHistoryCard';
import { StudentThesisSeminarAttendanceHistoryTable } from './StudentThesisSeminarAttendanceHistoryTable';
import type { AttendanceHistoryResponse } from '@/types/seminar.types';

interface StudentThesisSeminarAttendanceHistoryPanelProps {
  attendance?: AttendanceHistoryResponse;
  isLoading: boolean;
  isFetching: boolean;
}

export function StudentThesisSeminarAttendanceHistoryPanel({
  attendance,
  isLoading,
  isFetching,
}: StudentThesisSeminarAttendanceHistoryPanelProps) {
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-320px)] items-center justify-center">
        <Loading size="lg" text="Memuat riwayat kehadiran..." />
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Data riwayat kehadiran belum tersedia.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentThesisSeminarAttendanceHistoryCard summary={attendance.summary} />
      <StudentThesisSeminarAttendanceHistoryTable
        records={attendance.records}
        isLoading={isLoading}
        isFetching={isFetching}
      />
    </div>
  );
}
