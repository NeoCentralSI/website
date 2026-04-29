import { useMemo, useState } from 'react';
import { CheckSquare, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import CustomTable from '@/components/layout/CustomTable';
import type { AdminSeminarListItem } from '@/types/seminar.types';
import { AdminThesisSeminarValidationModal } from '@/components/thesis-seminar/AdminThesisSeminarValidationModal';

import { 
  ThesisStudentInfoCell, 
  ThesisTitleCell, 
  ThesisPersonnelListCell 
} from '@/components/shared/ThesisTableCells';


interface AdminThesisSeminarValidationTableProps {
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

export function AdminThesisSeminarValidationTable({
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
}: AdminThesisSeminarValidationTableProps) {
  const [selectedSeminar, setSelectedSeminar] = useState<AdminSeminarListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        key: 'supervisors',
        header: 'Pembimbing',
        width: 200,
        render: (row: AdminSeminarListItem) => (
          <ThesisPersonnelListCell people={row.supervisors} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 180,
        render: (row: AdminSeminarListItem) => (
          <ThesisEventStatusBadge
            status={row.status}
            scheduledDate={row.date}
            startTime={row.startTime}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 96,
        className: 'text-center',
        render: (row: AdminSeminarListItem) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDetail(row.id)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {row.status === 'registered' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSelectedSeminar(row);
                  setIsModalOpen(true);
                }}
              >
                <CheckSquare className="w-4 h-4" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [onDetail]
  );

  return (
    <>
      <CustomTable<AdminSeminarListItem>
        data={data}
        columns={columns}
        loading={loading}
        isRefreshing={isRefreshing}
        emptyText="Belum ada data pendaftaran yang perlu divalidasi"
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        searchValue={searchValue}
        onSearchChange={onSearchChange}
        actions={actions}
      />

      <AdminThesisSeminarValidationModal
        seminar={selectedSeminar}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
