import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { 
  LecturerAudienceItem, 
  AdminThesisSeminarAudienceStudentOption,
  AdminThesisSeminarAudienceImportResult
} from '@/types/seminar.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

// ============================================================
// Student — Self Registration
// ============================================================

export const registerToSeminar = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)), {
    method: 'POST',
  });
  return parseJsonResponse(response, 'Gagal mendaftar seminar');
};

export const cancelSeminarRegistration = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCE_BY_ID(seminarId, 'me')), {
    method: 'DELETE',
  });
  return parseJsonResponse(response, 'Gagal membatalkan pendaftaran');
};

// ============================================================
// Management — List & Approval (Lecturer/Admin)
// ============================================================

export async function getSeminarAudiences(seminarId: string): Promise<LecturerAudienceItem[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat daftar hadir');
}

export const getAdminThesisSeminarAudiences = getSeminarAudiences;

export async function approveAudience(seminarId: string, studentId: string): Promise<void> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.APPROVE_AUDIENCE(seminarId, studentId)), {
    method: 'PUT',
  });
  return parseJsonResponse(res, 'Gagal menyetujui kehadiran');
}

export async function unapproveAudience(seminarId: string, studentId: string): Promise<void> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.UNAPPROVE_AUDIENCE(seminarId, studentId)), {
    method: 'PUT',
  });
  return parseJsonResponse(res, 'Gagal membatalkan persetujuan');
}

export async function toggleAudiencePresence(
  seminarId: string,
  studentId: string,
  isPresent: boolean,
): Promise<void> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.TOGGLE_AUDIENCE_PRESENCE(seminarId, studentId)), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPresent }),
  });
  return parseJsonResponse(res, 'Gagal mengubah status kehadiran');
}

// ============================================================
// Admin — Audience Management
// ============================================================

export async function getAdminThesisSeminarAudienceStudentOptions(
  seminarId: string
): Promise<AdminThesisSeminarAudienceStudentOption[]> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_OPTIONS(seminarId))
  );
  return parseJsonResponse(response, 'Gagal memuat opsi mahasiswa audience');
}

export async function addAdminThesisSeminarAudience(seminarId: string, studentId: string) {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)), {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
  return parseJsonResponse(response, 'Gagal menambahkan audience seminar');
}

export async function removeAdminThesisSeminarAudience(seminarId: string, studentId: string) {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCE_BY_ID(seminarId, studentId)),
    { method: 'DELETE' }
  );
  return parseJsonResponse(response, 'Gagal menghapus audience seminar');
}

export async function importAdminThesisSeminarAudiences(
  seminarId: string,
  file: File
): Promise<AdminThesisSeminarAudienceImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_IMPORT(seminarId)),
    { method: 'POST', body: formData }
  );
  return parseJsonResponse(response, 'Gagal mengimpor audience seminar');
}

export async function downloadAdminThesisSeminarAudienceTemplate(seminarId: string) {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_TEMPLATE(seminarId))
  );
  if (!response.ok) throw new Error('Gagal mengunduh template audience seminar');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Audience_Seminar.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportAdminThesisSeminarAudiences(seminarId: string) {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_EXPORT(seminarId))
  );
  if (!response.ok) throw new Error('Gagal mengekspor audience seminar');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Audience_Seminar_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
