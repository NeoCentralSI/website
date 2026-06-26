import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  AdminDefenceListItem,
  AdminDefenceDetailResponse,
  LecturerDefenceDetailResponse,
  StudentDefenceDetailResponse,
  StudentDefenceAssessmentResponse,
  AssignmentDefenceItem,
  ExaminerDefenceRequestItem,
  SupervisedStudentDefenceItem,
  DefenceAssessmentFormResponse,
  SubmitDefenceAssessmentPayload,
  SubmitDefenceAssessmentResponse,
  DefenceFinalizationDataResponse,
  FinalizeDefencePayload,
  FinalizeDefenceResponse,
  DefenceSchedulingData,
  SetDefenceSchedulePayload,
  SetDefenceScheduleResponse,
  AdminDefenceArchivePayload,
  AdminDefenceArchiveListResponse,
} from '@/types/defence.types';

// ============================================================
// Internal Helpers
// ============================================================

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

function buildDefenceListEndpoint(params?: {
  search?: string;
  status?: string;
  view?: string;
}) {
  const queryParts: string[] = [];
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.view) queryParts.push(`view=${encodeURIComponent(params.view)}`);

  return queryParts.length > 0
    ? `${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}?${queryParts.join('&')}`
    : API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE;
}

function buildArchiveListEndpoint(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}) {
  const queryParts: string[] = [];
  queryParts.push('view=archive');
  if (params?.page) queryParts.push(`page=${params.page}`);
  if (params?.pageSize) queryParts.push(`pageSize=${params.pageSize}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);

  return `${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}?${queryParts.join('&')}`;
}

// ============================================================
// Detail (Multi-role unified)
// ============================================================

export async function getAdminDefenceDetail(defenceId: string): Promise<AdminDefenceDetailResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BY_ID(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat detail sidang');
}

export async function getLecturerDefenceDetail(defenceId: string): Promise<LecturerDefenceDetailResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BY_ID(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat detail sidang');
}

export async function getStudentDefenceDetail(defenceId?: string): Promise<StudentDefenceDetailResponse> {
  if (!defenceId) throw new Error('ID sidang tidak valid');
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BY_ID(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat detail sidang');
}

// ============================================================
// Lists (view-based)
// ============================================================

export async function getAdminDefenceList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminDefenceListItem[]> {
  const res = await apiRequest(getApiUrl(buildDefenceListEndpoint({ ...params, view: 'verification' })));
  return parseJsonResponse(res, 'Gagal memuat data sidang');
}

export async function getAdminDefenceArchiveList(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<AdminDefenceArchiveListResponse> {
  const res = await apiRequest(getApiUrl(buildArchiveListEndpoint(params)));
  return parseJsonResponse(res, 'Gagal memuat arsip sidang');
}

export async function createAdminDefenceArchive(payload: AdminDefenceArchivePayload): Promise<any> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal membuat arsip sidang');
}

export async function updateAdminDefenceArchive(defenceId: string, payload: AdminDefenceArchivePayload): Promise<any> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BY_ID(defenceId)), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal memperbarui arsip sidang');
}

export async function deleteAdminDefenceArchive(defenceId: string): Promise<any> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BY_ID(defenceId)), {
    method: 'DELETE',
  });
  return parseJsonResponse(res, 'Gagal menghapus arsip sidang');
}

export async function cancelAdminDefence(defenceId: string, cancelledReason?: string): Promise<any> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/${defenceId}/cancel`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelledReason }),
  });
  return parseJsonResponse(res, 'Gagal membatalkan sidang');
}

export async function importAdminDefenceArchive(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/import`), {
    method: 'POST',
    body: formData, // apiRequest will handle FormData and omit Content-Type
  });
  return parseJsonResponse(res, 'Gagal mengimpor arsip sidang');
}

export async function exportAdminDefenceArchive() {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/export`), {
    method: 'GET',
  });
  if (!res.ok) throw new Error('Gagal mengekspor arsip sidang');
  
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arsip-sidang-ta-${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function getAdminDefenceThesisOptions(): Promise<any[]> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/options/theses`));
  return parseJsonResponse(res, 'Gagal memuat opsi judul TA');
}

export async function getAdminDefenceStudentOptions(): Promise<any[]> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/options/students`));
  return parseJsonResponse(res, 'Gagal memuat opsi mahasiswa');
}

