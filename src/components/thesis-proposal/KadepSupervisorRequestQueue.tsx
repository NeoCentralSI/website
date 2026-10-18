import { useMemo, useState } from 'react';
import { ArrowRightLeft, Check, Eye, UserCheck, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useKadepSupervisorQueue } from '@/hooks/thesis-proposal/useSupervisorRequests';
import { TruncatedText } from '@/lib/guidanceCells';
import { ACTIONS_3_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL } from '@/lib/tableColumnWidths';
import { formatLecturerName, toTitleCaseName } from '@/lib/text';
import {
  getSupervisorRequestStatusLabel,
  getSupervisorRequestStatusVariant,
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS,
  type SupervisorRequestStatus,
} from '@/lib/thesisLabels';
import type { KadepQueue } from '@/types/thesis-proposal.types';
import { KadepSupervisorRequestDecisionDialog, type KadepAction } from './KadepSupervisorRequestDecisionDialog';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

type Row = KadepQueue['overQuota'][number] & { awaiting: boolean };

/** "Menunggu Keputusan Anda" in the Status column (measured with Evaluasi and Perubahan). */
const AWAITING = 'awaiting';
const AWAITING_LABEL = 'Menunggu Keputusan Anda';

/** Fixed columns 726 px; the title narrows. */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

function loadNote(row: Row): string | null {
  const load = row.lecturerLoad;
  if (!load) return null;
  return `Beban ${formatLecturerName(row.lecturer?.fullName)} sekarang ${load.activeCount}/${load.hardLimit}; bila disetujui ${load.projectedCount}/${load.hardLimit} (lebih ${load.overBy}).`;
}

/**
 * Paket P8: the Ketua Departemen's queue of one route in one table, the requests that wait for a
 * decision and the decided ones together. "Semua" by default with "Menunggu Keputusan Anda"
 * first; Status is filtered in its column header. "Pengajuan Lewat Departemen": Tetapkan
 * Pembimbing, Minta Revisi, Tolak. "Pengajuan di Atas Kuota": Setujui or Alihkan (cannot be
 * rejected, R12). The row actions are icons; Minta Revisi is in the detail modal.
 */
