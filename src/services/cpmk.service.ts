import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export interface Cpmk {
    id: string;
    academicYearId: string | null;
    academicYear?: {
        id: string;
        semester: 'ganjil' | 'genap';
        year: string | null;
        isActive: boolean;
    } | null;
    code: string;
    description: string;
    type: 'research_method' | 'thesis';
    maxScore: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCpmkPayload {
    academicYearId?: string;
    code: string;
    description: string;
    type: 'research_method' | 'thesis';
}

export type UpdateCpmkPayload = Partial<CreateCpmkPayload>;

export const getCpmks = async (params?: { academicYearId?: string }): Promise<Cpmk[]> => {
    const queryParams = new URLSearchParams();
    if (params?.academicYearId) {
        queryParams.append('academicYearId', params.academicYearId);
    }

    const endpoint = queryParams.toString()
        ? `${API_CONFIG.ENDPOINTS.CPMK.BASE}?${queryParams.toString()}`
        : API_CONFIG.ENDPOINTS.CPMK.BASE;

    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPMK');
    }
    const result = await response.json();
    return result.data;
};

export const getCpmkById = async (id: string): Promise<Cpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPMK.BY_ID(id)));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail CPMK');
    }
    const result = await response.json();
    return result.data;
};

export const createCpmk = async (payload: CreateCpmkPayload): Promise<Cpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPMK.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data CPMK');
    }
    const result = await response.json();
    return result.data;
};

export const updateCpmk = async (id: string, payload: UpdateCpmkPayload): Promise<Cpmk> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPMK.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data CPMK');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCpmk = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPMK.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data CPMK');
    }
};