export async function getAdminDefenceLecturerOptions(): Promise<any[]> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/options/lecturers`));
  return parseJsonResponse(res, 'Gagal memuat opsi dosen');
}

export async function getAdminDefenceRoomOptions(): Promise<any[]> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.BASE}/options/rooms`));
  return parseJsonResponse(res, 'Gagal memuat opsi ruangan');
}

export async function getDefenceExaminerRequests(params?: {
  search?: string;
}): Promise<ExaminerDefenceRequestItem[]> {
  const res = await apiRequest(getApiUrl(buildDefenceListEndpoint({ ...params, view: 'examiner_requests' })));
  return parseJsonResponse(res, 'Gagal memuat permintaan penguji sidang');
}

export async function getSupervisedStudentDefences(params?: {
  search?: string;
}): Promise<SupervisedStudentDefenceItem[]> {
  const res = await apiRequest(getApiUrl(buildDefenceListEndpoint({ ...params, view: 'supervised_students' })));
  return parseJsonResponse(res, 'Gagal memuat data mahasiswa bimbingan');
}

export async function getDefenceAssignmentSeminars(params?: {
  search?: string;
}): Promise<AssignmentDefenceItem[]> {
  const res = await apiRequest(getApiUrl(buildDefenceListEndpoint({ ...params, view: 'assignment' })));
  return parseJsonResponse(res, 'Gagal memuat data penetapan penguji');
}

// ============================================================
// Scheduling
// ============================================================

export async function getDefenceSchedulingData(defenceId: string): Promise<DefenceSchedulingData> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.SCHEDULING_DATA(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat data penjadwalan sidang');
}

export async function setDefenceSchedule(
  defenceId: string,
  payload: SetDefenceSchedulePayload
): Promise<SetDefenceScheduleResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.SCHEDULE(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal menyimpan jadwal sidang');
}

export async function finalizeDefenceSchedule(defenceId: string): Promise<any> {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_DEFENCE.SCHEDULE(defenceId)}/finalize`), {
    method: 'POST',
  });
  return parseJsonResponse(res, 'Gagal menetapkan jadwal sidang secara resmi');
}

// ============================================================
// Assessment & Finalization
// ============================================================

export async function getDefenceAssessmentForm(defenceId: string): Promise<DefenceAssessmentFormResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ASSESSMENT(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat form penilaian sidang');
}

export async function submitDefenceAssessment(
  defenceId: string,
  payload: SubmitDefenceAssessmentPayload
): Promise<SubmitDefenceAssessmentResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ASSESSMENT(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal submit penilaian sidang');
}

export async function getStudentDefenceAssessment(defenceId?: string): Promise<StudentDefenceAssessmentResponse> {
  if (!defenceId) throw new Error('ID sidang tidak valid');
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ASSESSMENT_VIEW(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat berita acara sidang');
}

export async function getDefenceFinalizationData(defenceId: string): Promise<DefenceFinalizationDataResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.FINALIZATION_DATA(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat data berita acara sidang');
}

export async function finalizeDefenceBySupervisor(
  defenceId: string,
  payload: FinalizeDefencePayload
): Promise<FinalizeDefenceResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.FINALIZE(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal menetapkan hasil sidang');
}

export async function downloadInvitationLetter(defenceId: string, nomorSurat?: string): Promise<Blob> {
  let url = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.INVITATION_LETTER(defenceId));
  if (nomorSurat) {
    url += `?nomorSurat=${encodeURIComponent(nomorSurat)}`;
  }
  const response = await apiRequest(url);
  if (!response.ok) {
    throw new Error('Gagal mengunduh surat undangan sidang');
  }
  return await response.blob();
}

export async function downloadAssessmentResult(defenceId: string): Promise<Blob> {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ASSESSMENT_RESULT(defenceId));
  const response = await apiRequest(url);
  if (!response.ok) {
    throw new Error('Gagal mengunduh hasil penilaian sidang');
  }
  return await response.blob();
}

