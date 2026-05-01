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
  const res = await apiRequest(getApiUrl(buildDefenceListEndpoint({ ...params, view: 'admin' })));
  return parseJsonResponse(res, 'Gagal memuat data sidang');
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
