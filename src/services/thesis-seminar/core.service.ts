import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  AdminSeminarDetailResponse,
  AdminSeminarListItem,
  SeminarSchedulingData,
  SetSchedulePayload,
  SetScheduleResponse,
} from '@/types/seminar.types';
import type { Room } from '@/services/admin.service';

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

export interface AdminThesisSeminarAudience {
  studentId: string;
  fullName: string;
  nim: string;
  approvedAt: string | null;
  approvedByName: string;
  registeredAt: string | null;
  createdAt: string;
}

export interface AdminThesisSeminarAudienceStudentOption {
  id: string;
  fullName: string;
  nim: string;
}

export interface AdminThesisSeminarAudienceImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failed: number;
  failedRows: { row: number; error: string }[];
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

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || fallbackMessage);
  }
  return response.json() as Promise<T>;
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

export const getStudentSeminarDetail = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat detail seminar mahasiswa');
};

export const getStudentSeminarAssessment = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ASSESSMENT(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat penilaian seminar mahasiswa');
};

export async function getAdminThesisSeminarValidationList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminSeminarListItem[]> {
  const response = await apiRequest(
    getApiUrl(
      buildSeminarListEndpoint({
        ...params,
        view: 'validation',
      })
    )
  );
  const data = await parseJsonResponse<any[]>(response, 'Gagal memuat data validasi seminar hasil');
  return data.map(normalizeValidationSeminar);
}

export async function getAdminThesisSeminarArchiveList(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
}): Promise<ArchiveListResponse> {
  const response = await apiRequest(
    getApiUrl(
      buildSeminarListEndpoint({
        ...params,
        view: 'archive',
      })
    )
  );
  const data = await parseJsonResponse<any>(response, 'Gagal memuat arsip seminar hasil');
  return {
    seminars: (data.seminars ?? []).map(normalizeArchiveSeminar),
    meta: data.meta,
  };
}

export async function getAdminThesisSeminarDetail(
  seminarId: string
): Promise<AdminSeminarDetailResponse> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId))
  );
  return parseJsonResponse(response, 'Gagal memuat detail seminar hasil');
}

export async function getAdminThesisSeminarSchedulingData(
  seminarId: string
): Promise<SeminarSchedulingData> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULING_DATA(seminarId))
  );
  return parseJsonResponse(response, 'Gagal memuat data penjadwalan seminar');
}

export async function setAdminThesisSeminarSchedule(
  seminarId: string,
  payload: SetSchedulePayload
): Promise<SetScheduleResponse> {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULE(seminarId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return parseJsonResponse(response, 'Gagal menyimpan jadwal seminar');
}

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

export async function createAdminThesisSeminarArchive(
  payload: AdminThesisSeminarArchivePayload
): Promise<AdminThesisSeminarArchiveItem> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BASE), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<any>(response, 'Gagal menambahkan seminar hasil');
  return normalizeArchiveSeminar(data);
}

export async function updateAdminThesisSeminarArchive(
  seminarId: string,
  payload: AdminThesisSeminarArchivePayload
): Promise<AdminThesisSeminarArchiveItem> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  const data = await parseJsonResponse<any>(response, 'Gagal memperbarui seminar hasil');
  return normalizeArchiveSeminar(data);
}

export async function deleteAdminThesisSeminarArchive(seminarId: string) {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)), {
    method: 'DELETE',
  });
  return parseJsonResponse<{ success: boolean }>(response, 'Gagal menghapus seminar hasil');
}

export async function exportAdminThesisSeminarArchive() {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.EXPORT));
  if (!response.ok) throw new Error('Gagal mengekspor arsip seminar');
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
  if (!response.ok) throw new Error('Gagal mengunduh template seminar hasil');
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

export async function importAdminThesisSeminarArchive(
  file: File
): Promise<AdminThesisSeminarArchiveImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.IMPORT), {
    method: 'POST',
    body: formData,
  });
  return parseJsonResponse(response, 'Gagal mengimpor arsip seminar');
}

export async function getAdminThesisSeminarAudiences(
  seminarId: string
): Promise<AdminThesisSeminarAudience[]> {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)));
  return parseJsonResponse(response, 'Gagal memuat audience seminar');
}

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
  return parseJsonResponse<{ success: boolean }>(response, 'Gagal menambahkan audience seminar');
}

export async function removeAdminThesisSeminarAudience(seminarId: string, studentId: string) {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCE_BY_ID(seminarId, studentId)),
    { method: 'DELETE' }
  );
  return parseJsonResponse<{ success: boolean }>(response, 'Gagal menghapus audience seminar');
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
