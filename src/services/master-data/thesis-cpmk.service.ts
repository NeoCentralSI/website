import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

export interface ThesisCpmk {
    id: string;
    academicYearId: string;
    academicYear?: {
        id: string;
        semester: 'ganjil' | 'genap';
        year: string | null;
        isActive: boolean;
    };
    code: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        thesisSeminarAssessmentCriterias: number;
        thesisDefenceExaminerAssessmentCriterias: number;
    };
    hasAssessmentDetails?: boolean;
}

export interface CreateThesisCpmkPayload {
    academicYearId?: string;
    code: string;
    description: string;
}

export type UpdateThesisCpmkPayload = Partial<CreateThesisCpmkPayload>;

export const getThesisCpmks = async (params?: { academicYearId?: string }): Promise<ThesisCpmk[]> => {
    const queryParams = new URLSearchParams();
    if (params?.academicYearId) {
        queryParams.append('academicYearId', params.academicYearId);
    }

    const endpoint = queryParams.toString()
        ? `${API_CONFIG.ENDPOINTS.THESIS_CPMK.BASE}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.THESIS_CPMK.BASE;

    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPMK Tugas Akhir');
    }
    const result = await response.json();
    return result.data;
};

export const getThesisCpmkById = async (id: string): Promise<ThesisCpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_CPMK.BY_ID(id)));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail CPMK Tugas Akhir');
    }
    const result = await response.json();
    return result.data;
};

export const createThesisCpmk = async (payload: CreateThesisCpmkPayload): Promise<ThesisCpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_CPMK.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data CPMK Tugas Akhir');
    }
    const result = await response.json();
    return result.data;
};

export const updateThesisCpmk = async (id: string, payload: UpdateThesisCpmkPayload): Promise<ThesisCpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_CPMK.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data CPMK Tugas Akhir');
    }
    const result = await response.json();
    return result.data;
};

export const deleteThesisCpmk = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_CPMK.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data CPMK Tugas Akhir');
    }
};

export const copyThesisCpmkTemplate = async (sourceAcademicYearId: string, targetAcademicYearId: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_CPMK.BASE}/copy-template`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceAcademicYearId, targetAcademicYearId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menyalin template CPMK Tugas Akhir');
    }
};
