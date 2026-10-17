import { useState } from 'react';
import { Check, Eye, Users, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import {
  useChangeRequestInbox,
  useKadepBatchDecision,
  useKadepDecision,
} from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { DateTimeCell } from '@/lib/guidanceCells';
import { ACTIONS_3_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatLecturerName, toTitleCaseName } from '@/lib/text';
import {
  CHANGE_REQUEST_TRANSFER_LABEL,
  CHANGE_REQUEST_TYPE_LABELS,
  CHANGE_REQUEST_VIEW_STATUS_LABELS,
  getChangeRequestStepLabel,
  type ChangeRequestViewStatus,
} from '@/lib/thesisLabels';
import type { ChangeRequestKindFilter, ThesisChangeRequest, ThesisChangeRequestRow } from '@/types/thesis-change-request.types';
import { ThesisChangeRequestDecisionDialog, type ChangeDecisionDialogState } from './ThesisChangeRequestDecisionDialog';
import {
  SupervisorLoadNote,
  ThesisChangeRequestMeta,
  ThesisChangeRequestStatusBadge,
  ThesisChangeRequestSteps,
  ThesisChangeRequestSummary,
  ThesisChangeRequestTypeBadge,
  ThesisChangeRequestRowStatus,
} from './ThesisChangeRequestParts';
import { summarizeChange } from './thesisChangeRequestGroups';

/** A batch of "Alihkan Mahasiswa" is one lecturer's students: one page holds it. */
const BATCH_PAGE_SIZE = 100;

/** Status filter in the order of `CHANGE_REQUEST_STATUS_PRIORITY` (backend). */
const STATUS_OPTIONS: { label: string; value: ChangeRequestViewStatus | '' }[] = [
  { label: 'Semua', value: '' },
  ...(['awaiting_decision', 'in_progress', 'approved', 'rejected', 'cancelled'] as const).map((value) => ({
    label: CHANGE_REQUEST_VIEW_STATUS_LABELS[value],
    value,
  })),
];

const KIND_OPTIONS: { label: string; value: ChangeRequestKindFilter | '' }[] = [
  { label: 'Semua', value: '' },
  { label: CHANGE_REQUEST_TYPE_LABELS.title, value: 'title' },
  { label: CHANGE_REQUEST_TYPE_LABELS.supervisor, value: 'supervisor' },
  { label: CHANGE_REQUEST_TYPE_LABELS.both, value: 'both' },
  { label: CHANGE_REQUEST_TRANSFER_LABEL, value: 'transfer' },
];

/**
 * Fixed widths except "Mahasiswa dan Perubahan" (Paket E6, 1): the badge and date columns fit
 * their longest text and the free-text column narrows instead; below 1000 px the table scrolls.
 */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

const lecturerStepsDone = (request: ThesisChangeRequest) => request.currentStep === 'kadep';
const studentName = (request: ThesisChangeRequest) => toTitleCaseName(request.student?.name) || 'mahasiswa';

type DialogTarget =
  | { kind: 'kadep'; request: ThesisChangeRequest; state: ChangeDecisionDialogState }
  | { kind: 'batch'; batchId: string; state: ChangeDecisionDialogState };

/**
 * Tugas Akhir > Perubahan (Ketua Departemen, Paket E5, 3.2): every Pengajuan Perubahan Tugas
 * Akhir with the final decision. "Semua" by default, sorted by the server (Menunggu Keputusan
 * Anda first); Jenis and Status are filtered in the column header, the search matches name, NIM
 * or title. Setujui / Tolak icons once it is the Ketua Departemen's turn; while a lecturer
 * step is open the direct decision (with a reason) is made in the Detail modal (Lanjutan Paket
 * E6: no separate icon); an "Alihkan Mahasiswa" batch is decided together in its group modal.
 * The lecturer steps are decided by the lecturers in Tugas Akhir > Permohonan.
 */
export function ThesisChangeRequestTable() {
  const [status, setStatus] = useState<ChangeRequestViewStatus | ''>('');
  const [kind, setKind] = useState<ChangeRequestKindFilter | ''>('');
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const inbox = useChangeRequestInbox({
    status: status || undefined,
    kind: kind || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });
  const kadepDecision = useKadepDecision();
  const batchDecision = useKadepBatchDecision();

  const [detail, setDetail] = useState<ThesisChangeRequest | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogTarget | null>(null);

  const batch = useChangeRequestInbox({ batchId: groupId ?? undefined, pageSize: BATCH_PAGE_SIZE }, !!groupId);
  const groupRequests = groupId ? batch.data?.data ?? [] : [];

  const isLoading = inbox.isLoading;
  const isFetching = inbox.isFetching;

  const decideAsKadep = (request: ThesisChangeRequest, approve: boolean) => {
    const direct = !lecturerStepsDone(request);
    setDialog({
      kind: 'kadep',
      request,
      state: approve
        ? {
          approve: true,
          title: 'Setujui pengajuan?',
          description: `Perubahan untuk ${studentName(request)} langsung diterapkan ke tugas akhirnya.`,
          notesRequired: direct,
          notesHint: direct ? 'Langkah dosen belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : { approve: false, title: 'Tolak pengajuan?', description: `Pengajuan perubahan untuk ${studentName(request)} ditutup tanpa perubahan.` },
    });
  };

  const decideBatch = (batchId: string, requests: ThesisChangeRequest[], approve: boolean) => {
    const direct = requests.some((request) => !lecturerStepsDone(request));
    setDialog({
      kind: 'batch',
      batchId,
      state: approve
        ? {
          approve: true,
          title: `Setujui ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini disetujui dan langsung diterapkan.',
          notesRequired: direct,
          notesHint: direct ? 'Ada langkah dosen yang belum selesai: alasan memutuskan langsung wajib diisi.' : undefined,
        }
        : {
          approve: false,
          title: `Tolak ${requests.length} pengajuan?`,
          description: 'Semua pengajuan yang masih menunggu pada kelompok ini ditolak dengan alasan yang sama.',
        },
    });
  };

  const columns: Column<ThesisChangeRequestRow>[] = [
    {
      // The summary sits under the student instead of a narrow column of its own (1.2).
      key: 'student',
      header: 'Mahasiswa dan Perubahan',
      className: CLIP_CELL,
      render: (row) => {
        const summary = summarizeChange(row, formatLecturerName);
        return (
          <div className="min-w-0 space-y-0.5">
            <p className="truncate font-medium" title={toTitleCaseName(row.student?.name)}>
              {toTitleCaseName(row.student?.name) || '-'}
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">({row.student?.identityNumber ?? '-'})</span>
            </p>
            <p className="line-clamp-2 whitespace-normal break-words text-xs text-muted-foreground" title={summary}>{summary}</p>
          </div>
        );
      },
    },
    {
      key: 'kind',
      header: 'Jenis',
      width: BADGE_COLUMN_WIDTH.changeKind,
      className: CLIP_CELL,
      render: (row) => <ThesisChangeRequestTypeBadge request={row} />,
      filter: {
        type: 'select',
        value: kind,
        onChange: (value) => { setKind(value as ChangeRequestKindFilter | ''); setPage(1); },
        options: KIND_OPTIONS,
      },
    },
    {
      key: 'step',
      header: 'Langkah Berjalan',
      width: 150,
      className: CLIP_CELL,
      render: (row) => <span className="block truncate text-sm" title={row.currentStep ? getChangeRequestStepLabel(row.currentStep) : undefined}>{row.currentStep ? getChangeRequestStepLabel(row.currentStep) : '-'}</span>,
    },
    { key: 'createdAt', header: 'Tanggal', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (row) => <DateTimeCell date={row.createdAt} /> },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.decisionStatus,
      className: CLIP_CELL,
      render: (row) => <ThesisChangeRequestRowStatus status={row.viewStatus} blockReason={row.applyBlockReason} />,
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value as ChangeRequestViewStatus | ''); setPage(1); },
        options: STATUS_OPTIONS,
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: ACTIONS_3_WIDTH,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
          {row.status === 'pending' && row.batchId && (
            <TableIconAction icon={Users} label="Keputusan Kelompok" onClick={() => setGroupId(row.batchId)} />
          )}
          {row.status === 'pending' && !row.batchId && lecturerStepsDone(row) && (
            <>
              <TableIconAction
                icon={Check}
                label="Setujui"
                tone="approve"
                disabled={!!row.applyBlockReason}
                disabledReason={row.applyBlockReason}
                onClick={() => decideAsKadep(row, true)}
              />
              <TableIconAction icon={X} label="Tolak" onClick={() => decideAsKadep(row, false)} />
            </>
          )}
        </div>
      ),
    },
  ];

  const detailCanDecide = !!detail && detail.status === 'pending';
  const isSubmitting = kadepDecision.isPending || batchDecision.isPending;
  const closeAll = () => {
    setDialog(null);
    setDetail(null);
    setGroupId(null);
  };

  return (
    <>
      <CustomTable
        columns={columns}
        data={inbox.data?.data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        enableColumnFilters
        tableClassName={TABLE_CLASS}
        total={inbox.data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Cari nama, NIM, atau judul..."
        emptyText={debouncedSearch || status || kind ? 'Tidak ditemukan' : 'Belum ada pengajuan perubahan.'}
        rowKey={(row) => row.id}
        actions={<RefreshButton onClick={() => void inbox.refetch()} isRefreshing={isFetching && !isLoading} />}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Pengajuan Perubahan"
        description={detail ? `${toTitleCaseName(detail.student?.name) || '-'} · ${detail.student?.identityNumber ?? '-'}` : undefined}
        footer={detail ? (
          detailCanDecide ? (
            // A decision while a lecturer step is open is the direct decision: notes required.
            <DetailDialogActions
              onClose={() => setDetail(null)}
              note={detail.applyBlockReason
                ?? (!lecturerStepsDone(detail) ? 'Langkah dosen belum selesai. Anda tetap dapat memutuskan langsung dengan alasan.' : undefined)}
              noteClassName={detail.applyBlockReason ? 'text-destructive' : !lecturerStepsDone(detail) ? 'text-amber-700' : undefined}
            >
              <Button size="sm" variant="destructive" onClick={() => decideAsKadep(detail, false)}>Tolak</Button>
              <span title={detail.applyBlockReason ?? undefined}>
                <Button size="sm" disabled={!!detail.applyBlockReason} onClick={() => decideAsKadep(detail, true)}>Setujui</Button>
              </span>
            </DetailDialogActions>
          ) : (
            <DetailDialogActions onClose={() => setDetail(null)} />
          )
        ) : undefined}
      >
        {detail && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <ThesisChangeRequestTypeBadge request={detail} />
              <ThesisChangeRequestStatusBadge status={detail.status} />
            </div>
            {detail.thesisTitle && (
              <p className="text-sm [overflow-wrap:anywhere]">
                <span className="text-muted-foreground">Judul tugas akhir: </span>
                {detail.thesisTitle}
              </p>
            )}
            <ThesisChangeRequestSummary request={detail} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Langkah persetujuan</p>
              <ThesisChangeRequestSteps request={detail} />
            </div>
            {detail.supervisor && <SupervisorLoadNote load={detail.newSupervisorLoad} name={detail.supervisor.next?.name} />}
            <ThesisChangeRequestMeta request={detail} />
          </>
        )}
      </RecordDetailDialog>

      <RecordDetailDialog
        open={!!groupId}
        onOpenChange={(open) => { if (!open) setGroupId(null); }}
        title="Kelompok Alihkan Mahasiswa"
        description={groupRequests.length > 0
          ? `${groupRequests.length} mahasiswa · ${formatLecturerName(groupRequests[0].supervisor?.replaced?.name) || '-'} → ${formatLecturerName(groupRequests[0].supervisor?.next?.name) || '-'}`
          : undefined}
        footer={groupId ? (
          groupRequests.length > 0 ? (
            <DetailDialogActions onClose={() => setGroupId(null)}>
              <Button size="sm" variant="destructive" onClick={() => decideBatch(groupId, groupRequests, false)}>Tolak Semua</Button>
              <Button size="sm" onClick={() => decideBatch(groupId, groupRequests, true)}>Setujui Semua</Button>
            </DetailDialogActions>
          ) : (
            <DetailDialogActions onClose={() => setGroupId(null)} />
          )
        ) : undefined}
      >
        <ul className="divide-y rounded-md border">
          {groupRequests.map((request) => (
            <li key={request.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{toTitleCaseName(request.student?.name) || '-'}</p>
                <p className="text-xs text-muted-foreground">
                  {request.student?.identityNumber ?? '-'} · Langkah: {request.currentStep ? getChangeRequestStepLabel(request.currentStep) : '-'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThesisChangeRequestRowStatus status={request.viewStatus} blockReason={request.applyBlockReason} />
                <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(request)} />
              </div>
            </li>
          ))}
        </ul>
        {groupRequests[0]?.supervisor && (
          <SupervisorLoadNote load={groupRequests[0].newSupervisorLoad} name={groupRequests[0].supervisor.next?.name} />
        )}
      </RecordDetailDialog>

      <ThesisChangeRequestDecisionDialog
        state={dialog?.state ?? null}
        isSubmitting={isSubmitting}
        onClose={() => setDialog(null)}
        onSubmit={({ approve, notes }) => {
          if (!dialog) return;
          const done = { onSuccess: closeAll };
          if (dialog.kind === 'kadep') kadepDecision.mutate({ requestId: dialog.request.id, approve, notes }, done);
          else batchDecision.mutate({ batchId: dialog.batchId, approve, notes }, done);
        }}
      />
    </>
  );
}
