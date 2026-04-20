import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export interface Cpl {
    id: string;
    code: string;
    description: string;
    minimalScore: number;
    isActive: boolean;
    hasRelatedScores: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCplPayload {
    code: string;
    description: string;
    minimalScore: number;
}

export type UpdateCplPayload = Partial<CreateCplPayload>;

export const getCpls = async (): Promise<Cpl[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BASE));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data CPL');
    }
    const result = await response.json();
    return result.data;
};

export const getCplById = async (id: string): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail CPL');
    }
    const result = await response.json();
    return result.data;
};

export const createCpl = async (payload: CreateCplPayload): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data CPL');
    }
    const result = await response.json();
    return result.data;
};

export const updateCpl = async (id: string, payload: UpdateCplPayload): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data CPL');
    }
    const result = await response.json();
    return result.data;
};

export const toggleCpl = async (id: string): Promise<Cpl> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.TOGGLE(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah status CPL');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCpl = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CPL.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data CPL');
    }
};
