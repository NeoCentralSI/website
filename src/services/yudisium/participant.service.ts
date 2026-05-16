import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  AdminYudisiumParticipantsResponse,
  AdminYudisiumParticipant,
  AdminYudisiumParticipantDetailResponse,
  VerifyDocumentPayload,
  VerifyDocumentResponse,
  ParticipantCplResponse,
  ArchiveYudisiumParticipantOption,
  ArchiveYudisiumParticipantImportResult,
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

export async function getArchiveYudisiumParticipantOptions(
  yudisiumId: string
): Promise<ArchiveYudisiumParticipantOption[]> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANT_OPTIONS(yudisiumId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat opsi peserta yudisium');
  return json.data;
}

export async function addArchiveYudisiumParticipant(
  yudisiumId: string,
  thesisId: string
): Promise<AdminYudisiumParticipant> {
  const res = await apiRequest(getApiUrl(EP.PARTICIPANTS(yudisiumId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thesisId }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menambahkan peserta yudisium');
  return json.data;
}

export async function importArchiveYudisiumParticipants(
  yudisiumId: string,
  file: File
): Promise<ArchiveYudisiumParticipantImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiRequest(getApiUrl(EP.PARTICIPANTS_IMPORT(yudisiumId)), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengimpor peserta yudisium');
  return json.data;
}

export async function deleteArchiveYudisiumParticipant(
  yudisiumId: string,
  participantId: string
): Promise<{ id: string }> {
  const res = await apiRequest(getApiUrl(EP.DELETE_PARTICIPANT(yudisiumId, participantId)), {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menghapus peserta yudisium');
  return json.data;
}

export async function verifyYudisiumDocument(
  yudisiumId: string,
  participantId: string,
  requirementId: string,
  payload: VerifyDocumentPayload
): Promise<VerifyDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(EP.VERIFY_DOCUMENT(yudisiumId, participantId, requirementId)),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memverifikasi dokumen');
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

export async function validateCplScore(
  yudisiumId: string,
  participantId: string,
  cplId: string
): Promise<{ cplId: string; status: string; allCplValidated: boolean }> {
  const res = await apiRequest(getApiUrl(EP.VALIDATE_CPL(yudisiumId, participantId, cplId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi CPL');
  return json.data;
}

export async function repairCplScore(
  yudisiumId: string,
  participantId: string,
  cplId: string,
  payload: { newScore: number; oldScore: number; recommendation: File | null; settlement: File | null }
): Promise<{ cplId: string; status: string; allCplVerified: boolean }> {
  const formData = new FormData();
  formData.append('newScore', payload.newScore.toString());
  formData.append('oldScore', payload.oldScore.toString());
  if (payload.recommendation) formData.append('recommendation', payload.recommendation);
  if (payload.settlement) formData.append('settlement', payload.settlement);

  const res = await apiRequest(getApiUrl(EP.REPAIR_CPL(yudisiumId, participantId, cplId)), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan perbaikan CPL');
  return json.data;
}

export async function exportParticipants(yudisiumId: string): Promise<Blob> {
  const res = await apiRequest(getApiUrl(EP.EXPORT_PARTICIPANTS(yudisiumId)));
  if (!res.ok) throw new Error('Gagal mengunduh data peserta yudisium');
  return res.blob();
}

export async function finalizeParticipants(yudisiumId: string): Promise<any> {
  const res = await apiRequest(getApiUrl(EP.FINALIZE(yudisiumId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memfinalisasi peserta');
  return json.data;
}
