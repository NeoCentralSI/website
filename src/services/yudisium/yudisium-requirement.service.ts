import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

export interface YudisiumRequirement {
    id: string;
    name: string;
    description: string | null;
    notes: string | null;
    order: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateYudisiumRequirementPayload {
    name: string;
    description?: string | null;
    notes?: string | null;
    order?: number;
    isActive?: boolean;
}

export type UpdateYudisiumRequirementPayload = Partial<CreateYudisiumRequirementPayload>;

const E = API_CONFIG.ENDPOINTS.YUDISIUM_REQUIREMENTS;

const parseError = async (response: Response, fallbackMessage: string) => {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || fallbackMessage);
};

export const getYudisiumRequirements = async (): Promise<YudisiumRequirement[]> => {
    const response = await apiRequest(getApiUrl(E.BASE));
    if (!response.ok) {
        await parseError(response, 'Gagal mengambil data persyaratan yudisium');
    }

    const result = await response.json();
    return result.data;
};

export const getYudisiumRequirementById = async (id: string): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)));
    if (!response.ok) {
        await parseError(response, 'Gagal mengambil detail persyaratan yudisium');
    }

    const result = await response.json();
    return result.data;
};

export const createYudisiumRequirement = async (
    payload: CreateYudisiumRequirementPayload,
): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        await parseError(response, 'Gagal menambah persyaratan yudisium');
    }

    const result = await response.json();
    return result.data;
};

export const updateYudisiumRequirement = async (
    id: string,
    payload: UpdateYudisiumRequirementPayload,
): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        await parseError(response, 'Gagal mengubah persyaratan yudisium');
    }

    const result = await response.json();
    return result.data;
};

export const toggleYudisiumRequirement = async (id: string): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.TOGGLE(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        await parseError(response, 'Gagal mengubah status persyaratan yudisium');
    }

    const result = await response.json();
    return result.data;
};

export const deleteYudisiumRequirement = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        await parseError(response, 'Gagal menghapus persyaratan yudisium');
    }
};

export const moveYudisiumRequirementToTop = async (id: string): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.MOVE_TOP(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        await parseError(response, 'Gagal memindahkan persyaratan ke urutan teratas');
    }

    const result = await response.json();
    return result.data;
};

export const moveYudisiumRequirementToBottom = async (id: string): Promise<YudisiumRequirement> => {
    const response = await apiRequest(getApiUrl(E.MOVE_BOTTOM(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        await parseError(response, 'Gagal memindahkan persyaratan ke urutan terbawah');
    }

    const result = await response.json();
    return result.data;
};
