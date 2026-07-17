import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import { unwrapApiArray, unwrapApiValue } from '@/lib/apiResponse';

export type MetopenRole = 'supervisor' | 'default';

export interface MetopenAssessmentRubric {
    id: string;
    metopenAssessmentCriteriaId: string;
    minScore: number;
    maxScore: number;
    description: string;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface MetopenAssessmentCriteria {
    id: string;
    metopenCpmkId: string;
    name: string | null;
    maxScore: number | null;
    role: MetopenRole;
    displayOrder: number;
    metopenAssessmentRubrics: MetopenAssessmentRubric[];
}

export interface MetopenCpmkWithRubrics {
    id: string;
    code: string;
    description: string;
    metopenAssessmentCriterias: MetopenAssessmentCriteria[];
}

export interface MetopenCpmk {
    id: string;
    code: string;
    description: string;
    academicYearId: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        metopenAssessmentCriterias: number;
    };
}

export interface CreateMetopenCpmkPayload {
    code: string;
    description: string;
    academicYearId?: string;
}

export interface UpdateMetopenCpmkPayload {
    code?: string;
    description?: string;
}

export interface CreateCriteriaPayload {
    metopenCpmkId: string;
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
    const result: unknown = await response.json();
    return unwrapApiValue<T>(result);
}

async function parseArrayResponse<T>(response: Response, fallbackMsg: string, keys: string[] = []): Promise<T[]> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: fallbackMsg }));
        throw new Error(error.message || fallbackMsg);
    }
    const result: unknown = await response.json();
    return unwrapApiArray<T>(result, keys);
}

export const getCpmksWithRubrics = async (role: MetopenRole): Promise<MetopenCpmkWithRubrics[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMKS(role)));
    return parseArrayResponse<MetopenCpmkWithRubrics>(response, 'Gagal mengambil data CPMK rubrik Metopel', ['cpmks']);
};

export const getAllMetopenCpmks = async (): Promise<MetopenCpmk[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMKS_ALL));
    return parseArrayResponse<MetopenCpmk>(response, 'Gagal mengambil daftar CPMK Metopel', ['cpmks', 'metopenCpmks']);
};

export const createMetopenCpmk = async (payload: CreateMetopenCpmkPayload): Promise<MetopenCpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMKS_CREATE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenCpmk>(response, 'Gagal menambah CPMK Metopel');
};

export const updateMetopenCpmk = async (
    cpmkId: string,
    payload: UpdateMetopenCpmkPayload,
): Promise<MetopenCpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMK_BY_ID(cpmkId)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenCpmk>(response, 'Gagal mengubah CPMK Metopel');
};

export const deleteMetopenCpmk = async (cpmkId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CPMK_BY_ID(cpmkId)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Gagal menghapus CPMK Metopel' }));
        throw new Error(error.message || 'Gagal menghapus CPMK Metopel');
    }
};

export const createCriteria = async (payload: CreateCriteriaPayload): Promise<MetopenAssessmentCriteria> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenAssessmentCriteria>(response, 'Gagal menambah kriteria Metopel');
};

export const updateCriteria = async (criteriaId: string, payload: UpdateCriteriaPayload): Promise<MetopenAssessmentCriteria> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_BY_ID(criteriaId)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenAssessmentCriteria>(response, 'Gagal mengubah kriteria Metopel');
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

export const createRubric = async (criteriaId: string, payload: CreateRubricPayload): Promise<MetopenAssessmentRubric> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.CRITERIA_RUBRICS(criteriaId)), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenAssessmentRubric>(response, 'Gagal menambah level rubrik Metopel');
};

export const updateRubric = async (rubricId: string, payload: UpdateRubricPayload): Promise<MetopenAssessmentRubric> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.RUBRIC_METOPEN.RUBRIC_BY_ID(rubricId)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    return parseResponse<MetopenAssessmentRubric>(response, 'Gagal mengubah komponen rubrik Metopel');
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
