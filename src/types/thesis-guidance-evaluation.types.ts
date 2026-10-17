import type {
  EvaluationDue,
  GuidanceEvaluationObservation,
  GuidanceEvaluationRecommendation,
  GuidanceEvaluationStatus,
  GuidanceEvaluationType,
  GuidanceEvaluationViewStatus,
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
  decision: {
    by: EvaluationPerson | null;
    notes: string | null;
    at: string | null;
    /** Lanjutan Paket E7: closed by the system when the thesis became Selesai (status Ditolak). */
    closedBySystem?: boolean;
  } | null;
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

/** A row of the Ketua Departemen's Evaluasi table, with its row status (Paket E5). */
export type EvaluationInboxRow = ThesisGuidanceEvaluation & { viewStatus: GuidanceEvaluationViewStatus };

/**
 * Tugas Akhir > Evaluasi (Ketua Departemen, Paket E5): one page, "Semua" by default and sorted
 * by status priority on the server; filtered, searched and paged there.
 */
export interface EvaluationInbox {
  data: EvaluationInboxRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  counts: { awaitingDecision: number };
}
