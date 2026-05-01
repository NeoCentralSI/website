import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  DefenceDocumentType,
  DefenceDocumentsResponse,
  DefenceDocumentUploadResponse,
  ValidateDefenceDocumentPayload,
  ValidateDefenceDocumentResponse,
} from '@/types/defence.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

/**
 * Get all available defence document types
 */
export const getDefenceDocumentTypes = async (): Promise<DefenceDocumentType[]> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENT_TYPES));
  return parseJsonResponse(response, 'Gagal memuat tipe dokumen sidang');
};

/**
 * Get documents for a specific defence
 */
export const getStudentDefenceDocuments = async (defenceId: string): Promise<DefenceDocumentsResponse> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENTS(defenceId)));
  return parseJsonResponse(response, 'Gagal memuat dokumen sidang');
};

/**
 * Upload a document to a defence
 */
export const uploadDefenceDocument = async (
  file: File,
  documentTypeName: string,
  defenceId: string = 'active'
): Promise<DefenceDocumentUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENTS(defenceId)),
    {
      method: 'POST',
      body: formData,
    }
  );
  return parseJsonResponse(response, 'Gagal mengunggah dokumen sidang');
};

/**
 * Validate (approve/decline) a defence document (Admin)
 */
export const validateDefenceDocument = async (
  defenceId: string,
  documentTypeId: string,
  payload: ValidateDefenceDocumentPayload
): Promise<ValidateDefenceDocumentResponse> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.VALIDATE_DOCUMENT(defenceId, documentTypeId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return parseJsonResponse(response, 'Gagal memvalidasi dokumen sidang');
};
