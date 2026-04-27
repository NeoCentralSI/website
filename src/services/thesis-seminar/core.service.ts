import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  AdminSeminarDetailResponse,
  AdminSeminarListItem,
  SeminarSchedulingData,
  SetSchedulePayload,
  SetScheduleResponse,
  ExaminerAssessmentFormResponse,
  SubmitExaminerAssessmentPayload,
  SubmitExaminerAssessmentResponse,
  SupervisorFinalizationDataResponse,
  FinalizeSeminarPayload,
  FinalizeSeminarResponse,
  ExaminerRequestItem,
  SupervisedStudentSeminarItem,
  LecturerSeminarDetailResponse,
  AssignmentSeminarItem,
} from '@/types/seminar.types';
import type { Room } from '@/services/admin.service';

// ============================================================
// Types & Interfaces
// ============================================================

export interface AdminThesisSeminarExaminerOption {
  id: string;
  fullName: string;
  nip: string;
}

export interface AdminThesisSeminarOption {
  id: string;
  thesisTitle: string;
  studentName: string;
  studentNim: string;
  hasSeminarResult: boolean;
  seminarResultId: string | null;
  supervisorIds: string[];
}

export type AdminThesisSeminarArchiveStatus =
  | 'passed'
  | 'passed_with_revision'
  | 'failed'
  | 'cancelled';

export interface AdminThesisSeminarArchiveItem {
  id: string;
  thesisId: string;
  thesisTitle: string;
  student: {
    id: string | null;
    fullName: string;
    nim: string;
  };
  date: string | null;
  room: {
    id: string;
    name: string;
    location: string | null;
  } | null;
  status: AdminThesisSeminarArchiveStatus;
  isEditable?: boolean;
  audienceCount: number;
  examiners: Array<{
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminThesisSeminarArchiveImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failed: number;
  failedRows: { row: number; error: string }[];
}

export interface AdminThesisSeminarArchivePayload {
  thesisId: string;
  date: string;
  roomId: string;
  status: Exclude<AdminThesisSeminarArchiveStatus, 'cancelled'>;
  examinerLecturerIds: string[];
}

type ArchiveListResponse = {
  seminars: AdminThesisSeminarArchiveItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

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

function buildSeminarListEndpoint(params?: {
  search?: string;
  status?: string;
  view?: string;
  page?: number;
  pageSize?: number;
}) {
  const queryParts: string[] = [];
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.view) queryParts.push(`view=${encodeURIComponent(params.view)}`);
  if (params?.page) queryParts.push(`page=${params.page}`);
  if (params?.pageSize) queryParts.push(`pageSize=${params.pageSize}`);

  return queryParts.length > 0
    ? `${API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BASE}?${queryParts.join('&')}`
    : API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BASE;
}

function normalizeValidationSeminar(item: any): AdminSeminarListItem {
  return {
    id: item.id,
    thesisId: item.thesisId ?? null,
    studentName: item.studentName ?? '-',
    studentNim: item.studentNim ?? '-',
    thesisTitle: item.thesisTitle ?? '-',
    supervisors: item.supervisors ?? [],
    status: item.status,
    registeredAt: item.registeredAt ?? null,
    date: item.date ?? null,
    startTime: item.startTime ?? null,
    endTime: item.endTime ?? null,
    room: item.room ?? null,
    examiners: item.examiners ?? [],
    audienceCount: item.audienceCount ?? 0,
    documentSummary: item.documentSummary,
  };
}

function normalizeArchiveSeminar(item: any): AdminThesisSeminarArchiveItem {
  return {
    id: item.id,
    thesisId: item.thesisId ?? '',
    thesisTitle: item.thesisTitle ?? '-',
    student: {
      id: item.student?.id ?? null,
      fullName: item.student?.fullName ?? '-',
      nim: item.student?.nim ?? '-',
    },
    date: item.date ?? null,
    room: item.room
      ? {
          id: item.room.id,
          name: item.room.name,
          location: item.room.location ?? null,
        }
      : null,
    status: item.status,
    isEditable: item.isEditable ?? false,
    audienceCount: item.audienceCount ?? 0,
    examiners: (item.examiners ?? []).map((examiner: any) => ({
      id: examiner.id,
      lecturerId: examiner.lecturerId,
      lecturerName: examiner.lecturerName ?? '-',
      order: examiner.order,
    })),
    createdAt: item.createdAt ?? item.date ?? new Date().toISOString(),
    updatedAt: item.updatedAt ?? item.date ?? new Date().toISOString(),
  };
}

// ============================================================
// Core Seminar List & Detail (Multi-role)
// ============================================================

export const getStudentSeminarDetail = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat detail seminar');
};

export const getLecturerSeminarDetail = async (seminarId: string): Promise<LecturerSeminarDetailResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat detail seminar');
};

export async function getAdminThesisSeminarDetail(seminarId: string): Promise<AdminSeminarDetailResponse> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat detail seminar');
}

// ============================================================
// Role-specific Lists
// ============================================================

export async function getAdminThesisSeminarValidationList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminSeminarListItem[]> {
  const response = await apiRequest(getApiUrl(buildSeminarListEndpoint({ ...params, view: 'validation' })));
  const data = await parseJsonResponse<any[]>(response, 'Gagal memuat data validasi seminar');
  return data.map(normalizeValidationSeminar);
}

