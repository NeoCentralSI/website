import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useAdminYudisiumEvents } from '@/hooks/yudisium/useAdminYudisium';
import type { AdminYudisiumEvent } from '@/types/adminYudisium.types';
import { formatDateOnlyId } from '@/lib/text';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
  in_review: { label: 'Dalam Review', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
  finalized: { label: 'Selesai', className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
};

export default function AdminYudisium() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const { data: events = [], isLoading, isFetching } = useAdminYudisiumEvents();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setBreadcrumbs([{ label: 'Yudisium Admin' }]);
    setTitle('Validasi Yudisium');
  }, [setBreadcrumbs, setTitle]);

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

  const columns: Column<AdminYudisiumEvent>[] = [
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
          onClick={() => navigate(`/yudisium/admin/${row.id}`)}
          title="Detail"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validasi Yudisium</h1>
        <p className="text-muted-foreground">
          Kelola validasi dokumen dan peserta yudisium
        </p>
      </div>

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
