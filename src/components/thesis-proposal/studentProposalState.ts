import { formatDateTimeWib } from '@/lib/text';
import { SUPERVISOR_REQUEST_STATUS_SHORT_LABELS } from '@/lib/thesisLabels';
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
    return [first, second, done('final', 'Proposal Final'), done('assessment', 'Penilaian Proposal', 'Lulus'), done('promotion', 'Naik ke Penelitian')];
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
    ? waiting('promotion', 'Naik ke Penelitian', WAITING_THESIS_COURSE_NOTE)
    : waiting('promotion', 'Naik ke Penelitian');
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
