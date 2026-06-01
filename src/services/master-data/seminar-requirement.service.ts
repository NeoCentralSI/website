import { getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

export interface SeminarRequirement {
    id: string;
    academicYearId: string;
    code: string;
    name: string;
    description: string | null;
    isRequired: boolean;
    isActive: boolean;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSeminarRequirementPayload {
    academicYearId: string;
    code: string;
    name: string;
    description?: string;
    isRequired?: boolean;
    isActive?: boolean;
    displayOrder?: number;
}

export type UpdateSeminarRequirementPayload = Partial<Omit<CreateSeminarRequirementPayload, 'academicYearId'>>;

export const getSeminarRequirements = async (params?: { academicYearId?: string }): Promise<SeminarRequirement[]> => {
    const queryParams = new URLSearchParams();
    if (params?.academicYearId) {
        queryParams.append('academicYearId', params.academicYearId);
    }
    const endpoint = queryParams.toString()
        ? `/seminar-requirements?${queryParams.toString()}`
        : `/seminar-requirements`;

    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const getSeminarRequirementById = async (id: string): Promise<SeminarRequirement> => {
    const response = await apiRequest(getApiUrl(`/seminar-requirements/${id}`));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const createSeminarRequirement = async (payload: CreateSeminarRequirementPayload): Promise<SeminarRequirement> => {
    const response = await apiRequest(getApiUrl(`/seminar-requirements`), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const updateSeminarRequirement = async (id: string, payload: UpdateSeminarRequirementPayload): Promise<SeminarRequirement> => {
    const response = await apiRequest(getApiUrl(`/seminar-requirements/${id}`), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const deleteSeminarRequirement = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(`/seminar-requirements/${id}`), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data persyaratan');
    }
};

export const reorderSeminarRequirements = async (orderedIds: string[]): Promise<void> => {
    const response = await apiRequest(getApiUrl(`/seminar-requirements/reorder`), {
        method: 'PATCH',
        body: JSON.stringify({ orderedIds }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan persyaratan');
    }
};
