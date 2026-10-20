import { formatDateTimeWib, formatLecturerName } from '@/lib/text';
import { getSupervisorRequestRouteLabel, SUPERVISOR_REQUEST_STATUS_SHORT_LABELS } from '@/lib/thesisLabels';
import type { StudentProposalOverview, StudentSupervisorRequests, SupervisorRequest } from '@/types/thesis-proposal.types';

/**
 * What the student Proposal page shows, as pure functions (the stepper and the one
 * action of the Pengajuan Pembimbing card).
 */

export type ProposalStepState = 'done' | 'waiting' | 'attention' | 'failed';
export interface ProposalStep {
  key: string;
  label: string;
  state: ProposalStepState;
  note: string;
}

const WAITING_STATUSES = ['pending', 'under_review', 'pending_kadep'];
const APPROVED_STATUSES = ['accepted', 'redirected', 'assigned'];
export const FAILED_NOTE = 'Tidak lulus, ulangi semester berikutnya';
export const WAITING_THESIS_COURSE_NOTE = 'Menunggu KRS Tugas Akhir semester berikutnya';

const done = (key: string, label: string, note = 'Terpenuhi'): ProposalStep => ({ key, label, state: 'done', note });
const waiting = (key: string, label: string, note = 'Menunggu'): ProposalStep => ({ key, label, state: 'waiting', note });

function requestStep(requests: StudentSupervisorRequests | undefined, overview: StudentProposalOverview | undefined): ProposalStep {
  const label = 'Pengajuan Pembimbing';
  const active = requests?.activeRequest ?? null;
  const hasSupervisor1 = overview?.thesis?.supervisors.some((s) => s.role === 'Pembimbing 1') ?? false;
  if ((active && APPROVED_STATUSES.includes(active.status)) || hasSupervisor1) return done('request', label, 'Disetujui');
  if (active) return waiting('request', label, SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[active.status] ?? 'Menunggu');
  if (requests?.submission.revisionRequested) return { key: 'request', label, state: 'attention', note: 'Perlu revisi' };
  return waiting('request', label, 'Belum diajukan');
}

/** The five steps of the stepper; a thesis repeating its proposal has other steps 3 to 5. */
export function buildProposalSteps(overview: StudentProposalOverview | undefined, requests: StudentSupervisorRequests | undefined): ProposalStep[] {
  const thesis = overview?.thesis ?? null;
  const inResearch = thesis?.status === 'research';
  const first = requestStep(requests, overview);
  const assigned = overview?.assignment?.assigned ?? false;
  const second = assigned ? done('assignment', 'Penetapan Pembimbing', 'Ditetapkan') : waiting('assignment', 'Penetapan Pembimbing');

  const revision = overview?.proposalRevision;
  if (revision?.applicable) {
    const current = revision.current;
    const third: ProposalStep = !current
      ? waiting('revision', 'Proposal Revisi', 'Belum diajukan')
      : current.status === 'revision_requested'
        ? { key: 'revision', label: 'Proposal Revisi', state: 'attention', note: 'Perlu revisi' }
        : done('revision', 'Proposal Revisi', 'Diajukan');
    const fourth: ProposalStep = current?.status === 'approved'
      ? done('approval', 'Persetujuan Pembimbing 1', 'Disetujui')
      : current?.status === 'revision_requested'
        ? { key: 'approval', label: 'Persetujuan Pembimbing 1', state: 'attention', note: 'Revisi diminta' }
        : waiting('approval', 'Persetujuan Pembimbing 1', current ? 'Menunggu Pembimbing 1' : 'Menunggu');
    const fifth = inResearch ? done('back', 'Kembali ke Penelitian') : waiting('back', 'Kembali ke Penelitian');
    return [first, second, third, fourth, fifth];
  }

  if (inResearch) {
    return [first, second, done('final', 'Proposal Final'), done('assessment', 'Penilaian Proposal', 'Lulus'), done('promotion', 'Mulai Penelitian')];
  }
  const attempt = overview?.finalProposal.current ?? null;
  const third = attempt?.file ? done('final', 'Proposal Final', 'Diajukan') : waiting('final', 'Proposal Final');
  let fourth: ProposalStep;
  if (attempt?.attendanceAutoZeroed || (attempt?.isFinalized && attempt.result === 'failed')) {
    fourth = { key: 'assessment', label: 'Penilaian Proposal', state: 'failed', note: FAILED_NOTE };
  } else if (attempt?.isFinalized && attempt.result === 'passed') {
    fourth = done('assessment', 'Penilaian Proposal', 'Lulus');
  } else if (attempt?.supervisorScored && !attempt.coordinatorScored) {
    fourth = waiting('assessment', 'Penilaian Proposal', 'Menunggu koordinator');
  } else if (attempt?.coordinatorScored && !attempt.supervisorScored) {
    fourth = waiting('assessment', 'Penilaian Proposal', 'Menunggu pembimbing');
  } else {
    fourth = waiting('assessment', 'Penilaian Proposal');
  }
  const fifth = fourth.state === 'done'
    ? waiting('promotion', 'Mulai Penelitian', WAITING_THESIS_COURSE_NOTE)
    : waiting('promotion', 'Mulai Penelitian');
  return [first, second, third, fourth, fifth];
}

