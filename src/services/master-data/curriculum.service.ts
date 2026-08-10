import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export interface Curriculum {
    id: string;
    name: string;
    startYear: number;
    endYear: number | null;
    cplCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface GetCurriculumsParams {
    search?: string;
    page?: number;
    limit?: number;
}

export interface GetCurriculumsResponse {
    data: Curriculum[];
    total: number;
}

export interface CreateCurriculumPayload {
    name: string;
    startYear: number;
    endYear?: number | null;
}

export type UpdateCurriculumPayload = Partial<CreateCurriculumPayload>;

export const getCurriculums = async (params: GetCurriculumsParams = {}): Promise<GetCurriculumsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append('search', params.search);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const queryString = queryParams.toString();
    const url = `${getApiUrl(API_CONFIG.ENDPOINTS.CURRICULUM.BASE)}${queryString ? `?${queryString}` : ''}`;

    const response = await apiRequest(url);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil data kurikulum');
    }
    return response.json();
};

export const getCurriculumById = async (id: string): Promise<Curriculum> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CURRICULUM.BY_ID(id)));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil detail kurikulum');
    }
    const result = await response.json();
    return result.data;
};

export const createCurriculum = async (payload: CreateCurriculumPayload): Promise<Curriculum> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CURRICULUM.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah data kurikulum');
    }
    const result = await response.json();
    return result.data;
};

export const updateCurriculum = async (id: string, payload: UpdateCurriculumPayload): Promise<Curriculum> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CURRICULUM.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah data kurikulum');
    }
    const result = await response.json();
    return result.data;
};

export const deleteCurriculum = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.CURRICULUM.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus data kurikulum');
    }
};
