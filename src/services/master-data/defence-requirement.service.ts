import { getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

export interface DefenceRequirement {
    id: string;
    academicYearId: string;
    name: string;
    description: string | null;
    displayOrder: number;
    createdAt: string;
    updatedAt: string;
    hasRelatedData?: boolean;
}

export interface CreateDefenceRequirementPayload {
    academicYearId: string;
    name: string;
    description?: string;
}

export type UpdateDefenceRequirementPayload = Partial<Omit<CreateDefenceRequirementPayload, 'academicYearId'>>;

export const getDefenceRequirements = async (params?: { academicYearId?: string }): Promise<DefenceRequirement[]> => {
    const queryParams = new URLSearchParams();
    if (params?.academicYearId) {
        queryParams.append('academicYearId', params.academicYearId);
    }
    const endpoint = queryParams.toString()
        ? `/defence-requirements?${queryParams.toString()}`
        : `/defence-requirements`;

    const response = await apiRequest(getApiUrl(endpoint));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const getDefenceRequirementById = async (id: string): Promise<DefenceRequirement> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements/${id}`));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail persyaratan');
    }
    const result = await response.json();
    return result.data;
};

export const createDefenceRequirement = async (payload: CreateDefenceRequirementPayload): Promise<DefenceRequirement> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements`), {
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

export const updateDefenceRequirement = async (id: string, payload: UpdateDefenceRequirementPayload): Promise<DefenceRequirement> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements/${id}`), {
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

export const deleteDefenceRequirement = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements/${id}`), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data persyaratan');
    }
};

export const reorderDefenceRequirements = async (academicYearId: string, orderedIds: string[]): Promise<void> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements/reorder`), {
        method: 'PATCH',
        body: JSON.stringify({ academicYearId, orderedIds }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah urutan persyaratan');
    }
};

export const copyDefenceRequirementTemplate = async (sourceAcademicYearId: string, targetAcademicYearId: string): Promise<DefenceRequirement[]> => {
    const response = await apiRequest(getApiUrl(`/defence-requirements/copy-template`), {
        method: 'POST',
        body: JSON.stringify({ sourceAcademicYearId, targetAcademicYearId }),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menyalin template persyaratan');
    }
    const result = await response.json();
    return result.data;
};
