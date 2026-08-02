import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  SeminarDocumentType,
  SeminarRequirementsResponse,
  VerifyDocumentPayload,
  VerifyDocumentResponse,
} from '@/types/seminar.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success) {
    throw new Error(result?.message || fallbackMessage);
  }
  return result.data as T;
}

export const getSeminarDocumentTypes = async (): Promise<SeminarDocumentType[]> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENT_TYPES));
  return parseJsonResponse(response, 'Gagal memuat syarat dokumen seminar.');
};

export const getStudentSeminarDocuments = async (
  seminarId: string
): Promise<SeminarRequirementsResponse> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(seminarId))
  );
  return parseJsonResponse(response, 'Gagal memuat dokumen seminar.');
};

export const uploadSeminarDocument = async (
  file: File,
  requirementId: string,
  seminarId?: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requirementId', requirementId);

  const targetId = seminarId || 'active';
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(targetId)),
    { method: 'POST', body: formData }
  );
  return parseJsonResponse(response, 'Gagal mengunggah dokumen seminar.');
};

export const verifySeminarDocument = async (
  seminarId: string,
  requirementId: string,
  payload: VerifyDocumentPayload
): Promise<VerifyDocumentResponse> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.VERIFY_DOCUMENT(seminarId, requirementId)),
    { method: 'POST', body: JSON.stringify(payload) }
  );
  return parseJsonResponse(response, 'Gagal memverifikasi dokumen seminar.');
};
