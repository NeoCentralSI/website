import { useState } from 'react';
import { ArrowRight, Check, Eye, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import { ThesisChangeRequestDecisionDialog, type ChangeDecisionDialogState } from '@/components/thesis-change-request/ThesisChangeRequestDecisionDialog';
import { ThesisChangeRequestRowStatus } from '@/components/thesis-change-request/ThesisChangeRequestParts';
import { ThesisChangeRequestDetailDialog, lecturerDecisionDialogState } from '@/components/thesis-change-request/ThesisChangeRequestViews';
import { summarizeChange } from '@/components/thesis-change-request/thesisChangeRequestGroups';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Switch } from '@/components/ui/switch';
import { usePagedSearch } from '@/hooks/shared/usePagedSearch';
import { useLecturerDecision } from '@/hooks/thesis-change-request/useThesisChangeRequest';
import { useSetAcceptingRequests } from '@/hooks/thesis-proposal/useSupervisionQuota';
import {
  useLecturerApprovalInbox,
  useLecturerSupervisorInbox,
  useMarkSupervisorRequestUnderReview,
} from '@/hooks/thesis-proposal/useSupervisorRequests';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { formatLecturerName } from '@/lib/text';
import { ACTIONS_3_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import {
  CHANGE_REQUEST_VIEW_STATUS_LABELS,
  LECTURER_INBOX_JENIS_LABELS,
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS,
  getSupervisorRequestStatusLabel,
  getSupervisorRequestStatusVariant,
  lecturerInboxJenisOf,
  type ChangeRequestViewStatus,
  type LecturerInboxJenis,
  type SupervisorRequestStatus,
} from '@/lib/thesisLabels';
import type { ThesisChangeRequest } from '@/types/thesis-change-request.types';
import type { LecturerApprovalRow, SupervisorRequest } from '@/types/thesis-proposal.types';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';
import { SupervisorRequestResponseDialog, type SupervisorResponseState } from './SupervisorRequestResponseDialog';

/**
 * Fixed widths except "Usulan" (Paket E6, 1): the badge columns fit their longest label and
 * "Usulan" narrows instead; below 1000 px the table scrolls.
 */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

const KIND_OPTIONS = [
  { label: 'Semua', value: '' },
  ...(Object.keys(LECTURER_INBOX_JENIS_LABELS) as LecturerInboxJenis[]).map((jenis) => ({ label: LECTURER_INBOX_JENIS_LABELS[jenis], value: jenis })),
];

/** Status filter per Jenis, in the order of each kind's priority. */
const REQUEST_STATUSES: SupervisorRequestStatus[] = [
  'pending', 'under_review', 'pending_kadep', 'revision_requested', 'accepted', 'assigned', 'redirected',
  'rejected_by_lecturer', 'rejected_by_kadep', 'withdrawn', 'cancelled', 'closed',
];
const CHANGE_STATUSES: ChangeRequestViewStatus[] = ['awaiting_me', 'in_progress', 'approved', 'rejected', 'cancelled'];
/** "Semua": both kinds, waiting for the viewer first. "Dibatalkan" is one option for both. */
const ALL_STATUSES: string[] = [
  'awaiting_me', 'pending', 'under_review', 'in_progress', 'pending_kadep', 'revision_requested', 'accepted', 'assigned',
  'redirected', 'approved', 'rejected_by_lecturer', 'rejected_by_kadep', 'rejected', 'withdrawn', 'cancelled', 'closed',
];
const statusLabel = (status: string) =>
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[status as SupervisorRequestStatus] ?? CHANGE_REQUEST_VIEW_STATUS_LABELS[status as ChangeRequestViewStatus] ?? status;

function statusOptionsFor(jenis: LecturerInboxJenis | ''): string[] {
  if (jenis === 'supervisor_request') return REQUEST_STATUSES;
  if (jenis) return CHANGE_STATUSES;
  return ALL_STATUSES;
}

const WAITING_REQUEST_STATUSES: SupervisorRequestStatus[] = ['pending', 'under_review'];

const studentOf = (row: LecturerApprovalRow) =>
  row.kind === 'supervisor_request'
    ? { name: row.supervisorRequest.student?.fullName ?? '', nim: row.supervisorRequest.student?.identityNumber ?? '' }
    : { name: row.changeRequest.student?.name ?? '', nim: row.changeRequest.student?.identityNumber ?? '' };

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
 * Tugas Akhir > Permohonan (Paket E5, 3.1): the lecturer's approval inbox in one table, the
 * "Pengajuan Pembimbing" of the proposal phase and the lecturer's own steps of a "Perubahan
 * TA" (previous supervisor, new supervisor, or Pembimbing 1 for a title). "Semua" by default,
 * sorted by the server (what waits for the viewer first); Jenis (Paket E6: Pengajuan
 * Pembimbing, Perubahan Judul, Perubahan Pembimbing, Perubahan Judul & Pembimbing) and Status
 * are filtered in the column header. Terima / Tolak (an arrow to forward to the Ketua Departemen when the
 * lecturer is full) and Setujui / Tolak are icons in the row, everything else in the modal.
 */
export function LecturerApprovalInboxTable() {
  const { search, setSearch, debouncedSearch, page, setPage } = usePagedSearch();
  const [pageSize, setPageSize] = useState(10);
  const [kind, setKind] = useState<LecturerInboxJenis | ''>('');
  const [status, setStatus] = useState('');
  const inbox = useLecturerApprovalInbox({
    kind: kind || undefined,
    status: status || undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize,
  });
  const { data: supervisorInbox } = useLecturerSupervisorInbox();
  const markReview = useMarkSupervisorRequestUnderReview();
  const lecturerDecision = useLecturerDecision();

  const [requestDetail, setRequestDetail] = useState<SupervisorRequest | null>(null);
  const [changeDetail, setChangeDetail] = useState<ThesisChangeRequest | null>(null);
  const [response, setResponse] = useState<SupervisorResponseState>(null);
  const [changeDecision, setChangeDecision] = useState<{ request: ThesisChangeRequest; state: ChangeDecisionDialogState } | null>(null);

  const isFull = supervisorInbox?.load.level === 'full';
  const acceptLabel = isFull ? 'Terima dan Teruskan ke Ketua Departemen' : 'Terima';
  const isWaitingRequest = (request: SupervisorRequest) => WAITING_REQUEST_STATUSES.includes(request.status);
  const isLoading = inbox.isLoading;
  const isFetching = inbox.isFetching;

  const columns: Column<LecturerApprovalRow>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 170,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell {...studentOf(row)} />,
    },
    {
      // Paket E6 (3): one badge; the details (position, before → after) are in Usulan.
      key: 'kind',
      header: 'Jenis',
      width: BADGE_COLUMN_WIDTH.lecturerInboxJenis,
      className: CLIP_CELL,
      render: (row) => <Badge variant="outline" className="whitespace-nowrap">{LECTURER_INBOX_JENIS_LABELS[lecturerInboxJenisOf(row)]}</Badge>,
      filter: {
        type: 'select',
        value: kind,
        onChange: (value) => {
          const next = value as LecturerInboxJenis | '';
          setKind(next);
          if (status && !statusOptionsFor(next).includes(status)) setStatus('');
          setPage(1);
        },
        options: KIND_OPTIONS,
      },
    },
    {
      key: 'proposal',
      header: 'Usulan',
      render: (row) => (
        <TruncatedText
          text={row.kind === 'supervisor_request' ? row.supervisorRequest.proposedTitle : summarizeChange(row.changeRequest, formatLecturerName)}
          className="max-w-full"
        />
      ),
    },
    { key: 'createdAt', header: 'Tanggal Masuk', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (row) => <DateTimeCell date={row.createdAt} /> },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.lecturerInboxStatus,
      className: CLIP_CELL,
      render: (row) =>
        row.kind === 'supervisor_request' ? (
          <Badge
            variant={getSupervisorRequestStatusVariant(row.viewStatus)}
            className="whitespace-nowrap"
            title={getSupervisorRequestStatusLabel(row.viewStatus)}
          >
            {SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[row.viewStatus] ?? row.viewStatus}
          </Badge>
        ) : (
          <ThesisChangeRequestRowStatus status={row.viewStatus} blockReason={row.changeRequest.applyBlockReason} />
        ),
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value); setPage(1); },
        options: [{ label: 'Semua', value: '' }, ...statusOptionsFor(kind).map((value) => ({ label: statusLabel(value), value }))],
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: ACTIONS_3_WIDTH,
      className: 'text-center',
      render: (row) => (
        <div className="flex items-center justify-center gap-1">
          {row.kind === 'supervisor_request' ? (
            <>
              <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setRequestDetail(row.supervisorRequest)} />
              {isWaitingRequest(row.supervisorRequest) && (
                <>
                  <TableIconAction
                    icon={isFull ? ArrowRight : Check}
                    label={acceptLabel}
                    tone="approve"
                    onClick={() => setResponse({ request: row.supervisorRequest, action: 'accept' })}
                  />
                  <TableIconAction icon={X} label="Tolak" onClick={() => setResponse({ request: row.supervisorRequest, action: 'reject' })} />
                </>
              )}
            </>
          ) : (
            <>
              <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setChangeDetail(row.changeRequest)} />
              {row.changeRequest.viewer.canDecideAsLecturer && (
                <>
                  <TableIconAction
                    icon={Check}
                    label="Setujui"
                    tone="approve"
                    disabled={!!row.changeRequest.applyBlockReason}
                    disabledReason={row.changeRequest.applyBlockReason}
                    onClick={() => setChangeDecision({ request: row.changeRequest, state: lecturerDecisionDialogState(row.changeRequest, true) })}
                  />
                  <TableIconAction
                    icon={X}
                    label="Tolak"
                    onClick={() => setChangeDecision({ request: row.changeRequest, state: lecturerDecisionDialogState(row.changeRequest, false) })}
                  />
                </>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

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
        emptyText={debouncedSearch || kind || status ? 'Tidak ditemukan' : 'Belum ada permohonan.'}
        rowKey={(row) => `${row.kind}:${row.id}`}
        actions={<RefreshButton onClick={() => void inbox.refetch()} isRefreshing={isFetching && !isLoading} />}
      />

      <RecordDetailDialog
        open={!!requestDetail}
        onOpenChange={(open) => { if (!open) setRequestDetail(null); }}
        title="Detail Pengajuan Pembimbing"
        description={supervisorInbox ? `Semester ${supervisorInbox.academicYear.label}` : undefined}
        footer={requestDetail && isWaitingRequest(requestDetail) ? (
          <>
            {isFull && <p className="mr-auto text-xs text-muted-foreground">Anda sudah mencapai batas bimbingan; menerima berarti meneruskan ke Ketua Departemen.</p>}
            {requestDetail.status === 'pending' && (
              <Button size="sm" variant="ghost" disabled={markReview.isPending} onClick={() => markReview.mutate(requestDetail.id)}>Tandai Sedang Ditinjau</Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setResponse({ request: requestDetail, action: 'reject' })}>Tolak</Button>
            <Button size="sm" onClick={() => setResponse({ request: requestDetail, action: 'accept' })}>{isFull ? 'Terima dan Teruskan' : 'Terima'}</Button>
          </>
        ) : undefined}
      >
        {requestDetail && <SupervisorRequestDetails request={requestDetail} showStudent />}
      </RecordDetailDialog>

      <SupervisorRequestResponseDialog
        state={response}
        isFull={!!isFull}
        onClose={() => setResponse(null)}
        onDone={() => setRequestDetail(null)}
      />

      <ThesisChangeRequestDetailDialog request={changeDetail} onClose={() => setChangeDetail(null)} />

      <ThesisChangeRequestDecisionDialog
        state={changeDecision?.state ?? null}
        isSubmitting={lecturerDecision.isPending}
        onClose={() => setChangeDecision(null)}
        onSubmit={({ approve, notes }) => {
          if (!changeDecision) return;
          lecturerDecision.mutate({ requestId: changeDecision.request.id, approve, notes }, { onSuccess: () => setChangeDecision(null) });
        }}
      />
    </>
  );
}