export type RequestCardAction = 'submit' | 'continue' | 'withdraw' | 'cancel' | 'detail' | null;
export interface RequestCardState {
  status: string;
  variant: 'success' | 'warning' | 'outline' | 'destructive' | 'info';
  action: RequestCardAction;
  /** The not-eligible message (item 1.4) or a short note. */
  message: string | null;
  request: SupervisorRequest | null;
}

/** Why the student cannot pull back or cancel the active request now (null = allowed). */
export function getWithdrawBlockReason(request: SupervisorRequest, now = new Date()): string | null {
  if (WAITING_STATUSES.includes(request.status)) {
    if (request.withdrawAvailableAt && new Date(request.withdrawAvailableAt) > now) {
      return `Pengajuan bisa ditarik mulai ${formatDateTimeWib(request.withdrawAvailableAt)} (72 jam setelah dikirim).`;
    }
    return null;
  }
  if (request.status === 'accepted' || request.status === 'redirected') {
    if (request.thesis?.supervisorAssignedAt) return 'Pembimbing sudah ditetapkan; pergantian lewat Pengajuan Perubahan Tugas Akhir.';
    return null;
  }
  return 'Pembimbing sudah ditetapkan; pergantian lewat Pengajuan Perubahan Tugas Akhir.';
}

/** The short status and the one action of the Pengajuan Pembimbing card. */
export function getRequestCardState(data: StudentSupervisorRequests): RequestCardState {
  const { submission, activeRequest, draft, requests } = data;
  if (activeRequest) {
    const label = SUPERVISOR_REQUEST_STATUS_SHORT_LABELS[activeRequest.status] ?? activeRequest.status;
    if (WAITING_STATUSES.includes(activeRequest.status)) return { status: label, variant: 'warning', action: 'withdraw', message: null, request: activeRequest };
    if (activeRequest.status === 'assigned' || activeRequest.thesis?.supervisorAssignedAt) {
      return { status: label, variant: 'success', action: 'detail', message: null, request: activeRequest };
    }
    return { status: label, variant: 'success', action: 'cancel', message: null, request: activeRequest };
  }
  if (!submission.canSubmit) return { status: 'Belum Bisa Diajukan', variant: 'outline', action: null, message: submission.blockedReason, request: null };
  const last = requests[0] ?? null;
  if (submission.revisionRequested) {
    return { status: 'Perlu Revisi', variant: 'info', action: 'continue', message: 'Ketua Departemen meminta revisi isian pengajuan.', request: last };
  }
  const rejected = last && ['rejected_by_lecturer', 'rejected_by_kadep', 'closed'].includes(last.status);
  const hasDraft = Boolean(draft && (draft.proposedTitle || draft.lecturerId || draft.topicId || draft.backgroundSummary));
  return {
    status: rejected ? 'Tidak Disetujui' : hasDraft ? 'Draf Tersimpan' : 'Belum Diajukan',
    variant: rejected ? 'destructive' : 'outline',
    action: hasDraft ? 'continue' : 'submit',
    message: rejected ? 'Pengajuan sebelumnya tidak disetujui. Ajukan lagi ke dosen lain atau lewat departemen.' : null,
    request: null,
  };
}

/** "± 5 jam lagi" or "± 2 hari lagi" until `at`; null once it is reached. */
export function formatTimeLeft(at: string | Date | null | undefined, now = new Date()): string | null {
  if (!at) return null;
  const ms = new Date(at).getTime() - now.getTime();
  if (ms <= 0) return null;
  const hours = Math.ceil(ms / 3_600_000);
  return hours < 24 ? `± ${hours} jam lagi` : `± ${Math.round(hours / 24)} hari lagi`;
}

export type RequestCardButton = 'submit' | 'continue' | 'revise' | 'detail' | 'withdraw' | 'cancel';
export interface RequestCardRow {
  label: string;
  value: string;
  /** Muted text under the value (e.g. the countdown to the withdraw time). */
  hint?: string | null;
}
export interface RequestCardView {
  status: string;
  variant: RequestCardState['variant'];
  /** The not-eligible message, or a short note on an earlier refused request. */
  message: string | null;
  rows: RequestCardRow[];
  /** The Ketua Departemen's note, in the soft yellow box. */
  kadepNote: string | null;
  buttons: RequestCardButton[];
  request: SupervisorRequest | null;
  /** Why Tarik or Batalkan cannot be used yet (tooltip of the disabled button). */
  blockReason: string | null;
}

