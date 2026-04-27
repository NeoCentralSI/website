import { useMemo } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import CustomTable from '@/components/layout/CustomTable';
import { ThesisSeminarTitleCell } from '@/components/thesis-seminar/atoms/ThesisSeminarTitleCell';
import { ThesisSeminarDateCell, ThesisSeminarRoomCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { ThesisSeminarExaminersCell, ThesisSeminarAudienceCell } from '@/components/thesis-seminar/atoms/ThesisSeminarPersonnelCells';
import type { AdminSeminarListItem } from '@/types/seminar.types';

interface AdminThesisSeminarTableProps {
  data: AdminSeminarListItem[];
  loading: boolean;
  isRefreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  onDetail: (id: string) => void;
  actions?: React.ReactNode;
  emptyText?: string;
}

export function AdminThesisSeminarTable({
  data,
  loading,
  isRefreshing,
  page,
  pageSize,
  total,
  searchValue,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onDetail,
  actions,
  emptyText = 'Belum ada data seminar hasil',
}: AdminThesisSeminarTableProps) {
  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Mahasiswa / Judul TA',
        width: 320,
        render: (row: AdminSeminarListItem) => (
          <ThesisSeminarTitleCell
            thesisTitle={row.thesisTitle}
            studentName={row.studentName}
            studentNim={row.studentNim}
          />
        ),
      },
      {
        key: 'date',
        header: 'Tanggal',
        width: 130,
        render: (row: AdminSeminarListItem) => <ThesisSeminarDateCell date={row.date} />,
      },
      {
        key: 'room',
        header: 'Ruangan',
        width: 180,
        render: (row: AdminSeminarListItem) => <ThesisSeminarRoomCell room={row.room} />,
      },
      {
        key: 'status',
        header: 'Status',
        width: 200,
        render: (row: AdminSeminarListItem) => (
          <ThesisEventStatusBadge
            status={row.status}
            scheduledDate={row.date}
            startTime={row.startTime}
          />
        ),
      },
      {
        key: 'examiners',
        header: 'Penguji',
        width: 280,
        render: (row: AdminSeminarListItem) => (
          <ThesisSeminarExaminersCell examiners={row.examiners ?? []} />
        ),
      },
      {
        key: 'audiences',
        header: 'Audience',
        width: 100,
        className: 'text-center',
        render: (row: AdminSeminarListItem) => (
          <ThesisSeminarAudienceCell count={row.audienceCount ?? 0} />
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 64,
        className: 'text-center',
        render: (row: AdminSeminarListItem) => (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDetail(row.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
        ),
      },
    ],
    [onDetail]
  );

  return (
    <CustomTable
      data={data}
      columns={columns as any}
      loading={loading}
      isRefreshing={isRefreshing}
      emptyText={emptyText}
      page={page}
      pageSize={pageSize}
      total={total}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      searchValue={searchValue}
      onSearchChange={onSearchChange}
      actions={actions}
    />
  );
}
