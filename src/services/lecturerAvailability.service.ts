import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export interface LecturerAvailability {
    id: string;
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAvailabilityPayload {
    day: string;
    startTime: string;
    endTime: string;
    validFrom: string;
    validUntil: string;
}

export type UpdateAvailabilityPayload = Partial<CreateAvailabilityPayload>;

export const getMyAvailabilities = async (): Promise<LecturerAvailability[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.LECTURER_AVAILABILITY.BASE));
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengambil jadwal ketersediaan');
    }
    const result = await response.json();
    return result.data;
};

export const createAvailability = async (payload: CreateAvailabilityPayload): Promise<LecturerAvailability> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.LECTURER_AVAILABILITY.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menambah jadwal ketersediaan');
    }
    const result = await response.json();
    return result.data;
};

export const updateAvailability = async (id: string, payload: UpdateAvailabilityPayload): Promise<LecturerAvailability> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.LECTURER_AVAILABILITY.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah jadwal ketersediaan');
    }
    const result = await response.json();
    return result.data;
};

export const toggleAvailability = async (id: string): Promise<LecturerAvailability> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.LECTURER_AVAILABILITY.TOGGLE(id)), {
        method: 'PATCH',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal mengubah status jadwal');
    }
    const result = await response.json();
    return result.data;
};

export const deleteAvailability = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.LECTURER_AVAILABILITY.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal menghapus jadwal ketersediaan');
    }
};
