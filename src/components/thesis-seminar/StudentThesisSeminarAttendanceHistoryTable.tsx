import { useState, useMemo } from 'react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { RefreshButton } from '@/components/ui/refresh-button';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import type { AttendanceRecord } from '@/types/seminar.types';
import { useQueryClient } from '@tanstack/react-query';

interface AttendanceHistoryTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  isFetching: boolean;
}

export function StudentThesisSeminarAttendanceHistoryTable({
  records,
  isLoading,
  isFetching,
}: AttendanceHistoryTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredData = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return records;
    return records.filter(
      (r) =>
        (r.presenterName || '').toLowerCase().includes(term) ||
        (r.thesisTitle || '').toLowerCase().includes(term)
    );
  }, [records, search]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

  const columns = useMemo<Column<AttendanceRecord>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 50,
        className: 'text-center',
        render: (_item, index) => (
          <span className="text-sm text-muted-foreground">
            {(page - 1) * pageSize + index + 1}
          </span>
        ),
      },
      {
        key: 'presenterName',
        header: 'Nama Presenter',
        render: (item) => (
          <span className="font-medium">{toTitleCaseName(item.presenterName)}</span>
        ),
      },
      {
        key: 'thesisTitle',
        header: 'Judul',
        className: 'max-w-md whitespace-normal',
        render: (item) => (
          <span className="text-sm">{item.thesisTitle}</span>
        ),
      },
      {
        key: 'date',
        header: 'Tanggal',
        width: 180,
        render: (item) => (
          <span className="text-sm whitespace-nowrap">
            {item.date ? formatDateId(item.date) : '-'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 120,
        render: (item) => (
          <Badge variant={item.isPresent ? 'success' : 'destructive'}>
            {item.isPresent ? 'Hadir' : 'Tidak Hadir'}
          </Badge>
        ),
      },
      {
        key: 'approvedBy',
        header: 'Diverifikasi Oleh',
        width: 180,
        render: (item) => (
          <span className="text-sm">
            {item.approvedBy ? toTitleCaseName(item.approvedBy) : '-'}
          </span>
        ),
      },
    ],
    [page, pageSize]
  );

  return (
    <CustomTable
      columns={columns}
      data={paginatedData}
      loading={isLoading}
      isRefreshing={isFetching && !isLoading}
      total={filteredData.length}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(s) => {
        setPageSize(s);
        setPage(1);
      }}
      searchValue={search}
      onSearchChange={setSearch}
      emptyText="Belum ada data kehadiran"
      actions={
        <RefreshButton
          onClick={() =>
            queryClient.invalidateQueries({ queryKey: ['thesis-seminar', 'student', 'attendance'] })
          }
          isRefreshing={isFetching && !isLoading}
        />
      }
    />
  );
}
