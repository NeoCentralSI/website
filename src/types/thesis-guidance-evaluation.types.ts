import type {
  EvaluationDue,
  GuidanceEvaluationObservation,
  GuidanceEvaluationRecommendation,
  GuidanceEvaluationStatus,
  GuidanceEvaluationType,
  SupervisionClock,
  ThesisActivityLevel,
  ThesisLifecycleStatus,
} from '@/lib/thesisLabels';

export interface EvaluationPerson {
  id: string;
  name: string | null;
  identityNumber: string | null;
}

export interface ThesisGuidanceEvaluation {
  id: string;
  thesisId: string;
  student: EvaluationPerson | null;
  thesisTitle: string | null;
  /** Pembimbing 1 who filled the evaluation. */
  supervisor: EvaluationPerson | null;
  evaluationType: GuidanceEvaluationType;
  stage: EvaluationDue;
  recommendation: GuidanceEvaluationRecommendation;
  status: GuidanceEvaluationStatus;
  /** False for "Lanjut Bimbingan", which is recorded without the Ketua Departemen. */
  requiresKadep: boolean;
  observations: Record<GuidanceEvaluationObservation, boolean>;
  notes: string | null;
  /** Basis of the evaluation, copied when it was filled. */
  basis: { guidanceCount: number; supervisionStartedAt: string | null; elapsedDays: number | null };
  extensionUntil: string | null;
  decision: { by: EvaluationPerson | null; notes: string | null; at: string | null } | null;
  createdAt: string;
}

/** What a thesis page shows about guidance evaluations. */
export interface ThesisGuidanceEvaluationContext {
  thesis: { id: string; title: string | null; status: ThesisLifecycleStatus; student: EvaluationPerson | null } | null;
  viewerRole: 'student' | 'pembimbing_1' | 'pembimbing_2' | 'department' | null;
  /** Filled by the system and read-only in the form. */
  basis: {
    guidanceCount: number;
    supervisionStartedAt: string | null;
    elapsedDays: number | null;
    elapsedLabel: string;
    startSemester: string | null;
    activityLevel: ThesisActivityLevel | null;
  } | null;
  supervisionClock?: SupervisionClock;
  /** The evaluation that is due now; null when none is. */
  stage: EvaluationDue | null;
  allowedRecommendations: GuidanceEvaluationRecommendation[];
  canSubmit: boolean;
  /** Why "Isi Evaluasi" is disabled; null when it is available. */
  blockReason: string | null;
  openEvaluation: ThesisGuidanceEvaluation | null;
  history: ThesisGuidanceEvaluation[];
  /** Running academic warning with its extension deadline. */
  academicWarning: { extensionUntil: string; followUpDue: boolean } | null;
}

export interface SubmitEvaluationDto {
  thesisId: string;
  stage?: EvaluationDue;
  recommendation: GuidanceEvaluationRecommendation;
  observations: Partial<Record<GuidanceEvaluationObservation, boolean>>;
  notes?: string | null;
}

export interface DepartmentEvaluations {
  data: ThesisGuidanceEvaluation[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

/** Paket E4 (4.3): a supervised thesis whose evaluation is due and not filled yet. */
export interface SupervisorEvaluationDue {
  thesis: { id: string; title: string | null; status: ThesisLifecycleStatus; student: EvaluationPerson | null };
  viewerRole: ThesisGuidanceEvaluationContext['viewerRole'];
  stage: EvaluationDue;
  supervision: { startedAt: string | null; elapsedDays: number | null; elapsedLabel: string | null };
  canSubmit: boolean;
  /** Why "Isi Evaluasi" is disabled for this viewer (e.g. only Pembimbing 1 fills it). */
  blockReason: string | null;
}

/** Lanjutan Paket E4: filters of Tugas Akhir > Evaluasi, filtered and paged on the server. */
export type EvaluationScope = 'action' | 'kadep' | 'history';

/** A due evaluation not filled yet, or a filled evaluation. */
export type EvaluationRow =
  | { kind: 'due'; id: string; due: SupervisorEvaluationDue }
  | { kind: 'evaluation'; id: string; evaluation: ThesisGuidanceEvaluation };

export interface EvaluationInbox {
  data: EvaluationRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  /** Rows per open filter, for the filter labels. */
  counts: { action: number; kadep: number };
  viewer: { isKadep: boolean; isSupervisor: boolean };
}

/** GET /thesis-guidance-evaluations/lecturer: what the Evaluasi page shows a supervisor. */
export interface SupervisorEvaluations {
  due: SupervisorEvaluationDue[];
  evaluations: ThesisGuidanceEvaluation[];
}
