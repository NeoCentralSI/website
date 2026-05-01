import { useMemo, useState } from 'react';
import { ClipboardCheck, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { CustomTable } from '@/components/layout/CustomTable';
import type { AdminDefenceListItem } from '@/types/defence.types';
import { AdminThesisDefenceValidationFormDialog } from '@/components/thesis-defence/AdminThesisDefenceValidationFormDialog';

import {
  ThesisStudentInfoCell,
  ThesisTitleCell,
  ThesisPersonnelListCell
} from '@/components/shared/ThesisTableCells';

interface AdminThesisDefenceValidationTableProps {
  data: AdminDefenceListItem[];
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

export function AdminThesisDefenceValidationTable({
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
}: AdminThesisDefenceValidationTableProps) {
  const [selectedDefence, setSelectedDefence] = useState<AdminDefenceListItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = useMemo(
    () => [
      {
        key: 'student',
        header: 'Mahasiswa',
        width: 200,
        render: (row: AdminDefenceListItem) => (
          <ThesisStudentInfoCell name={row.studentName} nim={row.studentNim} />
        ),
      },
      {
        key: 'thesis',
        header: 'Judul TA',
        width: 300,
        render: (row: AdminDefenceListItem) => (
          <ThesisTitleCell title={row.thesisTitle} />
        ),
      },
      {
        key: 'supervisors',
        header: 'Pembimbing',
        width: 200,
        render: (row: AdminDefenceListItem) => (
          <ThesisPersonnelListCell people={row.supervisors} />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 180,
        render: (row: AdminDefenceListItem) => (
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
        width: 128,
        className: 'text-center',
        render: (row: AdminDefenceListItem) => (
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onDetail(row.id)}
              title="Lihat Detail"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {row.status === 'registered' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setSelectedDefence(row);
                  setIsModalOpen(true);
                }}
                title="Validasi Pendaftaran"
              >
                <ClipboardCheck className="w-4 h-4" />
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
      <CustomTable<AdminDefenceListItem>
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

      <AdminThesisDefenceValidationFormDialog
        defence={selectedDefence}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  );
}
