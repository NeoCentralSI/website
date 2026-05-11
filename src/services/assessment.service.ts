import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';

const E = API_CONFIG.ENDPOINTS.ASSESSMENT;

// ── Types ────────────────────────────────────────────────────────────

export interface AssessmentCriteriaItem {
  id: string;
  code?: string;
  name: string | null;
  maxWeight?: number;
  maxScore: number | null;
  displayOrder: number;
  description?: string;
  cpmk: { id: string; code: string; description: string } | null;
  assessmentRubrics: AssessmentRubricItem[];
}

export interface AssessmentRubricItem {
  id: string;
  minScore: number;
  maxScore: number;
  description: string;
  displayOrder: number;
}

export type RubricCriteriaItem = AssessmentCriteriaItem;

export interface ScoreSubmissionDto {
  scores: Array<{
    criteriaId: string;
    rubricId?: string;
    score: number;
  }>;
}

export interface ScoringQueueItem {
  thesisId: string;
  studentName: string;
  studentNim: string;
  proposedTitle: string;
  supervisorName?: string;
  supervisorScore?: number | null;
  existingScore?: number | null;
  isScored: boolean;
}

export interface ResearchMethodScoreResult {
  id: string;
  thesisId: string;
  supervisorId?: string | null;
  supervisorScore?: number | null;
  lecturerId?: string | null;
  lecturerScore?: number | null;
  finalScore?: number | null;
  isFinalized?: boolean;
  finalizedBy?: string | null;
  finalizedAt?: string | null;
  calculatedAt?: string | null;
  /** BR-20: identitas Pembimbing 2 yang melakukan co-sign (lecturerId) */
  coSignedByLecturerId?: string | null;
  coSignedAt?: string | null;
  coSignNote?: string | null;
}

export interface ResearchMethodScoreDetailItem {
  assessmentCriteriaId: string;
  assessmentRubricId?: string | null;
  score: number;
  criteria?: {
    id: string;
    name?: string | null;
    maxScore?: number | null;
    cpmk?: { code?: string | null; description?: string | null } | null;
  } | null;
  assessmentRubric?: {
    id: string;
    minScore: number;
    maxScore: number;
    description?: string | null;
  } | null;
}

export interface ResearchMethodScoreWithDetails extends ResearchMethodScoreResult {
  researchMethodScoreDetails?: ResearchMethodScoreDetailItem[];
  coSigner?: {
    id: string;
    user?: { id: string; fullName?: string | null } | null;
  } | null;
}

/**
 * BR-20: Klasifikasi role pembimbing yang sedang membuka card.
 * - P1 → form full edit rubrik (master pengisi)
 * - P2 → read + tombol co-sign
 * - null → bukan pembimbing aktif (read-only summary)
 */
export interface SupervisorContext {
  role: 'P1' | 'P2' | null;
  hasP2: boolean;
}

type QueueApiItem = {
  thesisId: string;
  thesisTitle?: string | null;
  student?: {
    id?: string | null;
    fullName?: string | null;
    identityNumber?: string | null;
  } | null;
  supervisorName?: string | null;
  supervisorScore?: number | null;
  lecturerScore?: number | null;
};

type CriteriaApiResponse = {
  formCode: 'TA-03A' | 'TA-03B';
  criteria: RubricCriteriaItem[];
};

function mapQueueItem(
  item: QueueApiItem,
  scoreField: 'supervisorScore' | 'lecturerScore',
): ScoringQueueItem {
  const currentScore = item[scoreField] ?? null;
  return {
    thesisId: item.thesisId,
    studentName: item.student?.fullName ?? '-',
    studentNim: item.student?.identityNumber ?? '-',
    proposedTitle: item.thesisTitle ?? '-',
    supervisorName: item.supervisorName ?? undefined,
    supervisorScore: item.supervisorScore ?? null,
    existingScore: currentScore,
    isScored: currentScore != null,
  };
}

// ── Service ──────────────────────────────────────────────────────────

export const assessmentService = {
  // Get assessment criteria by form code (TA-03A or TA-03B)
  getCriteria: async (
    formCode: 'TA-03A' | 'TA-03B',
  ): Promise<RubricCriteriaItem[]> => {
    const res = await apiRequest(getApiUrl(E.CRITERIA(formCode)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat kriteria penilaian');
    }
    const json = await res.json() as { data: CriteriaApiResponse };
    return json.data.criteria;
  },

  // Supervisor: get queue of students to score (TA-03A)
  getSupervisorScoringQueue: async (): Promise<ScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SCORING_QUEUE));
    if (!res.ok) throw new Error('Gagal memuat antrian penilaian');
    const json = await res.json();
    return (json.data as QueueApiItem[]).map((item) =>
      mapQueueItem(item, 'supervisorScore'),
    );
  },

  // Supervisor: submit TA-03A scores (Pembimbing 1 master)
  submitSupervisorScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  // BR-20: Pembimbing 2 co-sign endpoint
  coSignSupervisorScore: async (
    thesisId: string,
    note?: string | null,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_CO_SIGN(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note ?? null }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal melakukan co-sign');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  // BR-20: ambil klasifikasi role caller untuk thesis tertentu
  getSupervisorContext: async (thesisId: string): Promise<SupervisorContext> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_CONTEXT(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat konteks pembimbing');
    }
    const json = await res.json() as { data: SupervisorContext };
    return json.data;
  },

  // BR-20: ambil score detail (termasuk co-sign + per-CPMK detail)
  getSupervisorScoreDetail: async (
    thesisId: string,
  ): Promise<ResearchMethodScoreWithDetails | null> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_GET_SCORE(thesisId)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat detail penilaian');
    }
    const json = await res.json() as { data: ResearchMethodScoreWithDetails | null };
    return json.data;
  },

  // Metopen Lecturer: get queue (TA-03B)
  getMetopenScoringQueue: async (): Promise<ScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SCORING_QUEUE));
    if (!res.ok) throw new Error('Gagal memuat antrian penilaian Metopen');
    const json = await res.json();
    return (json.data as QueueApiItem[]).map((item) =>
      mapQueueItem(item, 'lecturerScore'),
    );
  },

  // Metopen Lecturer: submit TA-03B scores
  submitMetopenScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian Metopen');
    }
    const json = await res.json() as { data: ResearchMethodScoreResult };
    return json.data;
  },

  // Metopen Lecturer: publish final combined score
  publishFinalScore: async (thesisId: string): Promise<ResearchMethodScoreResult> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_PUBLISH(thesisId)), {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal mempublikasikan nilai akhir');
    }
    const json = await res.json();
    return json.data;
  },
};
