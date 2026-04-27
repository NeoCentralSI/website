import { useState, useMemo } from 'react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import type { AttendanceRecord } from '@/types/seminar.types';
import { useQueryClient } from '@tanstack/react-query';
import { 
  ThesisStudentInfoCell, 
  ThesisTitleCell 
} from '@/components/shared/ThesisTableCells';
import { ThesisSeminarDateCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  isFetching: boolean;
  onDetail?: (id: string) => void;
}

export function StudentThesisSeminarAttendanceHistoryTable({
  records,
  isLoading,
  isFetching,
  onDetail,
}: AttendanceHistoryTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredRecords = useMemo(() => {
    return records.filter(
      (r) =>
        r.seminar.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.seminar.thesisTitle.toLowerCase().includes(search.toLowerCase())
    );
  }, [records, search]);

  const pagedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, page, pageSize]);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: 'presenter',
      header: 'Presenter',
      width: 200,
      render: (row) => (
        <ThesisStudentInfoCell
          name={row.seminar.studentName}
          nim={row.seminar.studentNim}
        />
      ),
    },
    {
      key: 'thesis',
      header: 'Judul TA',
      width: 300,
      render: (row) => (
        <ThesisTitleCell title={row.seminar.thesisTitle} />
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 130,
      render: (row) => <ThesisSeminarDateCell date={row.seminar.date} />,
    },
    {
      key: 'status',
      header: 'Status Kehadiran',
      width: 150,
      render: (row) => (
        <Badge variant={row.status === 'verified' ? 'success' : 'warning'}>
          {row.status === 'verified' ? 'Hadir (Terverifikasi)' : 'Menunggu Verifikasi'}
        </Badge>
      ),
    },
    {
      key: 'verifiedBy',
      header: 'Diverifikasi Oleh',
      width: 180,
      render: (row) => (
        <span className="text-xs">{row.verifiedBy?.name || '-'}</span>
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
          className="h-8 w-8"
          onClick={() => onDetail?.(row.seminarId)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <CustomTable
      data={pagedRecords}
      columns={columns as any}
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
        <RefreshButton
          onClick={() => queryClient.invalidateQueries({ queryKey: ['student-seminar-attendance'] })}
          isRefreshing={isFetching && !isLoading}
        />
      }
    />
  );
}