export async function getExaminerRequests(params?: { search?: string }): Promise<ExaminerRequestItem[]> {
  const response = await apiRequest(getApiUrl(buildSeminarListEndpoint({ ...params, view: 'examiner_requests' })));
  return parseJsonResponse(response, 'Gagal memuat permintaan penguji');
}

export async function getSupervisedStudentSeminars(params?: { search?: string }): Promise<SupervisedStudentSeminarItem[]> {
  const response = await apiRequest(getApiUrl(buildSeminarListEndpoint({ ...params, view: 'supervised_students' })));
  return parseJsonResponse(response, 'Gagal memuat data mahasiswa bimbingan');
}

export async function getAssignmentSeminars(params?: { search?: string }): Promise<AssignmentSeminarItem[]> {
  const response = await apiRequest(getApiUrl(buildSeminarListEndpoint({ ...params, view: 'assignment' })));
  return parseJsonResponse(response, 'Gagal memuat data penetapan penguji');
}

// ============================================================
// Scheduling
// ============================================================

export async function getAdminThesisSeminarSchedulingData(seminarId: string): Promise<SeminarSchedulingData> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULING_DATA(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat data penjadwalan');
}

export async function setAdminThesisSeminarSchedule(seminarId: string, payload: SetSchedulePayload): Promise<SetScheduleResponse> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULE(seminarId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Gagal menyimpan jadwal');
}

// ============================================================
// Assessment & Finalization
// ============================================================

export const getStudentSeminarAssessment = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ASSESSMENT(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat penilaian');
};

export async function getExaminerAssessmentForm(seminarId: string): Promise<ExaminerAssessmentFormResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ASSESSMENT(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat form penilaian');
}

export async function submitExaminerAssessment(seminarId: string, payload: SubmitExaminerAssessmentPayload): Promise<SubmitExaminerAssessmentResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ASSESSMENT(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal submit penilaian');
}

export async function getSupervisorFinalizationData(seminarId: string): Promise<SupervisorFinalizationDataResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.FINALIZATION_DATA(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat data finalisasi');
}

export async function finalizeSeminarBySupervisor(seminarId: string, payload: FinalizeSeminarPayload): Promise<FinalizeSeminarResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.FINALIZE(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal menetapkan hasil seminar');
}

// ============================================================
// Archive Management (Master Data)
// ============================================================

export async function getAdminThesisSeminarArchiveList(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<ArchiveListResponse> {
  const response = await apiRequest(getApiUrl(buildSeminarListEndpoint({ ...params, view: 'archive' })));
  const data = await parseJsonResponse<any>(response, 'Gagal memuat arsip seminar');
  return {
    seminars: (data.seminars ?? []).map(normalizeArchiveSeminar),
    meta: data.meta,
  };
}

export async function createAdminThesisSeminarArchive(payload: AdminThesisSeminarArchivePayload): Promise<AdminThesisSeminarArchiveItem> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BASE), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<any>(response, 'Gagal menambahkan seminar');
  return normalizeArchiveSeminar(data);
}

export async function updateAdminThesisSeminarArchive(seminarId: string, payload: AdminThesisSeminarArchivePayload): Promise<AdminThesisSeminarArchiveItem> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<any>(response, 'Gagal memperbarui seminar');
  return normalizeArchiveSeminar(data);
}

export async function deleteAdminThesisSeminarArchive(seminarId: string) {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)), {
    method: 'DELETE',
  });
  return parseJsonResponse<{ success: boolean }>(response, 'Gagal menghapus seminar');
}

// ============================================================
// Options
// ============================================================

export async function getAdminThesisSeminarThesisOptions(): Promise<AdminThesisSeminarOption[]> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_THESES));
  const data = await parseJsonResponse<any[]>(response, 'Gagal memuat opsi tugas akhir');
  return data.map((item) => ({
    id: item.id,
    thesisTitle: item.title ?? '-',
    studentName: item.student?.user?.fullName ?? '-',
    studentNim: item.student?.user?.identityNumber ?? '-',
    hasSeminarResult: false,
    seminarResultId: null,
    supervisorIds: (item.thesisSupervisors ?? []).map((supervisor: any) => supervisor.lecturerId),
  }));
}

export async function getAdminThesisSeminarLecturerOptions(): Promise<AdminThesisSeminarExaminerOption[]> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_LECTURERS));
  const data = await parseJsonResponse<any[]>(response, 'Gagal memuat opsi dosen penguji');
  return data.map((item) => ({
    id: item.id,
    fullName: item.user?.fullName ?? '-',
    nip: item.user?.identityNumber ?? '-',
  }));
}

export async function getAdminThesisSeminarRoomOptions(): Promise<Room[]> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_ROOMS));
  return parseJsonResponse(response, 'Gagal memuat opsi ruangan');
}

// ============================================================
// Import / Export
// ============================================================

export async function exportAdminThesisSeminarArchive() {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.EXPORT));
  if (!response.ok) throw new Error('Gagal mengekspor arsip');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Arsip_Seminar_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadAdminThesisSeminarArchiveTemplate() {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.TEMPLATE));
  if (!response.ok) throw new Error('Gagal mengunduh template');
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Template_Arsip_Seminar.xlsx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function importAdminThesisSeminarArchive(file: File): Promise<AdminThesisSeminarArchiveImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.IMPORT), {
    method: 'POST',
    body: formData,
  });
  return parseJsonResponse(response, 'Gagal mengimpor arsip');
}
