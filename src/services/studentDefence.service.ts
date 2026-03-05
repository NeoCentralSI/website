import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  DefenceOverviewResponse,
  DefenceDocumentType,
  DefenceDocumentsResponse,
  DefenceDocumentUploadResponse,
} from '@/types/defence.types';

const EP = API_CONFIG.ENDPOINTS.THESIS_DEFENCE_STUDENT;

export async function getStudentDefenceOverview(): Promise<DefenceOverviewResponse> {
  const res = await apiRequest(getApiUrl(EP.OVERVIEW));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data sidang');
  return json.data;
}

export async function getDefenceDocumentTypes(): Promise<DefenceDocumentType[]> {
  const res = await apiRequest(getApiUrl(EP.DOCUMENT_TYPES));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat tipe dokumen');
  return json.data;
}

export async function getStudentDefenceDocuments(): Promise<DefenceDocumentsResponse> {
  const res = await apiRequest(getApiUrl(EP.DOCUMENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat dokumen sidang');
  return json.data;
}

export async function uploadDefenceDocument(
  file: File,
  documentTypeName: string
): Promise<DefenceDocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const res = await apiRequest(getApiUrl(EP.DOCUMENT_UPLOAD), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengupload dokumen');
  return json.data;
}
