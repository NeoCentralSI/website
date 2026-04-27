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
import type { Room } from '@/services/admin.service';

function buildThesisSeminarListEndpoint(params?: {
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

/**
 * Get all seminars for admin list view (active seminars)
 */
export async function getAdminSeminarList(params?: {
  search?: string;
  status?: string;
  view?: string;
}): Promise<AdminSeminarListItem[]> {
  const endpoint = buildThesisSeminarListEndpoint({
    ...params,
    view: params?.view ?? 'validation',
  });
  const res = await apiRequest(getApiUrl(endpoint));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat data seminar');
  }
  return res.json();
}

/**
 * Get seminar detail for admin
 */
export async function getAdminSeminarDetail(
  seminarId: string
): Promise<AdminSeminarDetailResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat detail seminar');
  }
  return res.json();
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
      API_CONFIG.ENDPOINTS.THESIS_SEMINAR.VALIDATE_DOCUMENT(
        seminarId,
        documentTypeId
      )
    ),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memvalidasi dokumen');
  }
  return res.json();
}

/**
 * Get scheduling data (rooms + lecturer availabilities) for a seminar
 */
export async function getSchedulingData(seminarId: string): Promise<SeminarSchedulingData> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULING_DATA(seminarId)));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat data penjadwalan');
  }
  return res.json();
}

/**
 * Set or update the seminar schedule
 */
export async function setSchedule(
  seminarId: string,
  payload: SetSchedulePayload
): Promise<SetScheduleResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.SCHEDULE(seminarId)),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal menyimpan jadwal seminar');
  }
  return res.json();
}

// ============================================================
// ARCHIVE SERVICE FUNCTIONS
// ============================================================

export type SeminarResultStatus = 'passed' | 'passed_with_revision' | 'failed' | 'cancelled';

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
  status?: string;
}): Promise<{
  seminars: SeminarResult[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> => {
  const endpoint = buildThesisSeminarListEndpoint({
    ...params,
    view: 'archive',
  });
  const res = await apiRequest(getApiUrl(endpoint));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat data seminar hasil');
  }
  return res.json();
};

/**
 * Get archive detail
 */
export const getSeminarResultDetailAPI = async (id: string): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(id)));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat detail seminar hasil');
  }
  const data = await res.json();
  return {
    data: {
      id: data.id,
      thesisId: data.thesis?.id ?? '',
      thesisTitle: data.thesis?.title ?? '-',
      student: {
        id: null,
        fullName: data.student?.name ?? '-',
        nim: data.student?.nim ?? '-',
      },
      date: data.date ?? null,
      room: data.room
        ? {
            id: data.room.id,
            name: data.room.name,
            location: null,
          }
        : null,
      status: data.status,
      isEditable: false,
      audienceCount: Array.isArray(data.audiences) ? data.audiences.length : 0,
      examiners: (data.examiners ?? []).map((examiner: any) => ({
        id: examiner.id,
        lecturerId: examiner.lecturerId ?? examiner.id,
        lecturerName: examiner.lecturerName,
        order: examiner.order,
      })),
      createdAt: data.registeredAt ?? data.date ?? new Date().toISOString(),
      updatedAt: data.resultFinalizedAt ?? data.date ?? new Date().toISOString(),
    },
  };
};

/**
 * Create archive entry (Old Data)
 */
export const createSeminarResultAPI = async (data: CreateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BASE), {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal menambahkan seminar hasil');
  }
  const result = await res.json();
  return { data: result };
};

/**
 * Update archive entry
 */
export const updateSeminarResultAPI = async (id: string, data: UpdateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(id)), {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memperbarui seminar hasil');
  }
  const result = await res.json();
  return { data: result };
};

/**
 * Delete archive entry
 */
export const deleteSeminarResultAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(id)), {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal menghapus seminar hasil');
  }
  return res.json();
};

/**
 * Get options for dropdowns
 */
export const getSeminarResultThesisOptionsAPI = async (): Promise<{ data: SeminarResultThesisOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_THESES));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat opsi thesis');
  }
  const data = await res.json();
  return { data };
};

export const getSeminarResultLecturerOptionsAPI = async (): Promise<{ data: SeminarResultLecturerOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_LECTURERS));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat opsi dosen');
  }
  const data = await res.json();
  return { data };
};

export const getSeminarResultStudentOptionsAPI = async (): Promise<{ data: SeminarResultStudentOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_STUDENTS));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat opsi mahasiswa');
  }
  const data = await res.json();
  return { data };
};

export const getSeminarRoomOptionsAPI = async (): Promise<{ data: Room[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.OPTIONS_ROOMS));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat opsi ruangan');
  }
  const data = await res.json();
  return { data };
};

export interface SeminarAudience {
  studentId: string;
  fullName: string;
  nim: string;
  approvedAt: string | null;
  approvedByName: string;
  registeredAt: string | null;
  createdAt: string;
}

export interface SeminarAudienceStudentOption {
  id: string;
  fullName: string;
  nim: string;
}

/**
 * Get audience list for a seminar
 */
export const getSeminarAudiencesAPI = async (seminarId: string): Promise<{ data: SeminarAudience[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat data audience seminar');
  }
  const data = await res.json();
  return { data };
};

/**
 * Get student options (not yet in audience) for a seminar
 */
export const getStudentOptionsForAudienceAPI = async (seminarId: string): Promise<{ data: SeminarAudienceStudentOption[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_OPTIONS(seminarId)));
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal memuat opsi mahasiswa audience');
  }
  const data = await res.json();
  return { data };
};

/**
 * Add a student to seminar audience
 */
export const addSeminarAudienceAPI = async (seminarId: string, studentId: string): Promise<{ success: boolean }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)), {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal menambahkan audience seminar');
  }
  return res.json();
};

/**
 * Remove a student from seminar audience
 */
export const removeSeminarAudienceAPI = async (seminarId: string, studentId: string): Promise<{ success: boolean }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCE_BY_ID(seminarId, studentId)), {
    method: 'DELETE',
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal menghapus audience seminar');
  }
  return res.json();
};

export interface SeminarAudienceImportResult {
  success: boolean;
  total: number;
  successCount: number;
  failed: number;
  failedRows: { row: number; error: string }[];
}

/**
 * Import audience from Excel file
 */
export const importSeminarAudiencesAPI = async (seminarId: string, file: File): Promise<SeminarAudienceImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_IMPORT(seminarId)), {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal mengimpor data audience');
  }
  return res.json();
};

/**
 * Export seminar audiences template (Excel)
 */
export const exportSeminarAudienceTemplateAPI = async (seminarId: string): Promise<void> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_TEMPLATE(seminarId));
  const res = await apiRequest(url, { method: 'GET' });
  if (!res.ok) throw new Error('Gagal mengunduh template audience seminar');

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `Template_Audience_Seminar.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Export audience to Excel
 */
export const exportSeminarAudiencesAPI = async (seminarId: string): Promise<void> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_EXPORT(seminarId)));
  if (!res.ok) throw new Error('Gagal mengekspor data audience seminar');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Audience_Seminar_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Export audience to PDF (as HTML file for presentation)
 */
export const exportSeminarAudiencesPdfAPI = async (seminarId: string): Promise<void> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES_EXPORT(seminarId)));
  if (!res.ok) throw new Error('Gagal mengekspor data audience seminar');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Audience_Seminar_${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Import/Export
 */
export const exportSeminarArchiveAPI = async (): Promise<void> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.EXPORT));
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
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.TEMPLATE));
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
  
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.IMPORT), {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Gagal mengimpor data seminar archive');
  }
  return res.json();
};
