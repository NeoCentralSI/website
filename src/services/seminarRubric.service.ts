import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export interface AssessmentRubric {
    id: string;
    assessmentCriteriaId: string;
    minScore: number;
    maxScore: number;
    description: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentCriteria {
    id: string;
    cpmkId: string;
    name: string | null;
    maxScore: number | null;
    appliesTo: 'seminar' | 'defence' | 'proposal';
    role: 'default' | 'examiner' | 'supervisor';
    displayOrder: number;
    hasAssessmentDetails?: boolean;
    hasSubmittedScores?: boolean;
    assessmentRubrics: AssessmentRubric[];
}

export interface CpmkWithRubrics {
    id: string;
    code: string;
    description: string;
    displayOrder: number;
    hasAssessmentDetails?: boolean;
    assessmentCriterias: AssessmentCriteria[];
}

export interface QuickAddRubricPayload {
    criteriaMaxScore: number;
    description: string;
    minScore: number;
    maxScore: number;
    criteriaName?: string;
}

export interface CreateCriteriaPayload {
    cpmkId: string;
    name?: string;
    maxScore: number;
}

export interface UpdateCriteriaPayload {
    name?: string;
    maxScore?: number;
}

export interface CreateRubricPayload {
    description: string;
    minScore: number;
    maxScore: number;
}

export type UpdateRubricPayload = Partial<CreateRubricPayload>;

export interface QuickAddRubricPayload {
    criteriaMaxScore: number;
    description: string;
    minScore: number;
    maxScore: number;
    criteriaName?: string;
}
export interface WeightSummaryDetail {
    cpmkId: string;
    cpmkCode: string;
    cpmkDescription: string;
    criteriaCount: number;
    criteriaScoreSum: number;
    rubricCount: number;
}

export interface WeightSummary {
    totalScore: number;
    isComplete: boolean;
    details: WeightSummaryDetail[];
}

// ────────────────────────────────────────────
// CPMK Listing API
// ────────────────────────────────────────────

export const getCpmksWithRubrics = async (params?: { academicYearId?: string }): Promise<CpmkWithRubrics[]> => {
    const query = new URLSearchParams();
    if (params?.academicYearId) query.set('academicYearId', params.academicYearId);
    const endpoint = query.toString()
        ? `${API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CPMKS}?${query.toString()}`
        : API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CPMKS;

    const response = await apiRequest(
        getApiUrl(endpoint)
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPMK rubrik');
    }
    const result = await response.json();
    return result.data;
};

// ────────────────────────────────────────────
// Criteria API
// ────────────────────────────────────────────

export const createCriteria = async (
    payload: CreateCriteriaPayload
): Promise<AssessmentCriteria> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CRITERIA),
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah kriteria seminar');
    }
    const result = await response.json();
    return result.data;
};

export const updateCriteria = async (
    criteriaId: string,
    payload: UpdateCriteriaPayload
): Promise<AssessmentCriteria> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CRITERIA_BY_ID(criteriaId)),
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah kriteria seminar');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCriteria = async (criteriaId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CRITERIA_BY_ID(criteriaId)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus kriteria seminar');
    }
};

export const removeCpmkSeminarConfig = async (cpmkId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CPMK_CONFIG(cpmkId)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus konfigurasi CPMK seminar');
    }
};

// ────────────────────────────────────────────
// Rubric API
// ────────────────────────────────────────────

export const createRubric = async (
    criteriaId: string,
    payload: CreateRubricPayload
): Promise<AssessmentRubric> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CRITERIA_RUBRICS(criteriaId)),
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah level rubrik');
    }
    const result = await response.json();
    return result.data;
};

export const updateRubric = async (
    rubricId: string,
    payload: UpdateRubricPayload
): Promise<AssessmentRubric> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.RUBRIC_BY_ID(rubricId)),
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah komponen rubrik');
    }
    const result = await response.json();
    return result.data;
};

export const deleteRubric = async (rubricId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.RUBRIC_BY_ID(rubricId)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus komponen rubrik');
    }
};

// ────────────────────────────────────────────
// Reorder API
// ────────────────────────────────────────────

export const reorderCriteria = async (
    cpmkId: string,
    orderedIds: string[]
): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.CRITERIA_REORDER),
        {
            method: 'PATCH',
            body: JSON.stringify({ cpmkId, orderedIds }),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan kriteria');
    }
};

export const reorderRubrics = async (
    criteriaId: string,
    orderedIds: string[]
): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.RUBRICS_REORDER),
        {
            method: 'PATCH',
            body: JSON.stringify({ criteriaId, orderedIds }),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan rubrik');
    }
};

// ────────────────────────────────────────────
// Weight Summary API
// ────────────────────────────────────────────

export const getWeightSummary = async (params?: { academicYearId?: string }): Promise<WeightSummary> => {
    const query = new URLSearchParams();
    if (params?.academicYearId) query.set('academicYearId', params.academicYearId);
    const endpoint = query.toString()
        ? `${API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.WEIGHT_SUMMARY}?${query.toString()}`
        : API_CONFIG.ENDPOINTS.SEMINAR_RUBRIC.WEIGHT_SUMMARY;

    const response = await apiRequest(
        getApiUrl(endpoint)
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil ringkasan bobot');
    }
    const result = await response.json();
    return result.data;
};
