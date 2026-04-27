import { useMemo } from 'react';
import { Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import CustomTable from '@/components/layout/CustomTable';
import { 
  ThesisStudentInfoCell, 
  ThesisTitleCell,
  ThesisPersonnelListCell
} from '@/components/shared/ThesisTableCells';
import { ThesisSeminarDateCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { ThesisSeminarExaminersCell } from '@/components/thesis-seminar/atoms/ThesisSeminarPersonnelCells';
import type { AdminSeminarListItem } from '@/types/seminar.types';

interface StudentThesisSeminarAnnouncementTableProps {
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
}

export function StudentThesisSeminarAnnouncementTable({
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
}: StudentThesisSeminarAnnouncementTableProps) {
  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Mahasiswa',
        width: 200,
        render: (row: AdminSeminarListItem) => (
          <ThesisStudentInfoCell name={row.studentName} nim={row.studentNim} />
        ),
      },
      {
        key: 'thesis',
        header: 'Judul TA',
        width: 300,
        render: (row: AdminSeminarListItem) => (
          <ThesisTitleCell title={row.thesisTitle} />
        ),
      },
      {
        key: 'date',
        header: 'Tanggal',
        width: 130,
        render: (row: AdminSeminarListItem) => <ThesisSeminarDateCell date={row.date} />,
      },
      {
        key: 'supervisors',
        header: 'Pembimbing',
        width: 200,
        render: (row: AdminSeminarListItem) => (
          <ThesisPersonnelListCell people={row.supervisors} />
        ),
      },
      {
        key: 'examiners',
        header: 'Penguji',
        width: 250,
        render: (row: AdminSeminarListItem) => (
          <ThesisSeminarExaminersCell examiners={row.examiners ?? []} />
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
      emptyText="Belum ada pengumuman seminar hasil"
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
