import { useMemo } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import CustomTable from '@/components/layout/CustomTable';
import type { SeminarResultAudienceLink } from '@/services/thesis-seminar/admin-seminar.service';

interface ThesisSeminarAudienceTableProps {
  data: SeminarResultAudienceLink[];
  loading: boolean;
  isRefreshing?: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (search: string) => void;
  onDelete: (link: { seminarId: string; studentId: string }) => void;
  actions?: ReactNode;
}

export function ThesisSeminarAudienceTable({
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
  onDelete,
  actions,
}: ThesisSeminarAudienceTableProps) {
  const columns = useMemo(() => [
    {
      key: 'student',
      header: 'Mahasiswa Audience',
      render: (row: SeminarResultAudienceLink) => (
        <div>
          <div className="font-medium">{row.student.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.student.nim}</div>
        </div>
      ),
    },
    {
      key: 'seminar',
      header: 'Seminar Hasil',
      render: (row: SeminarResultAudienceLink) => (
        <div className="max-w-[360px]">
          <div className="font-medium truncate">{row.seminar.thesisTitle}</div>
          <div className="text-xs text-muted-foreground truncate">Pemilik: {row.seminar.ownerName} ({row.seminar.ownerNim})</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal Seminar',
      render: (row: SeminarResultAudienceLink) => row.seminar.date ? format(new Date(row.seminar.date), 'd MMM yyyy', { locale: idLocale }) : '-',
    },
    {
      key: 'linkedAt',
      header: 'Dikaitkan',
      render: (row: SeminarResultAudienceLink) => format(new Date(row.createdAt), 'd MMM yyyy', { locale: idLocale }),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: SeminarResultAudienceLink) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete({ seminarId: row.seminarId, studentId: row.studentId })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ], [onDelete]);

  return (
    <CustomTable
      data={data}
      columns={columns as any}
      loading={loading}
      isRefreshing={isRefreshing}
      emptyText="Belum ada relasi audience seminar"
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
