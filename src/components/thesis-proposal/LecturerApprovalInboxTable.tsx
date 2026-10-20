import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, Check, Eye, X } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
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
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
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
import type { LecturerApprovalRow, Supervisor2InboxItem, SupervisorRequest } from '@/types/thesis-proposal.types';
import { Supervisor2InboxDetails, Supervisor2LecturerDecisionDialog, type Supervisor2LecturerDecision } from './LecturerSupervisor2Dialogs';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';
import { SupervisorRequestResponseDialog, type SupervisorResponseState } from './SupervisorRequestResponseDialog';

/**
 * Fixed widths except "Usulan": the badge columns fit their longest label and
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
  // A Pembimbing 2 request always waits for the lecturer.
  if (jenis === 'supervisor2') return ['awaiting_me'];
  if (jenis) return CHANGE_STATUSES;
  return ALL_STATUSES;
}

const WAITING_REQUEST_STATUSES: SupervisorRequestStatus[] = ['pending', 'under_review'];

const studentOf = (row: LecturerApprovalRow) => {
  if (row.kind === 'supervisor_request') return { name: row.supervisorRequest.student?.fullName ?? '', nim: row.supervisorRequest.student?.identityNumber ?? '' };
  if (row.kind === 'supervisor2_request') return { name: row.supervisor2Request.studentName, nim: row.supervisor2Request.studentNim ?? '' };
  return { name: row.changeRequest.student?.name ?? '', nim: row.changeRequest.student?.identityNumber ?? '' };
};

/** Text the search matches: the student's name and NIM and the proposal (title or change). */
const searchTextOf = (row: LecturerApprovalRow) => {
  const student = studentOf(row);
  const proposal = row.kind === 'supervisor_request'
    ? row.supervisorRequest.proposedTitle
    : row.kind === 'supervisor2_request'
      ? row.supervisor2Request.thesisTitle
      : summarizeChange(row.changeRequest, formatLecturerName);
  return haystack(student.name, student.nim, proposal);
};

/**
 * Supervision load and "Menerima pengajuan baru", in the toolbar of the Permohonan table (no
 * row of controls under the page title).
 */
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
 * Tugas Akhir > Permohonan: the lecturer's approval inbox in one table, the
 * "Pengajuan Pembimbing" of the proposal phase and the lecturer's own steps of a "Perubahan
 * TA" (previous supervisor, new supervisor, or Pembimbing 1 for a title). "Semua" by default,
 * sorted by the server (what waits for the viewer first); Jenis (Pengajuan
 * Pembimbing, Perubahan Judul, Perubahan Pembimbing, Perubahan Judul & Pembimbing) and Status
 * are filtered in the column header. Terima / Tolak (an arrow to forward to the Ketua Departemen when the
 * lecturer is full) and Setujui / Tolak are icons in the row, everything else in the modal.
 * The Pembimbing 2 requests are the Jenis "Pembimbing 2" (Lihat, Bersedia, Tolak),
 * first among what waits; the page has this one table. A lecturer's inbox is small, so it is
 * loaded once in the server's order and filtered, searched and paged in the browser: the
 * search is instant and the order stays the server's.
 */