const lecturerOf = (request: SupervisorRequest) => {
  const person = request.supervisor ?? request.lecturer;
  return person?.fullName ? formatLecturerName(person.fullName) : 'Ditetapkan departemen';
};

/**
 * What the Pengajuan Pembimbing card shows, per state: label and value rows in the grid of the
 * seminar identity card, the Ketua Departemen's note, and the actions.
 */
export function getRequestCardView(data: StudentSupervisorRequests, overview?: StudentProposalOverview, now = new Date()): RequestCardView {
  const state = getRequestCardState(data);
  const request = state.request;
  const base = { status: state.status, variant: state.variant, message: null, kadepNote: null, request, blockReason: null };
  const route = request ? getSupervisorRequestRouteLabel(request.route) : '';

  if (state.action === 'withdraw' && request) {
    const lockedUntil = request.withdrawAvailableAt && new Date(request.withdrawAvailableAt) > now ? request.withdrawAvailableAt : null;
    const rows: RequestCardRow[] = [
      { label: 'Jalur', value: route },
      { label: 'Dosen tujuan', value: lecturerOf(request) },
      { label: 'Dikirim', value: formatDateTimeWib(request.createdAt) },
      { label: 'Status', value: state.status },
    ];
    if (lockedUntil) rows.push({ label: 'Bisa ditarik mulai', value: formatDateTimeWib(lockedUntil), hint: formatTimeLeft(lockedUntil, now) });
    return { ...base, rows, buttons: ['detail', 'withdraw'], blockReason: getWithdrawBlockReason(request, now) };
  }
  if (state.action === 'cancel' && request) {
    return {
      ...base,
      rows: [
        { label: 'Jalur', value: route },
        { label: 'Diterima oleh', value: lecturerOf(request) },
        { label: 'Tanggal diterima', value: formatDateTimeWib(request.reviewedAt ?? request.lecturerRespondedAt ?? request.updatedAt) },
      ],
      buttons: ['detail', 'cancel'],
      blockReason: getWithdrawBlockReason(request, now),
    };
  }
  if (state.action === 'detail' && request) {
    const assignedAt = overview?.assignment?.assignedAt ?? request.thesis?.supervisorAssignedAt ?? null;
    return {
      ...base,
      rows: [
        { label: 'Jalur', value: route },
        { label: 'Diterima tanggal', value: formatDateTimeWib(request.reviewedAt ?? request.lecturerRespondedAt ?? request.updatedAt) },
        { label: 'Ditetapkan tanggal', value: formatDateTimeWib(assignedAt) },
      ],
      buttons: ['detail'],
    };
  }
  if (state.action === null) {
    return { ...base, message: state.message, rows: [], buttons: [] };
  }
  if (data.submission.revisionRequested) {
    const last = request ?? data.requests[0] ?? null;
    return {
      ...base,
      request: last,
      rows: last ? [{ label: 'Jalur', value: getSupervisorRequestRouteLabel(last.route) }, { label: 'Status', value: state.status }] : [],
      kadepNote: last?.kadepNotes ?? null,
      buttons: ['revise'],
    };
  }

  const draft = data.draft;
  const hasDraft = state.action === 'continue';
  const rows: RequestCardRow[] = hasDraft && draft
    ? [
      { label: 'Draf disimpan', value: formatDateTimeWib(draft.updatedAt) },
      { label: 'Judul draf', value: draft.proposedTitle || '-' },
      { label: draft.lecturer ? 'Dosen di draf' : 'Jalur di draf', value: draft.lecturer?.fullName ? formatLecturerName(draft.lecturer.fullName) : 'Ditetapkan departemen' },
    ]
    : [
      { label: 'Semester', value: data.submission.academicYear?.label ?? '-' },
      { label: 'Metode Penelitian', value: data.submission.eligibleResearchMethod ? 'Terdaftar' : '-' },
    ];
  // A request refused earlier: its note (the Ketua Departemen's, or the lecturer's reason).
  const refused = data.requests[0] && ['rejected_by_lecturer', 'rejected_by_kadep', 'closed'].includes(data.requests[0].status) ? data.requests[0] : null;
  return {
    ...base,
    message: state.message,
    rows,
    kadepNote: refused?.kadepNotes ?? null,
    buttons: [hasDraft ? 'continue' : 'submit'],
    request: refused,
  };
}
