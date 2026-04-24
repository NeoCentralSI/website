import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { Pencil, Trash2, CalendarDays } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';

import type { Room } from '@/services/admin.service';
import type { GetRoomsParams } from '@/hooks/master-data/useRooms';

interface RoomTableProps {
  data: Room[];
  loading: boolean;
  isFetching: boolean;
  total: number;
  params: GetRoomsParams;
  onParamsChange: (p: GetRoomsParams) => void;
  onEdit: (room: Room) => void;
  onDelete: (room: Room) => void;
  onRefresh: () => void;
  actions?: ReactNode;
}

export function RoomTable({
  data,
  loading,
  isFetching,
  total,
  params,
  onParamsChange,
  onEdit,
  onDelete,
  onRefresh,
  actions,
}: RoomTableProps) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;

  const columns = useMemo<Column<Room>[]>(
    () => [
      {
        key: 'no',
        header: 'No',
        width: 50,
        className: 'text-center',
        render: (_row, index) => (
          <span className="text-sm text-muted-foreground">
            {(page - 1) * limit + index + 1}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Nama Ruangan',
        render: (row) => <span className="font-semibold">{row.name}</span>,
      },
      {
        key: 'location',
        header: 'Lokasi',
        render: (row) => row.location || '-',
      },
      {
        key: 'capacity',
        header: 'Kapasitas',
        className: 'text-center',
        render: (row) => row.capacity ?? '-',
      },
      {
        key: 'usage',
        header: 'Terpakai',
        filter: {
          type: 'select',
          value: params.status ?? 'all',
          onChange: (value: string) => {
            onParamsChange({ ...params, status: value as GetRoomsParams['status'], page: 1 });
          },
          options: [
            { label: 'Semua', value: 'all' },
            { label: 'Belum terpakai', value: 'available' },
            { label: 'Terpakai', value: 'in_use' },
          ],
        },
        render: (row) =>
          row.relationCount > 0 ? (
            <Badge variant="outline" className="gap-1">
              <CalendarDays className="h-3 w-3" />
              {row.relationCount}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        key: 'actions',
        header: 'Aksi',
        className: 'text-right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
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
              title={
                row.canDelete && row.relationCount === 0
                  ? 'Hapus ruangan'
                  : 'Ruangan tidak dapat dihapus karena sudah memiliki relasi'
              }
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ),
      },
    ],
    [limit, onDelete, onEdit, onParamsChange, page, params.status]
  );

  return (
    <CustomTable
      data={data}
      columns={columns}
      loading={loading}
      isRefreshing={isFetching && !loading}
      emptyText="Belum ada data ruangan"
      page={page}
      pageSize={limit}
      total={total}
      onPageChange={(p) => onParamsChange({ ...params, page: p })}
      onPageSizeChange={(s) => onParamsChange({ ...params, limit: s, page: 1 })}
      searchValue={params.search ?? ''}
      onSearchChange={(s) => onParamsChange({ ...params, search: s, page: 1 })}
      enableColumnFilters
      actions={
        <div className="flex items-center gap-2">
          {actions}
          <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !loading} />
        </div>
      }
    />
  );
}
