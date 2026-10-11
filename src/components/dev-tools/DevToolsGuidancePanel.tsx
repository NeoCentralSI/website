import { useEffect, useMemo, useState } from 'react';
import { CalendarClock } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/thesis/StatusBadge';
import { useDevToolsGuidances, useDevToolsMutations } from '@/hooks/dev-tools/useDevTools';
import { formatDateTimeWib } from '@/lib/text';
import { GUIDANCE_STATUS_LABELS } from '@/lib/thesisLabels';
import type { DevToolsGuidance } from '@/types/devTools.types';
import { DevToolsGuidanceScheduleDialog } from './DevToolsGuidanceScheduleDialog';
import { TruncatedText } from './DevToolsShared';

/** One option per label: legacy `rescheduled` shares the label of `accepted`. */
const STATUS_OPTIONS = [
  { label: 'Semua Status', value: '' },
  ...Object.entries(GUIDANCE_STATUS_LABELS)
    .filter(([value]) => value !== 'rescheduled')
    .map(([value, label]) => ({ label, value })),
];

export function DevToolsGuidancePanel() {
  const mutations = useDevToolsMutations();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<DevToolsGuidance | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading, isFetching } = useDevToolsGuidances({ search: debouncedSearch, status, page, pageSize });

  const columns = useMemo<Column<DevToolsGuidance>[]>(() => [
    {
      key: 'student',
      header: 'Mahasiswa',
      render: (row) => (
        <div className="max-w-[190px]">
          <TruncatedText text={row.studentName} className="font-medium text-sm" />
          <div className="text-xs text-muted-foreground">{row.studentNim ?? '-'}</div>
        </div>
      ),
    },
    {
      key: 'supervisor',
      header: 'Pembimbing',
      render: (row) => <div className="max-w-[170px] text-sm"><TruncatedText text={row.supervisorName} /></div>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
      filter: {
        type: 'select',
        value: status,
        defaultValue: '',
        options: STATUS_OPTIONS,
        onChange: (value) => { setStatus(value); setPage(1); },
      },
    },
    { key: 'requestedDate', header: 'Diusulkan', className: 'text-xs', render: (row) => formatDateTimeWib(row.requestedDate) },
    { key: 'approvedDate', header: 'Disetujui', className: 'text-xs', render: (row) => formatDateTimeWib(row.approvedDate) },
    { key: 'summarySubmittedAt', header: 'Ringkasan Dikirim', className: 'text-xs', render: (row) => formatDateTimeWib(row.summarySubmittedAt) },
    { key: 'completedAt', header: 'Selesai', className: 'text-xs', render: (row) => formatDateTimeWib(row.completedAt) },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <Button variant="outline" size="sm" className="h-8" onClick={() => setEditing(row)}>
          <CalendarClock className="h-3.5 w-3.5 mr-1.5" />Ubah Jadwal
        </Button>
      ),
    },
  ], [status]);

  return (
    <>
      <CustomTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        enableColumnFilters
        emptyText="Tidak ada sesi bimbingan ditemukan."
      />
      <DevToolsGuidanceScheduleDialog
        guidance={editing}
        open={!!editing}
        onOpenChange={(o) => { if (!o) setEditing(null); }}
        onSave={mutations.updateGuidanceSchedule}
        isSubmitting={mutations.isSubmitting}
      />
    </>
  );
}
