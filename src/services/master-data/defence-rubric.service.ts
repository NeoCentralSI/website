import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

// ────────────────────────────────────────────
// Types
// ────────────────────────────────────────────

export type DefenceRole = 'examiner' | 'supervisor';

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
    appliesTo: 'defence';
    role: DefenceRole;
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

export interface CreateCriteriaPayload {
    cpmkId: string;
    role: DefenceRole;
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
    examinerTotal: number;
    supervisorTotal: number;
    combinedTotal: number;
    details: WeightSummaryDetail[];
}

// ────────────────────────────────────────────
// CPMK Listing API (per role)
// ────────────────────────────────────────────

export const getCpmksWithRubrics = async (
    role: DefenceRole,
    params?: { academicYearId?: string }
): Promise<CpmkWithRubrics[]> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CPMKS(role) + (params?.academicYearId ? `&academicYearId=${params.academicYearId}` : ''))
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPMK rubrik sidang');
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
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CRITERIA),
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah kriteria sidang');
    }
    const result = await response.json();
    return result.data;
};

export const updateCriteria = async (
    criteriaId: string,
    payload: UpdateCriteriaPayload
): Promise<AssessmentCriteria> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CRITERIA_BY_ID(criteriaId)),
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah kriteria sidang');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCriteria = async (criteriaId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CRITERIA_BY_ID(criteriaId)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus kriteria sidang');
    }
};

export const removeCpmkDefenceConfig = async (cpmkId: string, role: DefenceRole): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CPMK_CONFIG(cpmkId, role)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus konfigurasi CPMK sidang');
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
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CRITERIA_RUBRICS(criteriaId)),
        {
            method: 'POST',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah level rubrik sidang');
    }
    const result = await response.json();
    return result.data;
};

export const updateRubric = async (
    rubricId: string,
    payload: UpdateRubricPayload
): Promise<AssessmentRubric> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.RUBRIC_BY_ID(rubricId)),
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah komponen rubrik sidang');
    }
    const result = await response.json();
    return result.data;
};

export const deleteRubric = async (rubricId: string): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.RUBRIC_BY_ID(rubricId)),
        { method: 'DELETE' }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus komponen rubrik sidang');
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
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.CRITERIA_REORDER),
        {
            method: 'PATCH',
            body: JSON.stringify({ cpmkId, orderedIds }),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan kriteria sidang');
    }
};

export const reorderRubrics = async (
    criteriaId: string,
    orderedIds: string[]
): Promise<void> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.RUBRICS_REORDER),
        {
            method: 'PATCH',
            body: JSON.stringify({ criteriaId, orderedIds }),
        }
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan rubrik sidang');
    }
};

// ────────────────────────────────────────────
// Weight Summary API (per role)
// ────────────────────────────────────────────

export const getWeightSummary = async (role: DefenceRole): Promise<WeightSummary> => {
    const response = await apiRequest(
        getApiUrl(API_CONFIG.ENDPOINTS.DEFENCE_RUBRIC.WEIGHT_SUMMARY(role))
    );
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil ringkasan bobot sidang');
    }
    const result = await response.json();
    return result.data;
};
