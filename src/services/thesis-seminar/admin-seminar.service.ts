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
 * Get all seminars for admin list view
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
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan jadwal seminar');
  return json.data;
}

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

export const getSeminarResultThesisOptionsAPI = async (): Promise<{ data: SeminarResultThesisOption[] }> => {
  const response = await fetch(getApiUrl('/thesis-seminars/admin/seminar-results/options/theses'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat opsi thesis');
  }

  return response.json();
};

export const getSeminarResultLecturerOptionsAPI = async (): Promise<{ data: SeminarResultLecturerOption[] }> => {
  const response = await fetch(getApiUrl('/thesis-seminars/admin/seminar-results/options/lecturers'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat opsi dosen');
  }

  return response.json();
};

export const getSeminarResultStudentOptionsAPI = async (): Promise<{ data: SeminarResultStudentOption[] }> => {
  const response = await fetch(getApiUrl('/thesis-seminars/admin/seminar-results/options/students'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat opsi mahasiswa');
  }

  return response.json();
};

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

  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data seminar hasil');
  }

  return response.json();
};

export const getSeminarResultDetailAPI = async (id: string): Promise<{ data: SeminarResult }> => {
  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results/${id}`), {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat detail seminar hasil');
  }
  return response.json();
};

export const createSeminarResultAPI = async (data: CreateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const response = await fetch(getApiUrl('/thesis-seminars/admin/seminar-results'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menambahkan seminar hasil');
  }

  return response.json();
};

export const updateSeminarResultAPI = async (id: string, data: UpdateSeminarResultRequest): Promise<{ data: SeminarResult }> => {
  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memperbarui seminar hasil');
  }

  return response.json();
};

export const deleteSeminarResultAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results/${id}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus seminar hasil');
  }

  return response.json();
};

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

  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results/audiences?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat relasi audience seminar');
  }

  return response.json();
};

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
  const response = await fetch(getApiUrl('/thesis-seminars/admin/seminar-results/audiences/assign'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengaitkan audience seminar');
  }

  return response.json();
};

export const removeSeminarResultAudienceLinkAPI = async (seminarId: string, studentId: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(getApiUrl(`/thesis-seminars/admin/seminar-results/audiences/${seminarId}/${studentId}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus relasi audience seminar');
  }

  return response.json();
};

export const getSeminarResultAudienceLinksAPI = getSeminarResultAudiencesAPI;
