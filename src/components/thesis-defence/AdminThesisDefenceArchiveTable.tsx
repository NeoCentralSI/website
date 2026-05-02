import { useMemo } from 'react';
import { Pencil, Trash2, Eye } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { ThesisEventStatusBadge } from '@/components/shared/ThesisEventStatusBadge';
import { CustomTable } from '@/components/layout/CustomTable';
import type { AdminDefenceArchiveItem } from '@/types/defence.types';
import {
  ThesisEventTitleCell,
  ThesisPersonnelListCell
} from '@/components/shared/ThesisTableCells';

interface AdminThesisDefenceArchiveTableProps {
  data: AdminDefenceArchiveItem[];
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
  onEdit: (row: AdminDefenceArchiveItem) => void;
  onDelete: (id: string) => void;
  actions?: ReactNode;
}

export function AdminThesisDefenceArchiveTable({
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
}: AdminThesisDefenceArchiveTableProps) {
  const columns = useMemo(
    () => [
      {
        key: 'thesis_student',
        header: 'Mahasiswa',
        width: 300,
        render: (row: AdminDefenceArchiveItem) => (
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
        render: (row: AdminDefenceArchiveItem) => (
          <div className="text-sm">
            {row.date ? new Date(row.date).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) : '-'}
          </div>
        ),
      },
      {
        key: 'room',
        header: 'Ruangan',
        width: 180,
        render: (row: AdminDefenceArchiveItem) => (
          <div className="text-sm max-w-[20ch] whitespace-normal leading-tight">
            {row.room?.name || '-'}
          </div>
        ),
      },
      {
        key: 'examiners',
        header: 'Penguji',
        width: 250,
        render: (row: AdminDefenceArchiveItem) => (
          <ThesisPersonnelListCell people={row.examiners.map(e => ({ ...e, name: e.lecturerName }))} />
        ),
      },
      {
        key: 'score',
        header: 'Nilai',
        width: 100,
        render: (row: AdminDefenceArchiveItem) => (
          <div className="font-medium text-sm">
            {row.finalScore !== null && row.finalScore !== undefined 
              ? Math.round((Number(row.finalScore) + Number.EPSILON) * 100) / 100 
              : '-'}
          </div>
        ),
      },
      {
        key: 'grade',
        header: 'Grade',
        width: 80,
        render: (row: AdminDefenceArchiveItem) => (
          <div className="font-bold text-sm">
            {row.grade || '-'}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        width: 180,
        render: (row: AdminDefenceArchiveItem) => (
          <ThesisEventStatusBadge
            status={row.status as any}
          />
        ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        width: 150,
        className: 'text-center',
        render: (row: AdminDefenceArchiveItem) => (
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit(row)}
              disabled={row.isEditable === false}
              title={row.isEditable === false ? 'Sidang dari workflow utama tidak dapat diubah di sini' : 'Edit Arsip'}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onDelete(row.id)}
              disabled={row.isEditable === false}
              title={row.isEditable === false ? 'Sidang dari workflow utama tidak dapat dihapus di sini' : 'Hapus Arsip'}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onDetail, onEdit]
  );

  return (
    <CustomTable<AdminDefenceArchiveItem>
      data={data}
      columns={columns}
      loading={loading}
      isRefreshing={isRefreshing}
      emptyText="Tidak ada data arsip sidang"
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
