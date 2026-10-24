import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRightLeft, Check, Download, Eye, FileText, Loader2, UserCheck, X } from 'lucide-react';

import { SUPERVISOR2_CLOSED_INTAKE, SUPERVISOR2_FULL_NOTE, Supervisor2KadepDecisionDialog, type Supervisor2Decision } from '@/components/bimbingan/Supervisor2KadepDecisionDialog';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { SupervisionLoadBadge } from '@/components/shared/SupervisionLoadBadge';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { useIssueAssignment } from '@/hooks/thesis-proposal/useSupervisorAssignment';
import AuthenticatedDocumentPreviewDialog from '@/components/thesis/AuthenticatedDocumentPreviewDialog';
import { getApiUrl } from '@/config/api';
import { DateTimeCell, TruncatedText } from '@/lib/guidanceCells';
import { ACTIONS_3_WIDTH, ASSIGNMENT_BOARD_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL, DATE_COLUMN_WIDTH } from '@/lib/tableColumnWidths';
import { formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import {
  getAssignmentBatchStatusLabel,
  getAssignmentBatchStatusVariant,
  getSupervisorRequestStatusVariant,
  SUPERVISOR_REQUEST_STATUS_SHORT_LABELS,
  type ThesisBadgeVariant,
} from '@/lib/thesisLabels';
import { assignmentPreviewUrl } from '@/services/thesis-proposal/supervisor-assignment.service';
import type { AssignmentBatch, AssignmentBoard, AssignmentBoardRow, AssignmentBoardSubmission } from '@/types/thesis-proposal.types';
import { KadepSupervisorRequestDecisionDialog, type KadepAction } from './KadepSupervisorRequestDecisionDialog';
import { ProposalFileChip } from './ProposalFileChip';
import { SupervisorRequestDetails } from './SupervisorRequestDetails';

export const PAST_SEMESTER_REASON = 'Semester lampau hanya bisa dilihat.';

/** The "Pengajuan" badges. */
export const BOARD_SUBMISSION_LABELS: Record<Exclude<AssignmentBoardSubmission, 'other'>, string> = {
  department_waiting: 'Jalur Departemen · Menunggu Keputusan',
  over_quota_waiting: 'Di Atas Kuota · Menunggu Keputusan',
  supervisor2_waiting: 'Pembimbing 2 · Menunggu Keputusan',
  approved: 'Disetujui',
  revision_requested: 'Revisi Diminta',
  rejected: 'Ditolak',
};
const SUBMISSION_VARIANTS: Record<Exclude<AssignmentBoardSubmission, 'other'>, ThesisBadgeVariant> = {
  department_waiting: 'warning',
  over_quota_waiting: 'warning',
  supervisor2_waiting: 'warning',
  approved: 'success',
  revision_requested: 'info',
  rejected: 'destructive',
};
const WAITING_FILTER = 'waiting';
const ASSIGNMENT_LABELS = { pending: 'Belum Ditetapkan', assigned: 'Ditetapkan' } as const;

function submissionLabel(row: AssignmentBoardRow): string {
  if (row.submission !== 'other') return BOARD_SUBMISSION_LABELS[row.submission];
  return row.requestStatus ? SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[row.requestStatus] ?? row.requestStatus : '-';
}
function submissionVariant(row: AssignmentBoardRow): ThesisBadgeVariant {
  if (row.submission !== 'other') return SUBMISSION_VARIANTS[row.submission];
  return row.requestStatus ? getSupervisorRequestStatusVariant(row.requestStatus) : 'outline';
}
export const assignmentLabel = (row: AssignmentBoardRow) =>
  row.assignment.assigned ? `Ditetapkan (versi ${row.assignment.version})` : ASSIGNMENT_LABELS.pending;

/** Why the Head of Department cannot issue now (the button stays, disabled, with this reason). */
export function getIssueBlockReason(board: Pick<AssignmentBoard, 'counts' | 'upToDate' | 'academicYear'>, canIssue: boolean): string | null {
  if (!canIssue) return 'Hanya Ketua Departemen yang dapat menerbitkan Penetapan Pembimbing.';
  if (!board.academicYear.isOperational) return PAST_SEMESTER_REASON;
  if (board.counts.cohort === 0) return 'Belum ada mahasiswa yang pengajuan pembimbingnya disetujui pada semester ini.';
  if (board.upToDate) return 'Penetapan yang berlaku sudah memuat seluruh mahasiswa yang disetujui.';
  return null;
}

/** "Terbitkan Penetapan (2 baru)": the change is counted on the button. */
export function issueButtonLabel(board: Pick<AssignmentBoard, 'newCount' | 'needsIssue'>): string {
  if (board.newCount > 0) return `Terbitkan Penetapan (${board.newCount} baru)`;
  if (board.needsIssue) return 'Terbitkan Penetapan (ada perubahan)';
  return 'Terbitkan Penetapan';
}

/** Sekdep downloads only the current batch of a period whose batch is complete (rule kept). */
export function getDownloadBlockReason(batch: AssignmentBatch, board: Pick<AssignmentBoard, 'upToDate'>, isKadepOrAdmin: boolean): string | null {
  if (isKadepOrAdmin) return null;
  if (batch.status !== 'current') return 'Versi ini sudah digantikan.';
  if (!board.upToDate) return 'Menunggu Ketua Departemen menerbitkan versi terbaru.';
  return null;
}

function loadNote(row: AssignmentBoardRow): string | null {
  const load = row.request?.lecturerLoad;
  if (row.submission !== 'over_quota_waiting' || !load) return null;
  return `Beban ${formatLecturerName(row.candidate?.fullName)} Semester ini ${load.acceptedCount}/${load.semesterQuota} · Total ${load.activeCount}/${load.totalLimit}.`;
}

function DetailLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

interface TableProps {
  board: AssignmentBoard;
  isFetching: boolean;
  onRefresh: () => void;
  /** Only the Head of Department decides and issues. */
  isKadep: boolean;
  /** Kadep and Admin may preview the PDF. */
  isKadepOrAdmin: boolean;
  /** The semester picker, in the toolbar (shared with Riwayat Versi through `?semester=`). */
  semesterSelect?: ReactNode;
}

/**
 * Panel "Penetapan", one row per student of the chosen semester. It replaces the
 * tabs Penetapan Semester Ini, Pengajuan Lewat Departemen, Pengajuan di Atas Kuota and Permintaan
 * Pembimbing 2. "Semua" lists what waits for a decision first. A past semester is read only.
 */
export function KadepAssignmentBoardTable({ board, isFetching, onRefresh, isKadep, isKadepOrAdmin, semesterSelect }: TableProps) {
  const [pdf, setPdf] = useState<string | null>(null);
  const issue = useIssueAssignment();
  const [submission, setSubmission] = useState('');
  const [assignment, setAssignment] = useState('');
  const [detail, setDetail] = useState<AssignmentBoardRow | null>(null);
  const [dialog, setDialog] = useState<{ row: AssignmentBoardRow; action: KadepAction } | null>(null);
  const [supervisor2, setSupervisor2] = useState<Supervisor2Decision | null>(null);
  const [confirm, setConfirm] = useState(false);
  const canDecide = isKadep && board.academicYear.isOperational;

  const submissionOptions = useMemo(() => {
    const present = new Map<string, string>();
    for (const row of board.rows) present.set(row.submission === 'other' ? `status:${row.requestStatus}` : row.submission, submissionLabel(row));
    const order = Object.keys(BOARD_SUBMISSION_LABELS);
    return [
      { label: 'Semua', value: '' },
      ...(board.rows.some((row) => row.waiting) ? [{ label: 'Menunggu Keputusan', value: WAITING_FILTER }] : []),
      ...[...present.entries()]
        .sort(([a], [b]) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)))
        .map(([value, label]) => ({ label, value })),
    ];
  }, [board.rows]);

  const rows = useMemo(() => board.rows.filter((row) => {
    if (submission === WAITING_FILTER && !row.waiting) return false;
    if (submission && submission !== WAITING_FILTER) {
      const key = row.submission === 'other' ? `status:${row.requestStatus}` : row.submission;
      if (key !== submission) return false;
    }
    if (assignment === 'assigned' && !row.assignment.assigned) return false;
    if (assignment === 'pending' && row.assignment.assigned) return false;
    return true;
  }), [board.rows, submission, assignment]);
  const table = useLocalTable(rows, (row, term) => haystack(
    row.student.fullName,
    row.student.identityNumber,
    row.title,
    ...row.supervisors.map((s) => s.fullName),
    row.candidate?.fullName,
  ).includes(term));

  const openDecision = (row: AssignmentBoardRow, action: KadepAction | 'supervisor2_approve' | 'supervisor2_reject') => {
    if (action === 'supervisor2_approve' || action === 'supervisor2_reject') {
      const request = row.supervisor2Request;
      if (!request) return;
      setSupervisor2({
        mode: action === 'supervisor2_approve' ? 'approve' : 'reject',
        request: { requestId: request.requestId, studentName: request.studentName, lecturerName: request.lecturerName },
        quotaFull: row.candidate?.load?.level === 'full',
      });
      return;
    }
    setDialog({ row, action });
  };
  const supervisor2Closed = (row: AssignmentBoardRow) => row.submission === 'supervisor2_waiting' && row.candidate?.acceptingRequests === false;

  const issueReason = getIssueBlockReason(board, isKadep);
  const previewReason = board.counts.cohort === 0 ? 'Belum ada mahasiswa untuk dipratinjau.' : null;

  const columns: Column<AssignmentBoardRow>[] = [
    { key: 'no', header: 'No', width: 48, className: 'text-center', render: (_row, index) => (table.tableProps.page - 1) * table.tableProps.pageSize + index + 1 },
    { key: 'student', header: 'Mahasiswa', width: 180, className: CLIP_CELL, render: (row) => <ThesisStudentInfoCell name={row.student.fullName ?? ''} nim={row.student.identityNumber ?? ''} /> },
    {
      key: 'supervisors',
      header: 'Pembimbing',
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0 space-y-0.5 text-sm leading-snug">
          {row.supervisors.length === 0 && !row.candidate && <span className="text-muted-foreground">-</span>}
          {row.supervisors.map((supervisor, index) => {
            const line = `${index + 1}. ${formatLecturerName(supervisor.fullName)}`;
            return <p key={supervisor.lecturerId} className="truncate" title={line}>{line}</p>;
          })}
          {row.candidate && (
            <p className="truncate text-xs text-muted-foreground" title={`Calon ${row.candidate.role}: ${formatLecturerName(row.candidate.fullName)}`}>
              Calon {row.candidate.role}: {formatLecturerName(row.candidate.fullName)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'submission',
      header: 'Pengajuan',
      width: ASSIGNMENT_BOARD_WIDTH.submission,
      className: CLIP_CELL,
      render: (row) => <Badge variant={submissionVariant(row)} className="whitespace-nowrap">{submissionLabel(row)}</Badge>,
      filter: { type: 'select', value: submission, onChange: (value) => { setSubmission(value); table.resetPage(); }, options: submissionOptions },
    },
    {
      key: 'assignment',
      header: 'Penetapan',
      width: ASSIGNMENT_BOARD_WIDTH.assignment,
      className: CLIP_CELL,
      render: (row) => (
        <Badge variant={row.assignment.assigned ? 'success' : row.assignment.inCohort ? 'warning' : 'outline'} className="whitespace-nowrap">{assignmentLabel(row)}</Badge>
      ),
      filter: {
        type: 'select',
        value: assignment,
        onChange: (value) => { setAssignment(value); table.resetPage(); },
        options: [{ label: 'Semua', value: '' }, { label: ASSIGNMENT_LABELS.pending, value: 'pending' }, { label: ASSIGNMENT_LABELS.assigned, value: 'assigned' }],
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
          {canDecide && row.submission === 'department_waiting' && (
            <>
              <TableIconAction icon={UserCheck} label="Tetapkan Pembimbing" onClick={() => openDecision(row, 'approve')} />
              <TableIconAction icon={X} label="Tolak" onClick={() => openDecision(row, 'reject')} />
            </>
          )}
          {canDecide && row.submission === 'over_quota_waiting' && (
            <>
              <TableIconAction icon={Check} label="Setujui" onClick={() => openDecision(row, 'approve')} />
              <TableIconAction icon={ArrowRightLeft} label="Alihkan ke Dosen Lain" onClick={() => openDecision(row, 'redirect')} />
            </>
          )}
          {canDecide && row.submission === 'supervisor2_waiting' && (
            <>
              <TableIconAction
                icon={Check}
                label="Setujui"
                disabled={supervisor2Closed(row)}
                disabledReason={supervisor2Closed(row) ? SUPERVISOR2_CLOSED_INTAKE : null}
                onClick={() => openDecision(row, 'supervisor2_approve')}
              />
              <TableIconAction icon={X} label="Tolak" onClick={() => openDecision(row, 'supervisor2_reject')} />
            </>
          )}
        </div>
      ),
    },
  ];

  // Search on the left; the semester, Pratinjau PDF and Terbitkan, then Muat Ulang at the end.
  const toolbar = (
    <>
      {semesterSelect}
      {isKadepOrAdmin && (
        <span title={previewReason ?? undefined} className="inline-flex">
          <Button size="sm" variant="outline" disabled={Boolean(previewReason)} onClick={() => setPdf(getApiUrl(assignmentPreviewUrl(board.academicYear.id)))}>
            <FileText className="mr-2 h-4 w-4" />Pratinjau PDF
          </Button>
        </span>
      )}
      <span title={issueReason ?? undefined} className="inline-flex">
        <Button size="sm" disabled={Boolean(issueReason) || issue.isPending} onClick={() => setConfirm(true)}>
          {issue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{issueButtonLabel(board)}
        </Button>
      </span>
      <RefreshButton onClick={onRefresh} isRefreshing={isFetching} />
    </>
  );

  const current = board.currentBatch;
  const detailFooter = (row: AssignmentBoardRow) => {
    const close = () => setDetail(null);
    if (!canDecide || !row.waiting) return <DetailDialogActions onClose={close} />;
    if (row.submission === 'department_waiting') {
      return (
        <DetailDialogActions onClose={close}>
          <Button size="sm" variant="destructive" onClick={() => openDecision(row, 'reject')}>Tolak</Button>
          <Button size="sm" variant="outline" onClick={() => openDecision(row, 'request_revision')}>Minta Revisi</Button>
          <Button size="sm" onClick={() => openDecision(row, 'approve')}>Tetapkan Pembimbing</Button>
        </DetailDialogActions>
      );
    }
    if (row.submission === 'over_quota_waiting') {
      return (
        <DetailDialogActions onClose={close} note={loadNote(row) ?? undefined}>
          <Button size="sm" variant="outline" onClick={() => openDecision(row, 'redirect')}>Alihkan</Button>
          <Button size="sm" onClick={() => openDecision(row, 'approve')}>Setujui</Button>
        </DetailDialogActions>
      );
    }
    const closed = supervisor2Closed(row);
    return (
      <DetailDialogActions
        onClose={close}
        note={closed ? SUPERVISOR2_CLOSED_INTAKE : row.candidate?.load?.level === 'full' ? SUPERVISOR2_FULL_NOTE : undefined}
        noteClassName={closed ? 'text-destructive' : undefined}
      >
        <Button size="sm" variant="destructive" onClick={() => openDecision(row, 'supervisor2_reject')}>Tolak</Button>
        <Button size="sm" disabled={closed} onClick={() => openDecision(row, 'supervisor2_approve')}>Setujui</Button>
      </DetailDialogActions>
    );
  };

  return (
    <>
      <AuthenticatedDocumentPreviewDialog open={Boolean(pdf)} onOpenChange={(open) => { if (!open) setPdf(null); }} filePath={pdf} fileName="Pratinjau Penetapan Pembimbing.pdf" />
      <CustomTable
        columns={columns}
        {...table.tableProps}
        isRefreshing={isFetching}
        subtleRefresh
        enableColumnFilters
        tableClassName="table-fixed min-w-[1000px]"
        searchPlaceholder="Cari nama, NIM, judul, atau dosen..."
        emptyText={table.search || submission || assignment ? 'Tidak ditemukan' : 'Belum ada pengajuan pembimbing pada semester ini.'}
        rowKey={(row) => row.studentId}
        actions={toolbar}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Penetapan"
        description={detail ? `${toTitleCaseName(detail.student.fullName) || '-'} · ${detail.student.identityNumber ?? '-'}` : undefined}
        footer={detail ? detailFooter(detail) : undefined}
      >
        {detail && (
          <>
            <dl className="space-y-2 text-sm">
              <DetailLine label="Judul">{detail.title ?? '-'}</DetailLine>
              <DetailLine label="Pengajuan"><Badge variant={submissionVariant(detail)}>{submissionLabel(detail)}</Badge></DetailLine>
              <DetailLine label="Penetapan">{assignmentLabel(detail)}</DetailLine>
              {[...detail.supervisors, ...(detail.candidate ? [{ ...detail.candidate, role: `Calon ${detail.candidate.role}` }] : [])].map((lecturer) => (
                <DetailLine key={`${lecturer.role}-${lecturer.lecturerId}`} label={lecturer.role ?? 'Pembimbing'}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{formatLecturerName(lecturer.fullName)}</span>
                    {lecturer.load && <SupervisionLoadBadge activeCount={lecturer.load.activeCount} acceptedCount={lecturer.load.acceptedCount} semesterQuota={lecturer.load.semesterQuota} totalLimit={lecturer.load.totalLimit} level={lecturer.load.level} />}
                    {!lecturer.acceptingRequests && <Badge variant="outline">Ditutup Dosen</Badge>}
                  </div>
                </DetailLine>
              ))}
              {detail.proposal && (
                <DetailLine label="Proposal final">
                  <ProposalFileChip url={detail.proposal.url} fileName={detail.proposal.fileName ?? 'Proposal'} className="max-w-[260px]" />
                  {detail.proposal.submittedAt && <span className="text-muted-foreground"> · {formatDateTimeWib(detail.proposal.submittedAt)}</span>}
                </DetailLine>
              )}
            </dl>
            {detail.request && <SupervisorRequestDetails request={detail.request} />}
            {detail.history.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pengajuan sebelumnya</p>
                <ul className="space-y-1 text-sm">
                  {detail.history.map((request) => (
                    <li key={request.id} className="flex flex-wrap items-center gap-2">
                      <Badge variant={getSupervisorRequestStatusVariant(request.status)}>{SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[request.status] ?? request.status}</Badge>
                      <span className="text-muted-foreground">{formatDateTimeWib(request.createdAt)}</span>
                      {request.supervisor?.fullName && <span>{formatLecturerName(request.supervisor.fullName)}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </RecordDetailDialog>

      {dialog?.row.request && (
        <KadepSupervisorRequestDecisionDialog
          request={dialog.row.request}
          action={dialog.action}
          onClose={() => setDialog(null)}
          onDone={() => setDetail(null)}
        />
      )}
      <Supervisor2KadepDecisionDialog decision={supervisor2} onClose={() => setSupervisor2(null)} onDone={() => setDetail(null)} />

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terbitkan Penetapan Pembimbing?</AlertDialogTitle>
            <AlertDialogDescription>
              {current
                ? `Versi ${current.version} digantikan oleh versi ${current.version + 1} yang memuat ${board.counts.cohort} mahasiswa.`
                : `Penetapan memuat ${board.counts.cohort} mahasiswa.`}{' '}
              Mahasiswa yang baru ditetapkan menerima notifikasi dan dapat memulai bimbingan proposal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => issue.mutate(board.academicYear.id)}>Terbitkan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Panel "Riwayat Versi", one table. */
export function AssignmentVersionHistoryTable({ board, isKadepOrAdmin, semesterSelect, onRefresh, isFetching = false }: {
  board: AssignmentBoard;
  isKadepOrAdmin: boolean;
  semesterSelect?: ReactNode;
  onRefresh?: () => void;
  isFetching?: boolean;
}) {
  const [pdf, setPdf] = useState<AssignmentBatch | null>(null);
  const table = useLocalTable(board.batches, (batch, term) => haystack(String(batch.version), batch.generatedBy?.fullName).includes(term));
  const columns: Column<AssignmentBatch>[] = [
    { key: 'version', header: 'Versi', width: 80, className: 'text-center', render: (batch) => batch.version },
    { key: 'generatedAt', header: 'Diterbitkan', width: DATE_COLUMN_WIDTH, className: CLIP_CELL, render: (batch) => <DateTimeCell date={batch.generatedAt} /> },
    { key: 'by', header: 'Oleh', className: CLIP_CELL, render: (batch) => <TruncatedText text={formatLecturerName(batch.generatedBy?.fullName) || '-'} className="max-w-full" /> },
    { key: 'members', header: 'Mahasiswa', width: 110, className: 'text-center', render: (batch) => batch.memberCount },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.assignmentBatchStatus,
      className: CLIP_CELL,
      render: (batch) => <Badge variant={getAssignmentBatchStatusVariant(batch.status)} className="whitespace-nowrap">{getAssignmentBatchStatusLabel(batch.status)}</Badge>,
    },
    {
      key: 'download',
      header: 'Unduh',
      width: 80,
      className: 'text-center',
      render: (batch) => {
        const reason = getDownloadBlockReason(batch, board, isKadepOrAdmin);
        return (
          <div className="flex items-center justify-center">
            <TableIconAction icon={Download} label="Unduh PDF" disabled={Boolean(reason)} disabledReason={reason} onClick={() => setPdf(batch)} />
          </div>
        );
      },
    },
  ];
  return (
    <>
    <AuthenticatedDocumentPreviewDialog open={Boolean(pdf)} onOpenChange={(open) => { if (!open) setPdf(null); }} filePath={pdf ? getApiUrl(pdf.fileUrl) : null} fileName={pdf?.fileName} />
    <CustomTable
      columns={columns}
      {...table.tableProps}
      tableClassName="table-fixed"
      emptyText="Penetapan Pembimbing semester ini belum pernah diterbitkan."
      rowKey={(batch) => batch.id}
      actions={(
        <>
          {semesterSelect}
          {onRefresh && <RefreshButton onClick={onRefresh} isRefreshing={isFetching} />}
        </>
      )}
    />
    </>
  );
}
