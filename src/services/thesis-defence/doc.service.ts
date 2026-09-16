import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  DefenceDocumentType,
  DefenceRequirementsResponse,
  DefenceRequirementDocument,
  VerifyDefenceDocumentPayload,
  VerifyDefenceDocumentResponse,
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
 * Get requirements and documents for a specific defence
 */
export const getStudentDefenceDocuments = async (defenceId: string): Promise<DefenceRequirementsResponse> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENTS(defenceId)));
  return parseJsonResponse(response, 'Gagal memuat dokumen sidang');
};

/**
 * Upload a document to a defence
 */
export const uploadDefenceDocument = async (
  file: File,
  requirementId: string,
  defenceId: string = 'active'
): Promise<DefenceRequirementDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requirementId', requirementId);

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
 * Verify (approve/decline) a defence document (Admin)
 */
export const verifyDefenceDocument = async (
  defenceId: string,
  requirementId: string,
  payload: VerifyDefenceDocumentPayload
): Promise<VerifyDefenceDocumentResponse> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.VERIFY_DOCUMENT(defenceId, requirementId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return parseJsonResponse(response, 'Gagal memverifikasi dokumen sidang');
};

/**
 * Fetch authenticated document PDF Blob for protected preview / download
 */
export const fetchDefenceDocumentBlob = async (defenceId: string, requirementId: string): Promise<Blob> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.DOCUMENT_FILE(defenceId, requirementId));
  const response = await apiRequest(url, { method: 'GET' });
  if (!response.ok) {
    let message = 'Gagal memuat dokumen';
    try {
      const json = await response.json();
      message = json?.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return response.blob();
};
