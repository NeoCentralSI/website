import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { SupervisorRequestStatusBadge } from '@/components/shared/SupervisorRequestStatusBadge';
import { TableStatusFilter } from '@/components/shared/TableStatusFilter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Switch } from '@/components/ui/switch';
import { useClientTable } from '@/hooks/shared/useClientTable';
import { useSetAcceptingRequests } from '@/hooks/thesis-proposal/useSupervisionQuota';
import {
  useLecturerSupervisorInbox,
  useMarkSupervisorRequestUnderReview,
} from '@/hooks/thesis-proposal/useSupervisorRequests';
import { DateTimeCell, STICKY_ACTION_COLUMN_CLASS, TruncatedText } from '@/lib/guidanceCells';
import { toTitleCaseName } from '@/lib/text';
import { getSupervisorRequestRouteLabel } from '@/lib/thesisLabels';
import type { SupervisorRequest } from '@/types/thesis-proposal.types';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';
import { SupervisorRequestResponseDialog, type SupervisorResponseState } from './SupervisorRequestResponseDialog';

type Scope = 'waiting' | 'history';

const SCOPE_OPTIONS: { value: Scope; label: string }[] = [
  { value: 'waiting', label: 'Menunggu' },
  { value: 'history', label: 'Riwayat' },
];

/** Fixed widths except "Judul Usulan", so the table fits 1366 px without a horizontal scroll. */
const TABLE_CLASS = 'table-fixed min-w-[880px]';

/** Supervision load and "Menerima pengajuan baru", shown in the page header (as on the old card). */
export function LecturerSupervisionLoadControls() {
  const { data } = useLecturerSupervisorInbox();
  const accepting = useSetAcceptingRequests();
  if (!data) return null;
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <span className="text-muted-foreground">Beban bimbingan</span>
      <SupervisionLoadBadge activeCount={data.load.activeCount} hardLimit={data.load.hardLimit} level={data.load.level} />
      <label className="flex items-center gap-2">
        <Switch
          checked={data.load.acceptingRequests}
          disabled={accepting.isPending}
          onCheckedChange={(checked) => accepting.mutate(checked)}
          aria-label="Menerima pengajuan baru"
        />
        <span className="text-muted-foreground">Menerima pengajuan baru</span>
      </label>
    </div>
  );
}

/**
 * Tugas Akhir > Permohonan (Paket E4, 4.1): students who chose this lecturer. Status filter
 * Menunggu (default) or Riwayat; Terima / Tolak (Terima dan Teruskan when the lecturer is
 * full) in the row, everything else in the Detail modal. Rules are those of the old card.
 */
export function LecturerSupervisorRequestTable() {
  const { data, isLoading, isFetching, refetch } = useLecturerSupervisorInbox();
  const markReview = useMarkSupervisorRequestUnderReview();
  const [scope, setScope] = useState<Scope>('waiting');
  const [detail, setDetail] = useState<SupervisorRequest | null>(null);
  const [response, setResponse] = useState<SupervisorResponseState>(null);

  const isFull = data?.load.level === 'full';
  const rows = useMemo(() => (scope === 'waiting' ? data?.waiting : data?.history) ?? [], [data, scope]);
  const table = useClientTable(rows, (row) => [row.student?.fullName, row.student?.identityNumber, row.proposedTitle]);
  const isWaiting = (request: SupervisorRequest) => (data?.waiting ?? []).some((row) => row.id === request.id);

  const columns: Column<SupervisorRequest>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 210,
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-medium" title={toTitleCaseName(row.student?.fullName)}>{toTitleCaseName(row.student?.fullName) || '-'}</p>
          <p className="text-xs text-muted-foreground">{row.student?.identityNumber ?? '-'}</p>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Judul Usulan',
      render: (row) => <TruncatedText text={row.proposedTitle} className="max-w-full" />,
    },
    {
      key: 'route',
      header: 'Jalur',
      width: 130,
      render: (row) => <Badge variant="outline" className="whitespace-normal text-left">{getSupervisorRequestRouteLabel(row.route)}</Badge>,
    },
    {
      key: 'createdAt',
      header: 'Tanggal Masuk',
      width: 140,
      render: (row) => <DateTimeCell date={row.createdAt} />,
    },
    {
      key: 'status',
      header: 'Status',
      width: 140,
      render: (row) => <SupervisorRequestStatusBadge status={row.status} className="whitespace-normal" />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: scope === 'waiting' ? 250 : 90,
      className: STICKY_ACTION_COLUMN_CLASS,
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {scope === 'waiting' && (
            <>
              <Button size="sm" variant="outline" onClick={() => setResponse({ request: row, action: 'reject' })}>Tolak</Button>
              <Button size="sm" onClick={() => setResponse({ request: row, action: 'accept' })}>{isFull ? 'Terima dan Teruskan' : 'Terima'}</Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="gap-1 px-2" onClick={() => setDetail(row)}>
            <Eye className="h-4 w-4" />
            Detail
          </Button>
        </div>
      ),
    },
  ];

  const detailIsWaiting = detail ? isWaiting(detail) : false;

  return (
    <>
      <CustomTable
        columns={columns}
        data={table.pageRows}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        tableClassName={TABLE_CLASS}
        total={table.total}
        page={table.page}
        pageSize={table.pageSize}
        onPageChange={table.setPage}
        onPageSizeChange={table.setPageSize}
        searchValue={table.search}
        onSearchChange={table.setSearch}
        searchPlaceholder="Cari nama, NIM, atau judul..."
        emptyText={scope === 'waiting' ? 'Tidak ada permohonan yang menunggu keputusan Anda.' : 'Belum ada riwayat permohonan.'}
        rowKey={(row) => row.id}
        actions={
          <div className="flex items-center gap-2">
            <TableStatusFilter
              value={scope}
              onChange={(value) => { setScope(value); table.resetPage(); }}
              options={SCOPE_OPTIONS}
              label="Filter status permohonan"
              className="w-32"
            />
            <RefreshButton onClick={() => void refetch()} isRefreshing={isFetching && !isLoading} />
          </div>
        }
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Permohonan Pembimbing"
        description={data ? `Semester ${data.academicYear.label}` : undefined}
        footer={detail && detailIsWaiting ? (
          <>
            {isFull && <p className="mr-auto text-xs text-muted-foreground">Anda sudah mencapai batas bimbingan; menerima berarti meneruskan ke Ketua Departemen.</p>}
            {detail.status === 'pending' && (
              <Button size="sm" variant="ghost" disabled={markReview.isPending} onClick={() => markReview.mutate(detail.id)}>Tandai Sedang Ditinjau</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setResponse({ request: detail, action: 'reject' })}>Tolak</Button>
            <Button size="sm" onClick={() => setResponse({ request: detail, action: 'accept' })}>{isFull ? 'Terima dan Teruskan' : 'Terima'}</Button>
          </>
        ) : undefined}
      >
        {detail && <SupervisorRequestDetails request={detail} showStudent />}
      </RecordDetailDialog>

      <SupervisorRequestResponseDialog
        state={response}
        isFull={!!isFull}
        onClose={() => setResponse(null)}
        onDone={() => setDetail(null)}
      />
    </>
  );
}