export function KadepSupervisorRequestQueue({ route }: { route: 'department' | 'over_quota' }) {
  const queue = useKadepSupervisorQueue();
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState<Row | null>(null);
  const [dialog, setDialog] = useState<{ request: Row; action: KadepAction } | null>(null);
  const isDepartment = route === 'department';

  const allRows = useMemo<Row[]>(() => {
    const data = queue.data;
    if (!data) return [];
    const waiting: Row[] = isDepartment
      ? data.department.map((request) => ({ ...request, lecturerLoad: null, awaiting: true }))
      : data.overQuota.map((request) => ({ ...request, awaiting: true }));
    const decided: Row[] = data.history
      .filter((request) => request.route === route)
      .map((request) => ({ ...request, lecturerLoad: null, awaiting: false }));
    return [...waiting, ...decided];
  }, [queue.data, isDepartment, route]);

  const statusOptions = useMemo(() => {
    const seen = [...new Set(allRows.filter((row) => !row.awaiting).map((row) => row.status))];
    return [
      { label: 'Semua', value: '' },
      { label: AWAITING_LABEL, value: AWAITING },
      ...seen.map((value) => ({ label: SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[value as SupervisorRequestStatus] ?? value, value })),
    ];
  }, [allRows]);

  const rows = useMemo(
    () => allRows.filter((row) => !status || (status === AWAITING ? row.awaiting : !row.awaiting && row.status === status)),
    [allRows, status],
  );
  const table = useLocalTable(rows, (row, term) => haystack(row.student?.fullName, row.student?.identityNumber, row.proposedTitle).includes(term));

  const open = (row: Row, action: KadepAction) => setDialog({ request: row, action });

  const columns: Column<Row>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 190,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell name={row.student?.fullName ?? ''} nim={row.student?.identityNumber ?? ''} />,
    },
    { key: 'title', header: 'Judul', className: CLIP_CELL, render: (row) => <TruncatedText text={row.proposedTitle} className="max-w-full" /> },
    {
      key: 'lecturer',
      header: isDepartment ? 'Dosen Ditetapkan' : 'Dosen Pilihan',
      width: 200,
      className: CLIP_CELL,
      render: (row) => {
        const name = row.supervisor?.fullName ?? row.lecturer?.fullName ?? null;
        return (
          <div className="min-w-0 space-y-1">
            <p className="truncate text-sm" title={name ? formatLecturerName(name) : undefined}>{name ? formatLecturerName(name) : <span className="text-muted-foreground">Belum dipilih</span>}</p>
            {row.lecturerLoad && <SupervisionLoadBadge activeCount={row.lecturerLoad.activeCount} hardLimit={row.lecturerLoad.hardLimit} level={row.lecturerLoad.level} className="whitespace-nowrap" />}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.decisionStatus,
      className: CLIP_CELL,
      render: (row) => row.awaiting ? (
        <Badge variant="warning" className="whitespace-nowrap">{AWAITING_LABEL}</Badge>
      ) : (
        <Badge variant={getSupervisorRequestStatusVariant(row.status)} className="whitespace-nowrap" title={getSupervisorRequestStatusLabel(row.status)}>
          {SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[row.status] ?? row.status}
        </Badge>
      ),
      filter: { type: 'select', value: status, onChange: (value) => { setStatus(value); table.resetPage(); }, options: statusOptions },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: ACTIONS_3_WIDTH,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
          {row.awaiting && isDepartment && (
            <>
              <TableIconAction icon={UserCheck} label="Tetapkan Pembimbing" tone="approve" onClick={() => open(row, 'approve')} />
              <TableIconAction icon={X} label="Tolak" onClick={() => open(row, 'reject')} />
            </>
          )}
          {row.awaiting && !isDepartment && (
            <>
              <TableIconAction icon={Check} label="Setujui" tone="approve" onClick={() => open(row, 'approve')} />
              <TableIconAction icon={ArrowRightLeft} label="Alihkan ke Dosen Lain" onClick={() => open(row, 'redirect')} />
            </>
          )}
        </div>
      ),
    },
  ];

  if (queue.error) return <p className="text-sm text-destructive">{queue.error instanceof Error ? queue.error.message : 'Gagal memuat antrean.'}</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {isDepartment
          ? 'Mahasiswa yang meminta departemen menetapkan pembimbing. Tetapkan dosen, minta revisi isian, atau tolak.'
          : 'Dosen bersedia membimbing walaupun sudah mencapai batas bimbingan. Setujui dosen tersebut atau alihkan ke dosen lain; pengajuan ini tidak dapat ditolak.'}
      </p>
      <CustomTable
        columns={columns}
        {...table.tableProps}
        loading={queue.isLoading}
        isRefreshing={queue.isFetching && !queue.isLoading}
        subtleRefresh
        enableColumnFilters
        tableClassName={TABLE_CLASS}
        searchPlaceholder="Cari nama, NIM, atau judul..."
        emptyText={table.search || status ? 'Tidak ditemukan' : 'Belum ada pengajuan pada jalur ini.'}
        rowKey={(row) => row.id}
        actions={<RefreshButton onClick={() => void queue.refetch()} isRefreshing={queue.isFetching && !queue.isLoading} />}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(value) => { if (!value) setDetail(null); }}
        title="Detail Pengajuan Pembimbing"
        description={detail ? `${toTitleCaseName(detail.student?.fullName) || '-'} · ${detail.student?.identityNumber ?? '-'}` : undefined}
        footer={detail ? (
          detail.awaiting ? (
            <DetailDialogActions onClose={() => setDetail(null)} note={loadNote(detail) ?? undefined}>
              {isDepartment ? (
                <>
                  <Button size="sm" variant="destructive" onClick={() => open(detail, 'reject')}>Tolak</Button>
                  <Button size="sm" variant="outline" onClick={() => open(detail, 'request_revision')}>Minta Revisi</Button>
                  <Button size="sm" onClick={() => open(detail, 'approve')}>Tetapkan Pembimbing</Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => open(detail, 'redirect')}>Alihkan</Button>
                  <Button size="sm" onClick={() => open(detail, 'approve')}>Setujui</Button>
                </>
              )}
            </DetailDialogActions>
          ) : (
            <DetailDialogActions onClose={() => setDetail(null)} />
          )
        ) : undefined}
      >
        {detail && <SupervisorRequestDetails request={detail} showStudent />}
      </RecordDetailDialog>

      {dialog && (
        <KadepSupervisorRequestDecisionDialog
          request={dialog.request}
          action={dialog.action}
          onClose={() => setDialog(null)}
          onDone={() => setDetail(null)}
        />
      )}
    </div>
  );
}
