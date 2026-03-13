import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomTable from '@/components/layout/CustomTable';

import type { Room } from '@/services/admin.service';

interface RoomTableProps {
  data: Room[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  searchValue: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchChange: (search: string) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  actions?: ReactNode;
}

export function RoomTable({
  data,
  loading,
  page,
  pageSize,
  total,
  searchValue,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onEdit,
  onDelete,
  actions,
}: RoomTableProps) {
  const columns = useMemo(() => [
    {
      key: 'name',
      header: 'Nama Ruangan',
      render: (row: Room) => (
        <span className="font-semibold">{row.name}</span>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      render: (row: Room) => row.location || '-',
    },
    {
      key: 'capacity',
      header: 'Kapasitas',
      className: 'text-center',
      render: (row: Room) => row.capacity ?? '-',
    },
    {
      key: 'status',
      header: 'Status Hapus',
      render: (row: Room) => (
        <Badge variant={row.canDelete ? 'default' : 'secondary'}>
          {row.canDelete ? 'Bisa Dihapus' : 'Terpakai'}
        </Badge>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Diperbarui',
      render: (row: Room) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.updatedAt), 'd MMM yyyy', { locale: idLocale })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: Room) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-black"
            onClick={() => onEdit(row)}
            title="Edit ruangan"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onDelete(row)}
            disabled={!row.canDelete}
            title={row.canDelete ? 'Hapus ruangan' : 'Ruangan tidak dapat dihapus karena sudah memiliki relasi'}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ], [onDelete, onEdit]);

  return (
    <CustomTable
      data={data}
      columns={columns as any}
      loading={loading}
      emptyText="Belum ada data ruangan"
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
