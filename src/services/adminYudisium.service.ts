import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AdminYudisiumEvent,
  AdminYudisiumParticipantsResponse,
  AdminYudisiumParticipantDetailResponse,
  ValidateDocumentPayload,
  ValidateDocumentResponse,
} from '@/types/adminYudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM_ADMIN;

export async function getAdminYudisiumEvents(): Promise<AdminYudisiumEvent[]> {
  const res = await apiRequest(getApiUrl(EP.EVENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar yudisium');
  return json.data;
}

export async function getAdminYudisiumParticipants(
  yudisiumId: string
): Promise<AdminYudisiumParticipantsResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANTS(yudisiumId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat peserta yudisium');
  return json.data;
}

export async function getAdminYudisiumParticipantDetail(
  participantId: string
): Promise<AdminYudisiumParticipantDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANT_DETAIL(participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail peserta');
  return json.data;
}

export async function validateYudisiumDocument(
  participantId: string,
  requirementId: string,
  payload: ValidateDocumentPayload
): Promise<ValidateDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(EP.VALIDATE_DOCUMENT(participantId, requirementId)),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi dokumen');
  return json.data;
}
