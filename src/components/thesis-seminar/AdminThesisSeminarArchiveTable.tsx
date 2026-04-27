import { useMemo } from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import CustomTable from '@/components/layout/CustomTable';
import { ThesisEventTitleCell, ThesisPersonnelListCell } from '@/components/shared/ThesisTableCells';

import { ThesisSeminarDateCell, ThesisSeminarRoomCell } from '@/components/thesis-seminar/atoms/ThesisSeminarScheduleCell';
import { ThesisSeminarAudienceCell } from '@/components/thesis-seminar/atoms/ThesisSeminarPersonnelCells';
import type { AdminThesisSeminarArchiveItem } from '@/services/thesis-seminar/core.service';

interface AdminThesisSeminarArchiveTableProps {
  data: AdminThesisSeminarArchiveItem[];
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
  onEdit: (row: AdminThesisSeminarArchiveItem) => void;
  onDelete: (id: string) => void;
  actions?: ReactNode;
}

export function AdminThesisSeminarArchiveTable({
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
  onEdit,
  onDelete,
  actions,
}: AdminThesisSeminarArchiveTableProps) {
  const columns = useMemo(() => [
    {
      key: 'thesis_student',
      header: 'Mahasiswa',
      width: 280,
      render: (row: AdminThesisSeminarArchiveItem) => (

        <ThesisEventTitleCell
          title={row.thesisTitle}
          studentName={row.student.fullName}
          studentNim={row.student.nim}
        />
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      width: 130,
      render: (row: AdminThesisSeminarArchiveItem) => <ThesisSeminarDateCell date={row.date} />,
    },
    {
      key: 'room',
      header: 'Ruangan',
      width: 180,
      render: (row: AdminThesisSeminarArchiveItem) => <ThesisSeminarRoomCell room={row.room} />,
    },
    {
      key: 'examiners',
      header: 'Penguji',
      width: 280,
      render: (row: AdminThesisSeminarArchiveItem) => (
        <ThesisPersonnelListCell people={row.examiners.map(e => ({ ...e, name: e.lecturerName }))} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 180,
      render: (row: AdminThesisSeminarArchiveItem) => (
        <ThesisEventStatusBadge status={row.status as any} />
      ),
    },
    {
      key: 'audiences',
      header: 'Audience',
      width: 100,
      className: 'text-center',
      render: (row: AdminThesisSeminarArchiveItem) => (
        <ThesisSeminarAudienceCell count={row.audienceCount} />
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: AdminThesisSeminarArchiveItem) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDetail(row.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(row)}
            disabled={!row.isEditable}
            title={!row.isEditable ? 'Seminar dari workflow utama tidak dapat diubah di sini' : ''}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(row.id)}
            disabled={!row.isEditable}
            title={!row.isEditable ? 'Seminar dari workflow utama tidak dapat dihapus di sini' : ''}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [onDetail, onEdit, onDelete]);

  return (
    <CustomTable
      data={data}
      columns={columns as any}
      loading={loading}
      isRefreshing={isRefreshing}
      emptyText="Belum ada data seminar hasil di arsip"
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
