import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';
import { useYudisiumEvents } from '@/hooks/yudisium/useYudisium';
import type { YudisiumEvent } from '@/services/yudisium/yudisium.service';
import { formatDateOnlyId } from '@/lib/text';
import { useRole } from '@/hooks/shared/useRole';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'Dalam Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  finalized: { label: 'Selesai', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

export function YudisiumPanel() {
  const navigate = useNavigate();
  const { isAdmin, isKoordinatorYudisium } = useRole();
  const { data: events = [], isLoading, isFetching } = useYudisiumEvents();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canCreate = isAdmin() || isKoordinatorYudisium();

  const filteredData = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const term = search.toLowerCase();
    if (!term) return sorted;
    return sorted.filter((e) =>
      (e.name ?? '').toLowerCase().includes(term) ||
      (STATUS_MAP[e.status]?.label ?? e.status).toLowerCase().includes(term)
    );
  }, [events, search]);

  const paginated = filteredData.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<YudisiumEvent>[] = [
    {
      key: 'name',
      header: 'Nama Periode',
      accessor: 'name',
    },
    {
      key: 'registrationDate',
      header: 'Pendaftaran',
      render: (row) =>
        `${formatDateOnlyId(row.registrationOpenDate)} - ${formatDateOnlyId(row.registrationCloseDate)}`,
    },
    {
      key: 'eventDate',
      header: 'Tanggal Yudisium',
      render: (row) => formatDateOnlyId(row.eventDate),
    },
    {
      key: 'participantCount',
      header: 'Peserta',
      accessor: 'participantCount',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = STATUS_MAP[row.status] || STATUS_MAP.draft;
        return (
          <Badge variant="outline" className={s.className}>
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/yudisium/${row.id}`)}
          title="Detail"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {canCreate && (
        <div className="flex justify-end">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Periode
          </Button>
        </div>
      )}
      <CustomTable
        columns={columns}
        data={paginated}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={filteredData.length}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        emptyText="Belum ada periode yudisium"
      />
    </div>
  );
}
