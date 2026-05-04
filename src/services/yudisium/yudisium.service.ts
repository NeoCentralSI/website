import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';

export type YudisiumStatus = 'draft' | 'open' | 'closed' | 'ongoing' | 'completed';

export interface YudisiumRequirementItem {
  id: string;
  order: number;
  requirement: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
  };
}

export interface YudisiumEvent {
  id: string;
  name: string;
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  eventDate: string | null;
  notes: string | null;
  status: YudisiumStatus;
  exitSurveyForm: { id: string; name: string } | null;
  decreeDocument?: {
    id: string;
    fileName: string | null;
    filePath: string | null;
  } | null;
  room: { id: string; name: string } | null;
  requirementItems: YudisiumRequirementItem[];
  participantCount: number;
  responseCount: number;
  hasRegisteredParticipants: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateYudisiumPayload {
  name: string;
  eventDate: string;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  notes?: string | null;
  exitSurveyFormId?: string | null;
  roomId?: string | null;
  requirementIds?: string[];
  decreeFile?: File | null;
}

export type UpdateYudisiumPayload = Partial<CreateYudisiumPayload>;

const E = API_CONFIG.ENDPOINTS.YUDISIUM;

const parseError = async (response: Response, fallbackMessage: string) => {
  const error = await response.json().catch(() => ({}));
  throw new Error((error as { message?: string }).message || fallbackMessage);
};

export interface YudisiumAnnouncementParticipant {
  id: string;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  status: string;
}

export interface YudisiumAnnouncement extends YudisiumEvent {
  participants: YudisiumAnnouncementParticipant[];
}

export const getYudisiumEvents = async (): Promise<YudisiumEvent[]> => {
  const response = await apiRequest(getApiUrl(E.BASE));
  if (!response.ok) {
    await parseError(response, 'Gagal mengambil data yudisium');
  }
  const result = await response.json();
  return result.data;
};

export const getYudisiumAnnouncements = async (): Promise<YudisiumAnnouncement[]> => {
  const response = await apiRequest(getApiUrl(E.ANNOUNCEMENTS));
  if (!response.ok) {
    await parseError(response, 'Gagal mengambil pengumuman yudisium');
  }
  const result = await response.json();
  return result.data;
};

export interface YudisiumRepositoryItem {
  id: string;
  thesisTitle: string;
  studentName: string;
  studentNim: string;
  topicName: string;
  filePath: string | null;
  fileName: string | null;
}

export interface YudisiumRepositoryPanel {
  id: string;
  name: string;
  documents: YudisiumRepositoryItem[];
}

export const getYudisiumEventById = async (id: string): Promise<YudisiumEvent> => {
  const response = await apiRequest(getApiUrl(E.BY_ID(id)));
  if (!response.ok) {
    await parseError(response, 'Gagal mengambil detail yudisium');
  }
  const result = await response.json();
  return result.data;
};

export const getYudisiumRepository = async (): Promise<YudisiumRepositoryPanel[]> => {
  const response = await apiRequest(getApiUrl(E.REPOSITORY));
  if (!response.ok) {
    await parseError(response, 'Gagal mengambil repositori yudisium');
  }
  const result = await response.json();
  return result.data;
};

const createFormData = (payload: CreateYudisiumPayload | UpdateYudisiumPayload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (key === 'requirementIds' && Array.isArray(value)) {
      formData.append(key, value.join(','));
    } else if (key === 'decreeFile' && value instanceof File) {
      formData.append('file', value);
    } else if (value === null) {
      formData.append(key, '');
    } else {
      formData.append(key, value as string);
    }
  });
  return formData;
};

export const createYudisiumEvent = async (payload: CreateYudisiumPayload): Promise<YudisiumEvent> => {
  const formData = createFormData(payload);
  const response = await apiRequest(getApiUrl(E.BASE), {
    method: 'POST',
    body: formData,
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
  const formData = createFormData(payload);
  const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
    method: 'PATCH',
    body: formData,
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
