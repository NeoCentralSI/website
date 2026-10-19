import type { ThesisBadgeVariant } from '@/lib/thesisLabels';
import type { AssessmentView, AssessorParty, MonitoringRow } from '@/types/research-method.types';

/**
 * What a row of a Metode Penelitian table needs, derived from the API data (no new
 * enum on the server). Each list below is also the order of "Semua": what needs attention first.
 */

/** Penilaian Proposal, from the side of one party (pembimbing or koordinator). */
export type AssessmentViewStatus = 'needs_score' | 'waiting_other' | 'not_ready' | 'failed' | 'passed';

export const ASSESSMENT_VIEW_STATUS_ORDER: AssessmentViewStatus[] = ['needs_score', 'waiting_other', 'not_ready', 'failed', 'passed'];

export function assessmentViewStatus(row: AssessmentView, party: AssessorParty): AssessmentViewStatus {
  if (row.isFinalized) return row.result === 'passed' ? 'passed' : 'failed';
  const own = party === 'supervisor' ? row.supervisorScore : row.coordinatorScore;
  if (own != null) return 'waiting_other';
  return row.canScore ? 'needs_score' : 'not_ready';
}

export function assessmentViewStatusLabel(status: AssessmentViewStatus, party: AssessorParty): string {
  switch (status) {
    case 'needs_score': return 'Perlu Dinilai';
    case 'waiting_other': return party === 'supervisor' ? 'Menunggu Koordinator' : 'Menunggu Pembimbing';
    case 'not_ready': return 'Belum Dapat Dinilai';
    case 'failed': return 'Tidak Lulus';
    case 'passed': return 'Lulus';
  }
}

export const ASSESSMENT_VIEW_STATUS_VARIANTS: Record<AssessmentViewStatus, ThesisBadgeVariant> = {
  needs_score: 'warning',
  waiting_other: 'info',
  not_ready: 'outline',
  failed: 'destructive',
  passed: 'success',
};

/** Monitoring Kelas: where a student of the class is in the proposal flow. */
export type ResearchMethodStage =
  | 'assessing'
  | 'no_supervisor'
  | 'requesting'
  | 'waiting_assignment'
  | 'guidance'
  | 'failed'
  | 'passed'
  | 'promoted';

export const RESEARCH_METHOD_STAGE_ORDER: ResearchMethodStage[] = [
  'assessing', 'no_supervisor', 'requesting', 'waiting_assignment', 'guidance', 'failed', 'passed', 'promoted',
];

export const RESEARCH_METHOD_STAGE_LABELS: Record<ResearchMethodStage, string> = {
  assessing: 'Penilaian Berjalan',
  no_supervisor: 'Belum Ada Pembimbing',
  requesting: 'Pengajuan Berjalan',
  waiting_assignment: 'Menunggu Penetapan',
  guidance: 'Bimbingan Proposal',
  failed: 'Tidak Lulus',
  passed: 'Lulus',
  promoted: 'Naik ke Penelitian',
};

export const RESEARCH_METHOD_STAGE_VARIANTS: Record<ResearchMethodStage, ThesisBadgeVariant> = {
  assessing: 'warning',
  no_supervisor: 'destructive',
  requesting: 'info',
  waiting_assignment: 'info',
  guidance: 'secondary',
  failed: 'destructive',
  passed: 'success',
  promoted: 'success',
};

const REQUESTING = new Set(['pending', 'under_review', 'pending_kadep', 'revision_requested']);
const ACCEPTED = new Set(['accepted', 'redirected']);

export function researchMethodStage(row: MonitoringRow): ResearchMethodStage {
  const assessment = row.assessment;
  if (assessment?.isFinalized) {
    if (assessment.result !== 'passed') return 'failed';
    return row.thesis?.status === 'research' ? 'promoted' : 'passed';
  }
  if (assessment?.finalProposalAt) return 'assessing';
  if (row.thesis?.supervisorAssignedAt) return 'guidance';
  const status = row.request?.status;
  if (status && ACCEPTED.has(status)) return 'waiting_assignment';
  if (status && REQUESTING.has(status)) return 'requesting';
  return 'no_supervisor';
}

/** "60 + 22 = 82": the two parties' scores and, once final, their sum. */
export function scoreSum(supervisor: number | null | undefined, coordinator: number | null | undefined, finalScore?: number | null): string {
  if (supervisor == null && coordinator == null) return '-';
  const part = (value: number | null | undefined) => (value == null ? '–' : String(value));
  const sum = `${part(supervisor)} + ${part(coordinator)}`;
  return finalScore != null ? `${sum} = ${finalScore}` : sum;
}
