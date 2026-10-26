import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { RefreshButton } from '@/components/ui/refresh-button';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SEARCH_DEBOUNCE_MS, useDebounce } from '@/hooks/useDebounce';
import { useRole } from '@/hooks/shared/useRole';
import { getAdminAuditLogsAPI, type AdminAuditLog } from '@/services/admin.service';
import { formatDateTimeWib, toTitleCaseName } from '@/lib/text';
import { CLIP_CELL } from '@/lib/tableColumnWidths';
import {
  ACTIVITY_ACTION_OPTIONS,
  ACTIVITY_ENTITY_OPTIONS,
  describeActivityChanges,
  getActivityActionLabel,
  getActivityObjectType,
} from '@/lib/activityLogLabels';

const ALL_OPTION = { label: 'Semua', value: '' };

/** A day of the date picker as `YYYY-MM-DD` (the server reads it as an Asia/Jakarta day). */
function toDay(date: Date | undefined) {
  if (!date) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const actorName = (log: AdminAuditLog) => (log.actor ? toTitleCaseName(log.actor.fullName) || log.actor.email || '-' : 'Sistem');

/**
 * Log Aktivitas: account and master data changes, and the decisions of the Ketua Departemen.
 * Admin reads it under Master Data; the Ketua and Sekretaris Departemen read the same page.
 */
export default function ActivityLogPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim(), SEARCH_DEBOUNCE_MS);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [detail, setDetail] = useState<AdminAuditLog | null>(null);

  const { isAdmin } = useRole();
  const admin = isAdmin();
  const breadcrumbs = useMemo(
    () => (admin ? [{ label: 'Master Data' }, { label: 'Log Aktivitas' }] : [{ label: 'Log Aktivitas' }]),
    [admin],
  );
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Log Aktivitas');
  }, [breadcrumbs, setBreadcrumbs, setTitle]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, action, entity, dateFrom, dateTo]);

  const params = { page, pageSize, action, entity, search: debouncedSearch, dateFrom: toDay(dateFrom), dateTo: toDay(dateTo) };
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => getAdminAuditLogsAPI(params),
    placeholderData: (previous) => previous,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (error) toast.error((error as Error).message || 'Gagal memuat log aktivitas');
  }, [error]);

  const logs = data?.logs ?? [];
  const total = data?.meta?.total ?? 0;
  const hasFilters = !!(debouncedSearch || action || entity || dateFrom || dateTo);

  const columns: Column<AdminAuditLog>[] = [
    {
      key: 'createdAt',
      header: 'Waktu',
      width: 200,
      className: CLIP_CELL,
      render: (log) => <span className="whitespace-nowrap text-sm">{formatDateTimeWib(log.createdAt)}</span>,
    },
    {
      key: 'actor',
      header: 'Pelaku',
      width: 220,
      className: CLIP_CELL,
      render: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium" title={actorName(log)}>{actorName(log)}</p>
          {log.actor?.identityNumber && <p className="text-xs text-muted-foreground">{log.actor.identityNumber}</p>}
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Tindakan',
      width: 240,
      className: CLIP_CELL,
      filter: { type: 'select', value: action, onChange: setAction, options: [ALL_OPTION, ...ACTIVITY_ACTION_OPTIONS] },
      render: (log) => <span className="line-clamp-2 whitespace-normal text-sm">{getActivityActionLabel(log.action)}</span>,
    },
    {
      key: 'entity',
      header: 'Objek',
      className: CLIP_CELL,
      filter: { type: 'select', value: entity, onChange: setEntity, options: [ALL_OPTION, ...ACTIVITY_ENTITY_OPTIONS] },
      render: (log) => (
        <div className="min-w-0">
          <p className="truncate text-sm" title={log.objectLabel ?? undefined}>{log.objectLabel || '-'}</p>
          <p className="truncate text-xs text-muted-foreground">{getActivityObjectType(log.entity, log.changes)}</p>
        </div>
      ),
    },
    {
      key: 'detail',
      header: 'Aksi',
      width: 72,
      className: 'text-center',
      render: (log) => <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(log)} />,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Log Aktivitas</h1>
        <p className="text-muted-foreground">Perubahan data dan keputusan penting</p>
      </div>

      <CustomTable<AdminAuditLog>
        columns={columns}
        data={logs}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari pelaku atau objek..."
        enableColumnFilters
        tableClassName="table-fixed min-w-[900px]"
        actions={
          <>
            <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Dari tanggal" showPastDates className="w-40" />
            <DatePicker value={dateTo} onChange={setDateTo} placeholder="Sampai tanggal" showPastDates minDate={dateFrom} className="w-40" />
            <RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />
          </>
        }
        emptyText={hasFilters ? 'Tidak ada aktivitas yang cocok dengan pencarian atau filter.' : 'Belum ada aktivitas tercatat.'}
        rowKey={(log) => log.id}
      />

      <ActivityDetailDialog log={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

function ActivityDetailDialog({ log, onClose }: { log: AdminAuditLog | null; onClose: () => void }) {
  const described = log ? describeActivityChanges(log.changes) : null;
  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>{log ? getActivityActionLabel(log.action) : 'Detail Aktivitas'}</DialogTitle>
        </DialogHeader>
        {log && described && (
          <div className="space-y-4 text-sm">
            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">Waktu</dt>
              <dd>{formatDateTimeWib(log.createdAt)}</dd>
              <dt className="text-muted-foreground">Pelaku</dt>
              <dd>{actorName(log)}</dd>
              <dt className="text-muted-foreground">Objek</dt>
              <dd className="[overflow-wrap:anywhere]">
                {log.objectLabel || '-'} <span className="text-muted-foreground">({getActivityObjectType(log.entity, log.changes)})</span>
              </dd>
            </dl>

            {described.fields.length > 0 ? (
              <div className="overflow-hidden rounded-md border">
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="w-1/3 px-3 py-2 font-medium">Data</th>
                      {described.hasBefore && <th className="px-3 py-2 font-medium">Sebelum</th>}
                      <th className="px-3 py-2 font-medium">{described.hasBefore ? 'Sesudah' : 'Nilai'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {described.fields.map((row) => (
                      <tr key={row.label} className="border-t align-top">
                        <td className="px-3 py-2 text-muted-foreground">{row.label}</td>
                        {described.hasBefore && <td className="px-3 py-2 [overflow-wrap:anywhere]">{row.before}</td>}
                        <td className="px-3 py-2 [overflow-wrap:anywhere]">{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground">Tidak ada rincian perubahan.</p>
            )}

            {described.notes.length > 0 && (
              <dl className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-1">
                {described.notes.map((note) => (
                  <div key={note.label} className="contents">
                    <dt className="text-muted-foreground">{note.label}</dt>
                    <dd>{note.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
