import { getApiUrl } from '@/config/api';

export interface ThesisSupervisor {
  id: string;
  lecturerId: string;
  fullName: string;
  role: string;
  roleId: string;
}

export interface ThesisStudent {
  id: string;
  userId: string;
  fullName: string;
  nim: string;
  email: string;
}

export interface ThesisItem {
  id: string;
  title: string;
  status: string | null;
  statusId: string | null;
  topic: string | null;
  topicId: string | null;
  student: ThesisStudent;
  supervisors: ThesisSupervisor[];
  startDate: string | null;
  deadlineDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThesisListResponse {
  success: boolean;
  data: ThesisItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableStudent {
  id: string;
  userId: string;
  fullName: string;
  nim: string;
  email: string;
}

export interface Lecturer {
  id: string;
  fullName: string;
  nip: string;
}

export interface SupervisorRole {
  id: string;
  name: string;
}

export interface ThesisStatus {
  id: string;
  name: string;
}

export interface CreateThesisRequest {
  studentId: string;
  title: string;
  thesisTopicId?: string;
  thesisStatusId?: string;
  supervisors?: Array<{
    lecturerId: string;
    roleId: string;
  }>;
}

export interface UpdateThesisRequest {
  title?: string;
  thesisTopicId?: string;
  thesisStatusId?: string;
  supervisors?: Array<{
    lecturerId: string;
    roleId: string;
  }>;
}

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
});

/**
 * Get thesis list with pagination
 */
export const getThesisListAPI = async (params: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<ThesisListResponse> => {
  const { page = 1, pageSize = 10, search = '' } = params;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
  });

  const response = await fetch(getApiUrl(`/adminfeatures/thesis/admin?${queryParams}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data tugas akhir');
  }

  const result = await response.json();
  
  // Transform response to expected format
  return {
    success: result.success,
    data: (result.thesis || []).map((t: {
      id: string;
      title: string;
      status: string | null;
      statusId: string | null;
      topic: string | null;
      topicId: string | null;
      student: { id: string; fullName: string; nim: string; email: string } | null;
      supervisors: Array<{ id: string; lecturerId: string; fullName: string; role: string; roleId: string }>;
      createdAt: string;
      updatedAt: string;
    }) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      statusId: t.statusId,
      topic: t.topic,
      topicId: t.topicId,
      student: t.student ? {
        id: t.student.id,
        userId: '',
        fullName: t.student.fullName || '',
        nim: t.student.nim || '',
        email: t.student.email || '',
      } : { id: '', userId: '', fullName: '', nim: '', email: '' },
      supervisors: (t.supervisors || []).map((s) => ({
        id: s.id || '',
        lecturerId: s.lecturerId || '',
        fullName: s.fullName || '',
        role: s.role || '',
        roleId: s.roleId || '',
      })),
      startDate: null,
      deadlineDate: null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    meta: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  };
};

/**
 * Get thesis by ID
 */
export const getThesisByIdAPI = async (id: string): Promise<{ success: boolean; data: ThesisItem }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/thesis/admin/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data tugas akhir');
  }

  return response.json();
};

/**
 * Create new thesis
 */
export const createThesisAPI = async (data: CreateThesisRequest): Promise<{ success: boolean; data: ThesisItem }> => {
  const response = await fetch(getApiUrl('/adminfeatures/thesis/admin'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal membuat tugas akhir');
  }

  return response.json();
};

/**
 * Update thesis
 */
export const updateThesisAPI = async (id: string, data: UpdateThesisRequest): Promise<{ success: boolean; data: ThesisItem }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/thesis/admin/${id}`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate tugas akhir');
  }

  return response.json();
};

/**
 * Delete thesis
 */
export const deleteThesisAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/thesis/admin/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus tugas akhir');
  }

  return response.json();
};

/**
 * Get available students (without active thesis)
 */
export const getAvailableStudentsAPI = async (): Promise<{ success: boolean; data: AvailableStudent[] }> => {
  const response = await fetch(getApiUrl('/adminfeatures/thesis/admin/available-students'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data mahasiswa');
  }

  return response.json();
};

/**
 * Get all lecturers for supervisor dropdown
 */
export const getLecturersAPI = async (): Promise<{ success: boolean; data: Lecturer[] }> => {
  const response = await fetch(getApiUrl('/adminfeatures/thesis/admin/lecturers'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data dosen');
  }

  return response.json();
};

/**
 * Get supervisor roles
 */
export const getSupervisorRolesAPI = async (): Promise<{ success: boolean; data: SupervisorRole[] }> => {
  const response = await fetch(getApiUrl('/adminfeatures/thesis/admin/supervisor-roles'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data role pembimbing');
  }

  return response.json();
};

/**
 * Get thesis statuses
 */
export const getThesisStatusesAPI = async (): Promise<{ success: boolean; data: ThesisStatus[] }> => {
  const response = await fetch(getApiUrl('/adminfeatures/thesis/admin/statuses'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengambil data status tugas akhir');
  }

  return response.json();
};
