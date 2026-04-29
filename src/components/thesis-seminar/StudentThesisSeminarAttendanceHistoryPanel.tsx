import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttendanceHistoryResponse, AttendanceRecord } from '@/types/seminar.types';
import {
  ThesisStudentInfoCell,
  ThesisTitleCell,
} from '@/components/shared/ThesisTableCells';
import { ThesisSeminarDateCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { ThesisSeminarLecturerCell } from '@/components/thesis-seminar/atoms/ThesisSeminarPersonnelCells';

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const summary = attendance?.summary;

  const filteredRecords = useMemo(() => {
    const q = search.toLowerCase();
    const safeRecords = attendance?.records ?? [];
    return safeRecords.filter(
      (r) =>
        r.presenterName.toLowerCase().includes(q) ||
        r.thesisTitle.toLowerCase().includes(q)
    );
  }, [attendance?.records, search]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  // Handle data refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['student-seminar', 'attendance'] });
  };

  const getAttendanceStatus = (row: AttendanceRecord) => {
    // If approved, strictly "Hadir"
    if (row.isPresent) {
      return { variant: 'success' as const, text: 'Hadir' };
    }

    // Logic for unverified status
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const seminarDate = row.date ? new Date(row.date) : null;
    if (seminarDate) {
      seminarDate.setHours(0, 0, 0, 0);
    }

    if (!seminarDate || now < seminarDate) {
      return { variant: 'warning' as const, text: 'Menunggu Verifikasi' };
    }

    if (now > seminarDate) {
      return { variant: 'destructive' as const, text: 'Tidak Hadir' };
    }

    // On the same day but not verified yet
    return { variant: 'warning' as const, text: 'Menunggu Verifikasi' };
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-320px)] items-center justify-center">
        <Loading size="lg" text="Memuat riwayat kehadiran..." />
      </div>
    );
  }

  if (!attendance) {
    return (
      <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        Data riwayat kehadiran belum tersedia.
      </div>
    );
  }

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'presenter',
      header: 'Presenter',
      width: 200,
      render: (row) => (
        <ThesisStudentInfoCell
          name={row.presenterName}
          nim={row.presenterNim || '-'}
        />
      ),
    },
    {
      key: 'thesis',
      header: 'Judul TA',
      width: 300,
      render: (row) => <ThesisTitleCell title={row.thesisTitle} />,
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 130,
      render: (row) => <ThesisSeminarDateCell date={row.date} />,
    },
    {
      key: 'status',
      header: 'Status Kehadiran',
      width: 150,
      render: (row) => {
        const status = getAttendanceStatus(row);
        return (
          <Badge
            variant={status.variant}
            className={cn(
              "font-medium",
              status.variant === 'success' && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100/80 border-emerald-200",
              status.variant === 'warning' && "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200",
              status.variant === 'destructive' && "bg-rose-100 text-rose-700 hover:bg-rose-100/80 border-rose-200"
            )}
          >
            {status.text}
          </Badge>
        );
      },
    },
    {
      key: 'verifiedBy',
      header: 'Diverifikasi Oleh',
      width: 180,
      render: (row) => (
        <ThesisSeminarLecturerCell
          name={row.approvedBy || '-'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: 64,
      className: 'text-center',
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-muted"
          onClick={() => navigate(`/tugas-akhir/seminar-hasil/${row.seminarId}`)}
        >
          <Eye className="w-4 h-4 text-muted-foreground" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CustomTable
        data={pagedRecords}
        columns={columns}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        emptyText="Belum ada riwayat kehadiran seminar hasil"
        page={page}
        pageSize={pageSize}
        total={filteredRecords.length}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        actions={
          <div className="flex items-center justify-end gap-3 w-full sm:min-w-[480px]">
            <div className="flex items-center gap-3 mr-1">
              <Badge
                variant={summary?.met ? 'success' : 'warning'}
                className={cn(
                  "px-3 py-0.5 rounded-full font-semibold border text-[11px] uppercase tracking-wider shadow-sm",
                  summary?.met
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {summary?.met ? 'Syarat Terpenuhi' : 'Belum Terpenuhi'}
              </Badge>
              <span className="text-sm font-medium text-gray-700">
                <span className="text-gray-900 font-bold">{summary?.attended ?? 0}</span> / {summary?.required ?? 0} Hadir
              </span>
            </div>
            <RefreshButton
              onClick={handleRefresh}
              isRefreshing={isFetching && !isLoading}
              className="shrink-0"
            />
          </div>
        }
      />
    </div>
  );
}
