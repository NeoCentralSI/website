import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  AdminSeminarListItem,
  AdminSeminarDetailResponse,
  ValidateDocumentPayload,
  ValidateDocumentResponse,
  SeminarSchedulingData,
  SetSchedulePayload,
  SetScheduleResponse,
} from '@/types/seminar.types';

/**
 * Get all seminars for admin list view (active seminars)
 */
export async function getAdminSeminarList(params?: {
  search?: string;
  status?: string;
}): Promise<AdminSeminarListItem[]> {
  let endpoint = API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.LIST;
  const queryParts: string[] = [];
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (queryParts.length > 0) endpoint += `?${queryParts.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar');
  return json.data;
}

/**
 * Get seminar detail for admin
 */
export async function getAdminSeminarDetail(
  seminarId: string
): Promise<AdminSeminarDetailResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.DETAIL(seminarId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail seminar');
  return json.data;
}

/**
 * Validate (approve/decline) a seminar document
 */
export async function validateSeminarDocument(
  seminarId: string,
  documentTypeId: string,
  payload: ValidateDocumentPayload
): Promise<ValidateDocumentResponse> {
  const res = await apiRequest(
    getApiUrl(
      API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.VALIDATE_DOCUMENT(
        seminarId,
        documentTypeId
      )
    ),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memvalidasi dokumen');
  return json.data;
}

/**
 * Get scheduling data (rooms + lecturer availabilities) for a seminar
 */
export async function getSchedulingData(seminarId: string): Promise<SeminarSchedulingData> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.SCHEDULING_DATA(seminarId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data penjadwalan');
  return json.data;
}

/**
 * Set or update the seminar schedule
 */
export async function setSchedule(
  seminarId: string,
  payload: SetSchedulePayload
): Promise<SetScheduleResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ADMIN.SET_SCHEDULE(seminarId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan jadwal seminar');
  return json.data;
}

// ============================================================
// ARCHIVE SERVICE FUNCTIONS
// ============================================================

export type SeminarResultStatus = 'passed' | 'passed_with_revision' | 'failed';

export interface SeminarResult {
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
  status: SeminarResultStatus;
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

export interface SeminarResultThesisOption {
  id: string;
  title: string;
  studentName: string;
  studentNim: string;
  hasSeminarResult: boolean;
  seminarResultId: string | null;
  supervisorIds: string[];
}

export interface SeminarResultLecturerOption {
  id: string;
  fullName: string;
  nip: string;
}

export interface SeminarResultStudentOption {
  id: string;
  fullName: string;
  nim: string;
}

export interface SeminarResultAudienceLink {
  seminarId: string;
  studentId: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    nim: string;
  };
  seminar: {
    id: string;
    date: string | null;
    thesisTitle: string;
    ownerName: string;
    ownerNim: string;
  };
}

export interface CreateSeminarResultRequest {
  thesisId: string;
  date: string;
  roomId: string;
  status: SeminarResultStatus;
  examinerLecturerIds: string[];
}

export type UpdateSeminarResultRequest = CreateSeminarResultRequest;

/**
 * Get archive list
 */
export const getSeminarResultsAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  seminars: SeminarResult[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);

  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.LIST}?${queryParams}`));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar hasil');
  return json;
};

/**
 * Get archive detail
 */
export const getSeminarResultDetailAPI = async (id: string): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.DETAIL(id)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail seminar hasil');
  return json;
};

/**
 * Create archive entry (Old Data)
 */
export const createSeminarResultAPI = async (data: CreateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.CREATE), {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menambahkan seminar hasil');
  return json;
};

/**
 * Update archive entry
 */
export const updateSeminarResultAPI = async (id: string, data: UpdateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.UPDATE(id)), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memperbarui seminar hasil');
  return json;
};

/**
 * Delete archive entry
 */
export const deleteSeminarResultAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.DELETE(id)), {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menghapus seminar hasil');
  return json;
};

/**
 * Get options for dropdowns
 */
export const getSeminarResultThesisOptionsAPI = async (): Promise<{ data: SeminarResultThesisOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.OPTIONS_THESES));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat opsi thesis');
  return json;
};

export const getSeminarResultLecturerOptionsAPI = async (): Promise<{ data: SeminarResultLecturerOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.OPTIONS_LECTURERS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat opsi dosen');
  return json;
};

export const getSeminarResultStudentOptionsAPI = async (): Promise<{ data: SeminarResultStudentOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.OPTIONS_STUDENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat opsi mahasiswa');
  return json;
};

/**
 * Audience management
 */
export const getSeminarResultAudiencesAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  links: SeminarResultAudienceLink[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);

  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.AUDIENCES}?${queryParams}`));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat relasi audience seminar');
  return json;
};

export const getSeminarResultAudienceLinksAPI = getSeminarResultAudiencesAPI;

export const assignSeminarResultAudiencesAPI = async (payload: {
  studentId: string;
  seminarIds: string[];
}): Promise<{
  data: {
    created: number;
    skippedOwnSeminarIds: string[];
    skippedDuplicate: number;
  };
}> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.AUDIENCES_ASSIGN), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengaitkan audience seminar');
  return json;
};

export const removeSeminarResultAudienceLinkAPI = async (seminarId: string, studentId: string): Promise<{ success: boolean; message: string }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.AUDIENCES_REMOVE(seminarId, studentId)), {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menghapus relasi audience seminar');
  return json;
};

/**
 * Import/Export
 */
export const exportSeminarArchiveAPI = async (): Promise<void> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.EXPORT));
  if (!res.ok) throw new Error('Gagal mengekspor data seminar archive');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Arsip_Seminar_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Download seminar archive template
 */
export const downloadSeminarArchiveTemplateAPI = async (): Promise<void> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.TEMPLATE));
  if (!res.ok) throw new Error('Gagal mengunduh template seminar archive');

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Arsip_Seminar.xlsx';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export interface SeminarArchiveImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failed: number;
  failedRows: { row: number; error: string }[];
}

/**
 * Import seminar archive data from Excel
 */
export const importSeminarArchiveAPI = async (file: File): Promise<SeminarArchiveImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_ARCHIVE.IMPORT), {
    method: 'POST',
    body: formData,
  });
  
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengimpor data seminar archive');
  return json;
};
