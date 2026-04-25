import { useMemo } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Pencil, Trash2, Eye, Users } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import CustomTable from '@/components/layout/CustomTable';
import type { SeminarResult } from '@/services/thesis-seminar/admin.service';

interface ThesisSeminarArchiveTableProps {
  data: SeminarResult[];
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
  onEdit: (row: SeminarResult) => void;
  onDelete: (id: string) => void;
  actions?: ReactNode;
}

export function ThesisSeminarArchiveTable({
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
}: ThesisSeminarArchiveTableProps) {
  const columns = useMemo(() => [
    {
      key: 'thesis',
      header: 'Judul TA',
      width: 250,
      render: (row: SeminarResult) => (
        <div className="max-w-[250px]">
          <div className="font-medium truncate">{row.thesisTitle}</div>
          <div className="text-xs text-muted-foreground truncate">{row.student.fullName} ({row.student.nim})</div>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal',
      render: (row: SeminarResult) => row.date ? format(new Date(row.date), 'd MMM yyyy', { locale: idLocale }) : '-',
    },
    {
      key: 'room',
      header: 'Ruangan',
      width: 200,
      render: (row: SeminarResult) => row.room ? row.room.name : '-',
    },
    {
      key: 'status',
      header: 'Status',
      width: 180,
      render: (row: SeminarResult) => <SeminarStatusBadge status={row.status as any} />,
    },
    {
      key: 'examiners',
      header: 'Penguji',
      width: 320,
      render: (row: SeminarResult) => (
        row.examiners.length === 0
          ? '-'
          : (
            <div className="max-w-[320px] space-y-1 text-sm leading-snug">
              {row.examiners.slice(0, 2).map((e) => (
                <div key={e.id} className="truncate" title={`${e.order}. ${e.lecturerName}`}>
                  {e.order}. {e.lecturerName}
                </div>
              ))}
              {row.examiners.length > 2 && (
                <div
                  className="text-xs text-muted-foreground"
                  title={row.examiners.slice(2).map((e) => `${e.order}. ${e.lecturerName}`).join(', ')}
                >
                  +{row.examiners.length - 2} penguji lainnya
                </div>
              )}
            </div>
          )
      ),
    },
    {
      key: 'audiences',
      header: 'Audience',
      className: 'text-center',
      render: (row: SeminarResult) => (
        row.audienceCount > 0
          ? (
            <Badge variant="outline" className="gap-1">
              <Users className="h-3 w-3" />
              {row.audienceCount}
            </Badge>
          )
          : <span className="text-muted-foreground">-</span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: SeminarResult) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-black" onClick={() => onDetail(row.id)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-black"
            onClick={() => onEdit(row)}
            disabled={!row.isEditable}
            title={!row.isEditable ? "Seminar dari workflow utama tidak dapat diubah di sini" : ""}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(row.id)}
            disabled={!row.isEditable}
            title={!row.isEditable ? "Seminar dari workflow utama tidak dapat dihapus di sini" : ""}
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
      emptyText="Belum ada data seminar hasil"
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
