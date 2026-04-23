import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AdminYudisiumEvent,
  AdminYudisiumParticipantDetailResponse,
  AdminYudisiumParticipantsResponse,
  ParticipantCplResponse,
} from '@/types/admin-yudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM_LECTURER;

export async function getLecturerYudisiumEvents(): Promise<AdminYudisiumEvent[]> {
  const res = await apiRequest(getApiUrl(EP.EVENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar yudisium');
  return json.data;
}

export async function getLecturerYudisiumParticipants(
  yudisiumId: string
): Promise<AdminYudisiumParticipantsResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANTS(yudisiumId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar peserta yudisium');
  return json.data;
}

export async function getLecturerYudisiumParticipantDetail(
  participantId: string
): Promise<AdminYudisiumParticipantDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANT_DETAIL(participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail peserta yudisium');
  return json.data;
}

export async function getParticipantCplScores(
  participantId: string
): Promise<ParticipantCplResponse> {
  const res = await apiRequest(getApiUrl(EP.CPL_SCORES(participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data CPL');
  return json.data;
}

export async function verifyCplScore(
  participantId: string,
  cplId: string
): Promise<{ cplId: string; status: string; allCplVerified: boolean }> {
  const res = await apiRequest(getApiUrl(EP.VERIFY_CPL(participantId, cplId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi CPL');
  return json.data;
}

export async function createCplRecommendation(
  participantId: string,
  payload: { cplId: string; recommendation: string; description: string }
): Promise<{ id: string; status: string }> {
  const res = await apiRequest(getApiUrl(EP.CREATE_CPL_RECOMMENDATION(participantId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membuat rekomendasi CPL');
  return json.data;
}

export async function updateCplRecommendationStatus(
  recommendationId: string,
  action: 'resolve' | 'unresolve'
): Promise<{ id: string; status: string }> {
  const res = await apiRequest(getApiUrl(EP.UPDATE_CPL_RECOMMENDATION_STATUS(recommendationId)), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengubah status rekomendasi');
  return json.data;
}

export async function downloadDraftSk(yudisiumId: string): Promise<Blob> {
  const res = await apiRequest(getApiUrl(EP.DRAFT_SK(yudisiumId)));
  if (!res.ok) throw new Error('Gagal mengunduh draft SK');
  return res.blob();
}

export async function uploadSkResmi(
  yudisiumId: string,
  payload: { file: File; eventDate: string; decreeNumber: string; decreeIssuedAt: string }
): Promise<{ documentId: string; fileName: string }> {
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('eventDate', payload.eventDate);
  formData.append('decreeNumber', payload.decreeNumber);
  formData.append('decreeIssuedAt', payload.decreeIssuedAt);

  const res = await apiRequest(getApiUrl(EP.UPLOAD_SK(yudisiumId)), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengunggah SK');
  return json.data;
}