export function LecturerApprovalInboxTable() {
  const [kind, setKind] = useState<LecturerInboxJenis | ''>('');
  const [status, setStatus] = useState('');
  const inbox = useLecturerApprovalInbox({ all: true, page: 1, pageSize: 100 });
  const rows = useMemo(
    () => (inbox.data?.data ?? []).filter((row) => (!kind || lecturerInboxJenisOf(row) === kind) && (!status || row.viewStatus === status)),
    [inbox.data, kind, status],
  );
  const matches = useCallback((row: LecturerApprovalRow, term: string) => searchTextOf(row).includes(term), []);
  const table = useLocalTable(rows, matches);
  const { data: supervisorInbox } = useLecturerSupervisorInbox();
  const markReview = useMarkSupervisorRequestUnderReview();
  const lecturerDecision = useLecturerDecision();

  const [requestDetail, setRequestDetail] = useState<SupervisorRequest | null>(null);
  const [changeDetail, setChangeDetail] = useState<ThesisChangeRequest | null>(null);
  const [response, setResponse] = useState<SupervisorResponseState>(null);
  const [changeDecision, setChangeDecision] = useState<{ request: ThesisChangeRequest; state: ChangeDecisionDialogState } | null>(null);
  const [supervisor2Detail, setSupervisor2Detail] = useState<Supervisor2InboxItem | null>(null);
  const [supervisor2Decision, setSupervisor2Decision] = useState<Supervisor2LecturerDecision>(null);

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
      // One badge; the details (position, before → after) are in Usulan.
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
          table.resetPage();
        },
        options: KIND_OPTIONS,
      },
    },
    {
      key: 'proposal',
      header: 'Usulan',
      render: (row) => (
        <TruncatedText
          text={row.kind === 'supervisor_request'
            ? row.supervisorRequest.proposedTitle
            : row.kind === 'supervisor2_request'
              ? row.supervisor2Request.thesisTitle
              : summarizeChange(row.changeRequest, formatLecturerName)}
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
        ) : row.kind === 'supervisor2_request' ? (
          <ThesisChangeRequestRowStatus status={row.viewStatus} blockReason={null} />
        ) : (
          <ThesisChangeRequestRowStatus status={row.viewStatus} blockReason={row.changeRequest.applyBlockReason} />
        ),
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value); table.resetPage(); },
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
                    onClick={() => setResponse({ request: row.supervisorRequest, action: 'accept' })}
                  />
                  <TableIconAction icon={X} label="Tolak" onClick={() => setResponse({ request: row.supervisorRequest, action: 'reject' })} />
                </>
              )}
            </>
          ) : row.kind === 'supervisor2_request' ? (
            <>
              <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setSupervisor2Detail(row.supervisor2Request)} />
              <TableIconAction icon={Check} label="Bersedia" onClick={() => setSupervisor2Decision({ mode: 'approve', item: row.supervisor2Request })} />
              <TableIconAction icon={X} label="Tolak" onClick={() => setSupervisor2Decision({ mode: 'reject', item: row.supervisor2Request })} />
            </>
          ) : (
            <>
              <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setChangeDetail(row.changeRequest)} />
              {row.changeRequest.viewer.canDecideAsLecturer && (
                <>
                  <TableIconAction
                    icon={Check}
                    label="Setujui"
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
        {...table.tableProps}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        subtleRefresh
        enableColumnFilters
        tableClassName={TABLE_CLASS}
        searchPlaceholder="Cari nama, NIM, atau judul..."
        emptyText={table.search || kind || status ? 'Tidak ditemukan' : 'Belum ada permohonan.'}
        rowKey={(row) => `${row.kind}:${row.id}`}
        actions={(
          <>
            <LecturerSupervisionLoadControls />
            <RefreshButton onClick={() => void inbox.refetch()} isRefreshing={isFetching && !isLoading} />
          </>
        )}
      />

      <RecordDetailDialog
        open={!!requestDetail}
        onOpenChange={(open) => { if (!open) setRequestDetail(null); }}
        title="Detail Pengajuan Pembimbing"
        description={supervisorInbox ? `Semester ${supervisorInbox.academicYear.label}` : undefined}
        footer={requestDetail ? (
          isWaitingRequest(requestDetail) ? (
            <DetailDialogActions
              onClose={() => setRequestDetail(null)}
              note={isFull ? 'Anda sudah mencapai batas bimbingan; menerima berarti meneruskan ke Ketua Departemen.' : undefined}
            >
              {requestDetail.status === 'pending' && (
                <Button size="sm" variant="outline" disabled={markReview.isPending} onClick={() => markReview.mutate(requestDetail.id)}>Tandai Sedang Ditinjau</Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => setResponse({ request: requestDetail, action: 'reject' })}>Tolak</Button>
              <Button size="sm" onClick={() => setResponse({ request: requestDetail, action: 'accept' })}>{isFull ? 'Terima dan Teruskan' : 'Terima'}</Button>
            </DetailDialogActions>
          ) : (
            <DetailDialogActions onClose={() => setRequestDetail(null)} />
          )
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

      <RecordDetailDialog
        open={!!supervisor2Detail}
        onOpenChange={(open) => { if (!open) setSupervisor2Detail(null); }}
        title="Detail Permintaan Pembimbing 2"
        footer={supervisor2Detail ? (
          <DetailDialogActions onClose={() => setSupervisor2Detail(null)}>
            <Button size="sm" variant="destructive" onClick={() => setSupervisor2Decision({ mode: 'reject', item: supervisor2Detail })}>Tolak</Button>
            <Button size="sm" onClick={() => setSupervisor2Decision({ mode: 'approve', item: supervisor2Detail })}>Bersedia</Button>
          </DetailDialogActions>
        ) : undefined}
      >
        {supervisor2Detail && <Supervisor2InboxDetails item={supervisor2Detail} />}
      </RecordDetailDialog>

      <Supervisor2LecturerDecisionDialog decision={supervisor2Decision} onClose={() => setSupervisor2Decision(null)} onDone={() => setSupervisor2Detail(null)} />

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
