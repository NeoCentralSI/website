import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  AdminYudisiumParticipantsResponse,
  AdminYudisiumParticipantDetailResponse,
  ValidateDocumentPayload,
  ValidateDocumentResponse,
  ParticipantCplResponse,
} from '@/types/admin-yudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM;

export async function getYudisiumParticipants(
  yudisiumId: string
): Promise<AdminYudisiumParticipantsResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANTS(yudisiumId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat peserta yudisium');
  return json.data;
}

export async function getYudisiumParticipantDetail(
  yudisiumId: string,
  participantId: string
): Promise<AdminYudisiumParticipantDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANT_DETAIL(yudisiumId, participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail peserta');
  return json.data;
}

export async function getYudisiumParticipantRequirements(
  yudisiumId: string,
  participantId: string
): Promise<AdminYudisiumParticipantDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANT_REQUIREMENTS(yudisiumId, participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat persyaratan peserta');
  return json.data;
}

export async function validateYudisiumDocument(
  yudisiumId: string,
  participantId: string,
  requirementId: string,
  payload: ValidateDocumentPayload
): Promise<ValidateDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(EP.VALIDATE_DOCUMENT(yudisiumId, participantId, requirementId)),
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

export async function getParticipantCplScores(
  yudisiumId: string,
  participantId: string
): Promise<ParticipantCplResponse> {
  const res = await apiRequest(getApiUrl(EP.CPL_SCORES(yudisiumId, participantId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data CPL');
  return json.data;
}

export async function verifyCplScore(
  yudisiumId: string,
  participantId: string,
  cplId: string
): Promise<{ cplId: string; status: string; allCplVerified: boolean }> {
  const res = await apiRequest(getApiUrl(EP.VERIFY_CPL(yudisiumId, participantId, cplId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi CPL');
  return json.data;
}

export async function createCplRecommendation(
  yudisiumId: string,
  participantId: string,
  payload: { cplId: string; recommendation: string; description: string }
): Promise<{ id: string; status: string }> {
  const res = await apiRequest(getApiUrl(EP.CREATE_CPL_RECOMMENDATION(yudisiumId, participantId)), {
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
