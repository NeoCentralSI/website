import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

export type YudisiumStatus = 'draft' | 'open' | 'closed' | 'in_review' | 'finalized';

export interface YudisiumEvent {
    id: string;
    name: string;
    registrationOpenDate: string | null;
    registrationCloseDate: string | null;
    eventDate: string | null;
    notes: string | null;
    status: YudisiumStatus;
    exitSurveyForm: { id: string; name: string } | null;
    room: { id: string; name: string } | null;
    participantCount: number;
    responseCount: number;
    canDelete: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateYudisiumPayload {
    name: string;
    registrationOpenDate: string;
    registrationCloseDate: string;
    eventDate?: string | null;
    notes?: string | null;
    exitSurveyFormId?: string | null;
    roomId?: string | null;
}

export type UpdateYudisiumPayload = CreateYudisiumPayload;

const E = API_CONFIG.ENDPOINTS.YUDISIUM_EVENT;

const parseError = async (response: Response, fallbackMessage: string) => {
    const error = await response.json().catch(() => ({}));
    throw new Error((error as { message?: string }).message || fallbackMessage);
};

export const getYudisiumEvents = async (): Promise<YudisiumEvent[]> => {
    const response = await apiRequest(getApiUrl(E.BASE));
    if (!response.ok) {
        await parseError(response, 'Gagal mengambil data yudisium');
    }
    const result = await response.json();
    return result.data;
};

export const getYudisiumEventById = async (id: string): Promise<YudisiumEvent> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)));
    if (!response.ok) {
        await parseError(response, 'Gagal mengambil detail yudisium');
    }
    const result = await response.json();
    return result.data;
};

export const createYudisiumEvent = async (payload: CreateYudisiumPayload): Promise<YudisiumEvent> => {
    const response = await apiRequest(getApiUrl(E.BASE), {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        await parseError(response, 'Gagal menambah data yudisium');
    }
    const result = await response.json();
    return result.data;
};

export const updateYudisiumEvent = async (
    id: string,
    payload: UpdateYudisiumPayload,
): Promise<YudisiumEvent> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        await parseError(response, 'Gagal mengubah data yudisium');
    }
    const result = await response.json();
    return result.data;
};

export const deleteYudisiumEvent = async (id: string): Promise<void> => {
    const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
        method: 'DELETE',
    });
    if (!response.ok) {
        await parseError(response, 'Gagal menghapus data yudisium');
    }
};
