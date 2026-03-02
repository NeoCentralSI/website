import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  SeminarOverviewResponse,
  AttendanceHistoryResponse,
  SeminarDocumentType,
  SeminarDocumentsResponse,
  SeminarDocumentUploadResponse,
} from '@/types/seminar.types';

/**
 * Get student seminar overview (checklist, status, documents)
 */
export async function getStudentSeminarOverview(): Promise<SeminarOverviewResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.OVERVIEW)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar');
  return json.data;
}

/**
 * Get student seminar attendance history
 */
export async function getStudentAttendanceHistory(): Promise<AttendanceHistoryResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.ATTENDANCE)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat kehadiran');
  return json.data;
}

/**
 * Get seminar document types
 */
export async function getSeminarDocumentTypes(): Promise<SeminarDocumentType[]> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENT_TYPES)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat tipe dokumen');
  return json.data;
}

/**
 * Get all student seminar documents
 */
export async function getStudentSeminarDocuments(): Promise<SeminarDocumentsResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENTS)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat dokumen seminar');
  return json.data;
}

/**
 * Upload a seminar document
 */
export async function uploadSeminarDocument(
  file: File,
  documentTypeName: string
): Promise<SeminarDocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENT_UPLOAD),
    {
      method: 'POST',
      body: formData,
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengupload dokumen');
  return json.data;
}
