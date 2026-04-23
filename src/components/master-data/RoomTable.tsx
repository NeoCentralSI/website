import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pencil, Trash2, CalendarDays } from 'lucide-react';

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
      key: 'usage',
      header: 'Terpakai',
      render: (row: Room) => (
        row.relationCount > 0
          ? (
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="h-3 w-3" />
              {row.relationCount}
            </Badge>
          )
          : <span className="text-muted-foreground">-</span>
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
            disabled={!row.canDelete || row.relationCount > 0}
            title={row.canDelete && row.relationCount === 0 ? 'Hapus ruangan' : 'Ruangan tidak dapat dihapus karena sudah memiliki relasi'}
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
