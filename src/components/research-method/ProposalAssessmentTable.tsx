import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Eye, FileText } from 'lucide-react';

import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { formatAttendance, ResultCell } from '@/components/research-method/AssessmentCells';
import { ScoreFormDialog } from '@/components/research-method/ScoreFormDialog';
import { DetailDialogActions } from '@/components/shared/DetailDialogActions';
import { RecordDetailDialog } from '@/components/shared/RecordDetailDialog';
import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisStudentInfoCell } from '@/components/shared/ThesisTableCells';
import AuthenticatedDocumentPreviewDialog from '@/components/thesis/AuthenticatedDocumentPreviewDialog';
import { ProposalFileChip } from '@/components/thesis-proposal/ProposalFileChip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { haystack, useLocalTable } from '@/hooks/shared/useLocalTable';
import { TruncatedText } from '@/lib/guidanceCells';
import {
  ASSESSMENT_VIEW_STATUS_ORDER,
  ASSESSMENT_VIEW_STATUS_VARIANTS,
  assessmentViewStatus,
  assessmentViewStatusLabel,
  scoreSum,
  type AssessmentViewStatus,
} from '@/lib/researchMethodViews';
import { ACTIONS_3_WIDTH, BADGE_COLUMN_WIDTH, CLIP_CELL } from '@/lib/tableColumnWidths';
import { formatDateShortId, formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import type { AssessmentQueue, AssessmentView, AssessorParty } from '@/types/research-method.types';

/** Fixed columns 796 px; the title narrows. No horizontal scroll at 1366 px. */
const TABLE_CLASS = 'table-fixed min-w-[1000px]';

const NO_PROPOSAL = 'Mahasiswa belum mengajukan proposal final.';

function sortRows(rows: AssessmentView[], party: AssessorParty) {
  const rank = (row: AssessmentView) => ASSESSMENT_VIEW_STATUS_ORDER.indexOf(assessmentViewStatus(row, party));
  return [...rows].sort((a, b) => rank(a) - rank(b) || String(a.student.identityNumber).localeCompare(String(b.student.identityNumber)));
}

function supervisorsLine(row: AssessmentView) {
  return row.thesis.supervisors.map((s) => `${formatLecturerName(s.fullName)} (${s.role ?? '-'})`).join(' · ');
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr]">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

function partyScore(score: number | null | undefined, name: string | null | undefined, at: string | null | undefined) {
  if (score == null) return <span className="text-muted-foreground">Belum dikirim</span>;
  return (
    <>
      <span className="font-medium">{score}</span>
      {(name || at) && <span className="text-muted-foreground"> · {[name ? formatLecturerName(name) : null, at ? formatDateTimeWib(at) : null].filter(Boolean).join(', ')}</span>}
    </>
  );
}

interface Props {
  party: AssessorParty;
  queue: AssessmentQueue | undefined;
  isLoading: boolean;
  isFetching: boolean;
  /** False for a reader (Kadep, Sekdep, Admin on the coordinator page). */
  viewerCanScore: boolean;
  /** Why a reader cannot score, shown on the disabled action. */
  viewerBlockReason?: string;
  /** Period select, exports, refresh (in the table toolbar). */
  actions: ReactNode;
  emptyText: string;
  /** Pembimbing: the student's page in Mahasiswa Bimbingan, linked from the modal. */
  studentHref?: (row: AssessmentView) => string;
}

/**
 * The Penilaian Proposal queue of one party in one table, for Tugas Akhir > Proposal
 * (pembimbing) and Metode Penelitian > Penilaian Proposal (koordinator). "Semua" by default,
 * sorted with what the viewer has to score first; Status is filtered in its column header. The
 * row actions are icons; the detail opens in a modal.
 */
export function ProposalAssessmentTable({ party, queue, isLoading, isFetching, viewerCanScore, viewerBlockReason, actions, emptyText, studentHref }: Props) {
  const [status, setStatus] = useState<AssessmentViewStatus | ''>('');
  const [detail, setDetail] = useState<AssessmentView | null>(null);
  const [scoring, setScoring] = useState<AssessmentView | null>(null);
  const [viewer, setViewer] = useState<{ name: string; url: string } | null>(null);

  const rows = useMemo(() => {
    const all = sortRows(queue?.rows ?? [], party);
    return status ? all.filter((row) => assessmentViewStatus(row, party) === status) : all;
  }, [queue, party, status]);
  const table = useLocalTable(rows, (row, term) => haystack(row.student.fullName, row.student.identityNumber, row.thesis.title).includes(term));

  const scoreBlock = (row: AssessmentView): string | null => {
    if (!viewerCanScore) return viewerBlockReason ?? 'Anda tidak dapat mengisi nilai ini.';
    if (row.isFinalized) return 'Nilai akhir sudah final.';
    const own = party === 'supervisor' ? row.supervisorScore : row.coordinatorScore;
    if (own != null) return 'Nilai Anda sudah dikirim dan terkunci.';
    return row.canScore ? null : row.scoreBlockReason ?? 'Belum dapat dinilai.';
  };

  const statusOptions = [
    { label: 'Semua', value: '' },
    ...ASSESSMENT_VIEW_STATUS_ORDER.map((value) => ({ label: assessmentViewStatusLabel(value, party), value })),
  ];

  const columns: Column<AssessmentView>[] = [
    {
      key: 'student',
      header: 'Mahasiswa',
      width: 190,
      className: CLIP_CELL,
      render: (row) => <ThesisStudentInfoCell name={row.student.fullName ?? ''} nim={row.student.identityNumber ?? ''} />,
    },
    {
      key: 'title',
      header: 'Judul',
      className: CLIP_CELL,
      render: (row) => (
        <div className="min-w-0 space-y-0.5">
          <TruncatedText text={row.thesis.title || 'Judul belum ditentukan'} className="max-w-full" />
          {party === 'coordinator' && (
            <p className="truncate text-xs text-muted-foreground" title={supervisorsLine(row)}>{supervisorsLine(row) || '-'}</p>
          )}
        </div>
      ),
    },
    {
      key: 'proposal',
      header: 'Proposal Final',
      width: 150,
      className: CLIP_CELL,
      render: (row) => (
        <div className="leading-tight">
          <div className="whitespace-nowrap">{row.proposal?.submittedAt ? formatDateShortId(row.proposal.submittedAt) : <span className="text-muted-foreground">Belum diajukan</span>}</div>
          <div className={`whitespace-nowrap text-xs ${row.attendance && !row.attendance.isEligible ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
            Presensi {row.attendance ? formatAttendance(row.attendance.attendancePercentage) : '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'score',
      header: 'Nilai',
      width: 140,
      className: CLIP_CELL,
      render: (row) => (
        <span
          className="whitespace-nowrap"
          title={`Pembimbing ${row.supervisorScore ?? '-'} + Koordinator ${row.coordinatorScore ?? '-'}${row.isFinalized ? ` = Nilai akhir ${row.finalScore ?? '-'}` : ''}`}
        >
          {scoreSum(row.supervisorScore, row.coordinatorScore, row.isFinalized ? row.finalScore : null)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: BADGE_COLUMN_WIDTH.proposalAssessmentStatus,
      className: CLIP_CELL,
      render: (row) => {
        const value = assessmentViewStatus(row, party);
        return (
          <Badge
            variant={ASSESSMENT_VIEW_STATUS_VARIANTS[value]}
            className="whitespace-nowrap"
            title={value === 'not_ready' ? row.scoreBlockReason ?? undefined : undefined}
          >
            {assessmentViewStatusLabel(value, party)}
          </Badge>
        );
      },
      filter: {
        type: 'select',
        value: status,
        onChange: (value) => { setStatus(value as AssessmentViewStatus | ''); table.resetPage(); },
        options: statusOptions,
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      width: ACTIONS_3_WIDTH,
      className: 'text-center',
      render: (row) => {
        const block = scoreBlock(row);
        return (
          <div className="flex items-center justify-center gap-1">
            <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => setDetail(row)} />
            <TableIconAction icon={ClipboardCheck} label="Nilai Proposal" disabled={Boolean(block)} disabledReason={block} onClick={() => setScoring(row)} />
            <TableIconAction
              icon={FileText}
              label="Buka Proposal Final"
              disabled={!row.proposal?.url}
              disabledReason={NO_PROPOSAL}
              onClick={() => row.proposal?.url && setViewer({ name: row.proposal.fileName ?? 'Proposal final.pdf', url: row.proposal.url })}
            />
          </div>
        );
      },
    },
  ];

  const detailBlock = detail ? scoreBlock(detail) : null;

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
        emptyText={table.search || status ? 'Tidak ditemukan' : emptyText}
        rowKey={(row) => row.id ?? `thesis:${row.thesis.id}`}
        actions={actions}
      />

      <RecordDetailDialog
        open={!!detail}
        onOpenChange={(open) => { if (!open) setDetail(null); }}
        title="Detail Penilaian Proposal"
        description={detail ? `${toTitleCaseName(detail.student.fullName) || '-'} · ${detail.student.identityNumber ?? '-'}` : undefined}
        footer={detail ? (
          detailBlock ? (
            <DetailDialogActions onClose={() => setDetail(null)} note={detail.isFinalized ? undefined : detailBlock} />
          ) : (
            <DetailDialogActions onClose={() => setDetail(null)}>
              <Button size="sm" onClick={() => { setScoring(detail); setDetail(null); }}>Nilai Proposal</Button>
            </DetailDialogActions>
          )
        ) : undefined}
      >
        {detail && (
          <dl className="space-y-2">
            <DetailRow label="Judul">{detail.thesis.title || 'Judul belum ditentukan'}</DetailRow>
            {studentHref && (
              <DetailRow label="Mahasiswa bimbingan">
                <Link to={studentHref(detail)} className="text-primary hover:underline">Buka detail mahasiswa</Link>
              </DetailRow>
            )}
            <DetailRow label="Pembimbing">{supervisorsLine(detail) || '-'}</DetailRow>
            <DetailRow label="Proposal final">
              {detail.proposal?.url ? (
                <ProposalFileChip url={detail.proposal.url} fileName={detail.proposal.fileName ?? 'Proposal final'} className="max-w-[280px]" />
              ) : <span className="text-muted-foreground">Belum diajukan</span>}
              {detail.proposal?.submittedAt && <span className="text-muted-foreground"> · {formatDateTimeWib(detail.proposal.submittedAt)}</span>}
            </DetailRow>
            <DetailRow label="Presensi">
              {detail.attendance
                ? `${formatAttendance(detail.attendance.attendancePercentage)} (${detail.attendance.presentCount} dari ${detail.attendance.totalMeetings} pertemuan)`
                : <span className="text-muted-foreground">Belum tercatat</span>}
            </DetailRow>
            <DetailRow label="Nilai pembimbing">{partyScore(detail.supervisorScore, detail.supervisorName, detail.supervisorScoredAt)}</DetailRow>
            <DetailRow label="Nilai koordinator">{partyScore(detail.coordinatorScore, detail.coordinatorName, detail.coordinatorScoredAt)}</DetailRow>
            <DetailRow label="Nilai akhir"><ResultCell row={detail} /></DetailRow>
            {queue && <DetailRow label="Nilai minimum lulus">{queue.minimumScore} ({queue.academicYear.label})</DetailRow>}
          </dl>
        )}
      </RecordDetailDialog>

      <ScoreFormDialog row={scoring} party={party} onOpenChange={(open) => !open && setScoring(null)} />
      <AuthenticatedDocumentPreviewDialog
        open={Boolean(viewer)}
        onOpenChange={(value) => { if (!value) setViewer(null); }}
        fileName={viewer?.name}
        filePath={viewer?.url}
      />
    </>
  );
}
