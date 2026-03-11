import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';

const E = API_CONFIG.ENDPOINTS.ASSESSMENT;

// ── Types ────────────────────────────────────────────────────────────

export interface AssessmentCriteriaItem {
  id: string;
  code: string;
  name: string;
  maxWeight: number;
  description?: string;
}

export interface ScoreSubmissionDto {
  scores: Array<{
    criteriaId: string;
    score: number;
  }>;
}

export interface ScoringQueueItem {
  thesisId: string;
  studentName: string;
  studentNim: string;
  proposedTitle: string;
  supervisorName?: string;
  existingScore?: number | null;
  isScored: boolean;
}

export interface AssessmentResult {
  thesisId: string;
  supervisorScore: number;
  metopenLecturerScore: number;
  finalScore: number;
  isPassed: boolean;
}

// ── Service ──────────────────────────────────────────────────────────

export const assessmentService = {
  // Get assessment criteria by form code (TA-03A or TA-03B)
  getCriteria: async (
    formCode: 'TA-03A' | 'TA-03B',
  ): Promise<AssessmentCriteriaItem[]> => {
    const res = await apiRequest(getApiUrl(E.CRITERIA(formCode)));
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal memuat kriteria penilaian');
    }
    const json = await res.json();
    return json.data;
  },

  // Supervisor: get queue of students to score (TA-03A)
  getSupervisorScoringQueue: async (): Promise<ScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SCORING_QUEUE));
    if (!res.ok) throw new Error('Gagal memuat antrian penilaian');
    const json = await res.json();
    return json.data;
  },

  // Supervisor: submit TA-03A scores
  submitSupervisorScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<void> => {
    const res = await apiRequest(getApiUrl(E.SUPERVISOR_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian');
    }
  },

  // Metopen Lecturer: get queue (TA-03B)
  getMetopenScoringQueue: async (): Promise<ScoringQueueItem[]> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SCORING_QUEUE));
    if (!res.ok) throw new Error('Gagal memuat antrian penilaian Metopen');
    const json = await res.json();
    return json.data;
  },

  // Metopen Lecturer: submit TA-03B scores
  submitMetopenScore: async (
    thesisId: string,
    dto: ScoreSubmissionDto,
  ): Promise<void> => {
    const res = await apiRequest(getApiUrl(E.METOPEN_SUBMIT_SCORE(thesisId)), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Gagal menyimpan penilaian Metopen');
    }
  },

  // Metopen Lecturer: publish final combined score
  publishFinalScore: async (thesisId: string): Promise<AssessmentResult> => {
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
