import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  SeminarDocument,
  SeminarDocumentType,
  ValidateDocumentPayload,
  ValidateDocumentResponse,
} from '@/types/seminar.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

/**
 * Get all available seminar document types
 */
export const getSeminarDocumentTypes = async (): Promise<SeminarDocumentType[]> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENT_TYPES));
  return parseJsonResponse(response, 'Gagal memuat tipe dokumen seminar');
};

/**
 * Get documents for a specific seminar
 */
export const getStudentSeminarDocuments = async (seminarId: string): Promise<{ seminarId: string | null; documents: SeminarDocument[] }> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat dokumen seminar');
};

/**
 * Upload a document to a seminar
 */
export const uploadSeminarDocument = async (file: File, documentTypeName: string, seminarId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const targetId = seminarId || 'active';
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(targetId)),
    {
      method: 'POST',
      body: formData,
    }
  );
  return parseJsonResponse(response, 'Gagal mengunggah dokumen seminar');
};

/**
 * Validate (approve/decline) a seminar document (Admin/Lecturer)
 */
export const validateSeminarDocument = async (
  seminarId: string,
  documentTypeId: string,
  payload: ValidateDocumentPayload
): Promise<ValidateDocumentResponse> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.VALIDATE_DOCUMENT(seminarId, documentTypeId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return parseJsonResponse(response, 'Gagal memvalidasi dokumen seminar');
};
