import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export type MetopenRole = 'supervisor' | 'default';

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
    appliesTo: 'proposal' | 'metopen';
    role: MetopenRole;
    displayOrder: number;
    assessmentRubrics: AssessmentRubric[];
}

export interface CpmkWithRubrics {
    id: string;
    code: string;
    description: string;
    displayOrder: number;
    assessmentCriterias: AssessmentCriteria[];
}

export interface CreateCriteriaPayload {
    cpmkId: string;
    role: MetopenRole;
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
    globalTotalScore: number;
    details: WeightSummaryDetail[];
}

async function parseResponse<T>(response: Response, fallbackMsg: string): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: fallbackMsg }));
        throw new Error(error.message || fallbackMsg);
    }
    const result = await response.json();
    return result.data;
}

export const getCpmksWithRubrics = async (role: MetopenRole): Promise<CpmkWithRubrics[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMKS(role)));
    return parseResponse<CpmkWithRubrics[]>(response, 'Gagal mengambil data CPMK rubrik Metopel');
};

export const createCriteria = async (payload: CreateCriteriaPayload): Promise<AssessmentCriteria> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseResponse<AssessmentCriteria>(response, 'Gagal menambah kriteria Metopel');
};

export const updateCriteria = async (criteriaId: string, payload: UpdateCriteriaPayload): Promise<AssessmentCriteria> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_BY_ID(criteriaId)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return parseResponse<AssessmentCriteria>(response, 'Gagal mengubah kriteria Metopel');
};

export const deleteCriteria = async (criteriaId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_BY_ID(criteriaId)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal menghapus kriteria Metopel' }));
        throw new Error(error.message || 'Gagal menghapus kriteria Metopel');
    }
};

export const removeCpmkMetopenConfig = async (cpmkId: string, role: MetopenRole): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMK_CONFIG(cpmkId, role)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal menghapus konfigurasi CPMK Metopel' }));
        throw new Error(error.message || 'Gagal menghapus konfigurasi CPMK Metopel');
    }
};

export const createRubric = async (criteriaId: string, payload: CreateRubricPayload): Promise<AssessmentRubric> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_RUBRICS(criteriaId)), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseResponse<AssessmentRubric>(response, 'Gagal menambah level rubrik Metopel');
};

export const updateRubric = async (rubricId: string, payload: UpdateRubricPayload): Promise<AssessmentRubric> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.RUBRIC_BY_ID(rubricId)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return parseResponse<AssessmentRubric>(response, 'Gagal mengubah komponen rubrik Metopel');
};

export const deleteRubric = async (rubricId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.RUBRIC_BY_ID(rubricId)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal menghapus komponen rubrik Metopel' }));
        throw new Error(error.message || 'Gagal menghapus komponen rubrik Metopel');
    }
};

export const reorderCriteria = async (cpmkId: string, orderedIds: string[]): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_REORDER), {
        method: 'PATCH',
        body: JSON.stringify({ cpmkId, orderedIds }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal mengubah urutan kriteria Metopel' }));
        throw new Error(error.message || 'Gagal mengubah urutan kriteria Metopel');
    }
};

export const reorderRubrics = async (criteriaId: string, orderedIds: string[]): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.RUBRICS_REORDER), {
        method: 'PATCH',
        body: JSON.stringify({ criteriaId, orderedIds }),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal mengubah urutan rubrik Metopel' }));
        throw new Error(error.message || 'Gagal mengubah urutan rubrik Metopel');
    }
};

export const getWeightSummary = async (role: MetopenRole): Promise<WeightSummary> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.WEIGHT_SUMMARY(role)));
    return parseResponse<WeightSummary>(response, 'Gagal mengambil ringkasan bobot Metopel');
};
