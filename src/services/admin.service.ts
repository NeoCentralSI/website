import { getApiUrl } from '@/config/api';

export interface User {
  id: string;
  fullName: string;
  email: string;
  identityNumber?: string;
  identityType?: 'NIM' | 'NIP' | 'OTHER';
  isVerified: boolean;
  roles: Array<{
    id: string;
    name: string;
    status: 'active' | 'inactive';
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  semester: 'ganjil' | 'genap';
  year: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  name: string;
  location: string | null;
  capacity: number | null;
  relationCount: number;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  roles?: string[];
  identityNumber?: string;
  identityType?: 'NIM' | 'NIP' | 'OTHER';
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  roles?: Array<string | { name: string; status?: 'active' | 'inactive' }>;
  identityNumber?: string;
  identityType?: 'NIM' | 'NIP' | 'OTHER';
  isVerified?: boolean;
}

export interface CreateAcademicYearRequest {
  semester: 'ganjil' | 'genap';
  year?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAcademicYearRequest {
  semester?: 'ganjil' | 'genap';
  year?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface CreateRoomRequest {
  name: string;
  location?: string | null;
  capacity?: number | null;
}

export interface UpdateRoomRequest {
  name?: string;
  location?: string | null;
  capacity?: number | null;
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

// Import students from CSV
export const importStudentsCsvAPI = async (file: File): Promise<{ summary: any }> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getApiUrl('/adminfeatures/students/import'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Import gagal');
  }

  return response.json();
};

// Create user
export const createUserAPI = async (data: CreateUserRequest): Promise<{ user: User }> => {
  const response = await fetch(getApiUrl('/adminfeatures/users'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal membuat user');
  }

  return response.json();
};

// Update user
export const updateUserAPI = async (id: string, data: UpdateUserRequest): Promise<{ user: User }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate user');
  }

  return response.json();
};

// Create academic year
export const createAcademicYearAPI = async (data: CreateAcademicYearRequest): Promise<{ academicYear: AcademicYear }> => {
  const response = await fetch(getApiUrl('/adminfeatures/academic-years'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal membuat tahun ajaran');
  }

  return response.json();
};

// Update academic year
export const updateAcademicYearAPI = async (id: string, data: UpdateAcademicYearRequest): Promise<{ academicYear: AcademicYear }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/academic-years/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate tahun ajaran');
  }

  return response.json();
};

// Get all academic years
export const getAcademicYearsAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  academicYears: AcademicYear[];
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

  const response = await fetch(getApiUrl(`/adminfeatures/academic-years?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat tahun ajaran');
  }

  return response.json();
};

// Get active academic year
export const getActiveAcademicYearAPI = async (): Promise<{
  academicYear: AcademicYear | null;
}> => {
  const response = await fetch(getApiUrl('/adminfeatures/academic-years/active'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat tahun ajaran aktif');
  }

  return response.json();
};

export type GetRoomsAPIParams = {
  page?: number;
  /** Page size (preferred; mirrors CPL `limit`) */
  limit?: number;
  /** @deprecated use `limit` */
  pageSize?: number;
  search?: string;
  /** all | available (no relations) | in_use */
  status?: 'all' | 'available' | 'in_use';
};

// Get rooms (server-side pagination; response matches CPL list shape: data + total)
export const getRoomsAPI = async (
  params?: GetRoomsAPIParams
): Promise<{
  success: boolean;
  message?: string;
  data: Room[];
  total: number;
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  const limit = params?.limit ?? params?.pageSize;
  if (limit) queryParams.append('limit', String(limit));
  if (params?.search) queryParams.append('search', params.search);
  if (params?.status && params.status !== 'all') {
    queryParams.append('status', params.status);
  }

  const response = await fetch(getApiUrl(`/adminfeatures/rooms?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data ruangan');
  }

  return response.json();
};

export const createRoomAPI = async (data: CreateRoomRequest): Promise<{ room: Room }> => {
  const response = await fetch(getApiUrl('/adminfeatures/rooms'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menambahkan ruangan');
  }

  return response.json();
};

export const updateRoomAPI = async (id: string, data: UpdateRoomRequest): Promise<{ room: Room }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/rooms/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengubah data ruangan');
  }

  return response.json();
};

export const deleteRoomAPI = async (id: string): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/rooms/${id}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus ruangan');
  }

  return response.json();
};

// Get all users
export const getUsersAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  identityType?: string;
  role?: string;
  isVerified?: boolean;
  enrollmentYear?: string | number;
}): Promise<{
  users: User[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.pageSize !== undefined) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.identityType) queryParams.append('identityType', params.identityType);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());
  if (params?.enrollmentYear) queryParams.append('enrollmentYear', params.enrollmentYear.toString());

  const response = await fetch(getApiUrl(`/adminfeatures/users?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data user');
  }

  return response.json();
};

// Student interface with detailed info
export interface Student {
  id: string;
  fullName: string;
  email: string;
  identityNumber?: string;
  identityType?: 'NIM' | 'NIP' | 'OTHER';
  phone?: string;
  student?: {
    enrollmentYear: number | null;
    sksCompleted: number;
    currentSemester: number | null;
    status: string | null;
    mandatoryCoursesCompleted: boolean;
    mkwuCompleted: boolean;
    internshipCompleted: boolean;
    kknCompleted: boolean;
    researchMethodCompleted?: boolean;
    activeTheses: Array<{
      title: string;
      supervisors: Array<{
        role: string;
        fullName: string;
      }>;
    }>;
  };
}

// Lecturer interface with workload info
export interface Lecturer {
  id: string;
  fullName: string;
  email: string;
  identityNumber?: string;
  identityType?: 'NIM' | 'NIP' | 'OTHER';
  phone?: string;
  lecturer: {
    activeGuidances: number;
    seminarJuries: number;
    defenceJuries: number;
    scienceGroup: string | null;
    scienceGroupId: string | null;
  };
}

// Get all students
export const getStudentsAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{
  students: Student[];
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

  const response = await fetch(getApiUrl(`/adminfeatures/students?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data mahasiswa');
  }

  return response.json();
};

// Trigger SIA sync (fetch from SIA service and cache)
export const triggerSiaSyncAPI = async (): Promise<{
  success: boolean;
  message?: string;
  summary?: {
    cplCreated?: number;
    cplUpdated?: number;
    cplSkippedProtected?: number;
    cplUnmatchedCodes?: number;
  };
}> => {
  const response = await fetch(getApiUrl('/sia/sync'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menjalankan sync SIA');
  }

  return response.json();
};

// Get all lecturers
export const getLecturersAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  scienceGroupId?: string;
}): Promise<{
  lecturers: Lecturer[];
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
  if (params?.scienceGroupId) queryParams.append('scienceGroupId', params.scienceGroupId);

  const response = await fetch(getApiUrl(`/adminfeatures/lecturers?${queryParams}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data dosen');
  }

  return response.json();
};

// Student Detail interface
export interface StudentDetail {
  id: string;
  fullName: string;
  email: string;
  identityNumber?: string;
  identityType?: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
  student: {
    enrollmentYear: number;
    sksCompleted: number;
    status: string | null;
    currentSemester?: number | null;
    mandatoryCoursesCompleted?: boolean | null;
    mkwuCompleted?: boolean | null;
    internshipCompleted?: boolean | null;
    kknCompleted?: boolean | null;
    researchMethodCompleted?: boolean | null;
  };
  cplScores?: Array<{
    cplId: string;
    cplCode: string;
    cplDescription?: string;
    score: number;
    minimalScore?: number | null;
    status: string;
  }>;
  roles: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  theses: Array<{
    id: string;
    title: string;
    status: string | null;
    topic: string | null;
    startDate: string | null;
    deadlineDate: string | null;
    supervisors: Array<{
      id: string;
      role: string;
      fullName: string;
      email: string;
    }>;
    examiners: Array<{
      id: string;
      role: string;
      fullName: string;
      email: string;
    }>;
    milestones: {
      completed: number;
      total: number;
      progress: number;
      items: Array<{
        id: string;
        title: string;
        status: string;
        targetDate: string | null;
        completedAt: string | null;
      }>;
    };
    guidances: {
      completed: number;
      total: number;
      recent: Array<{
        id: string;
        status: string;
        approvedDate: string | null;
        completedAt: string | null;
      }>;
    };
    seminars: Array<{
      id: string;
      type: string;
      status: string;
      scheduledAt: string | null;
      result: string | null;
      score: number | null;
    }>;
    defences: Array<{
      id: string;
      status: string;
      scheduledAt: string | null;
      result: string | null;
      score: number | null;
    }>;
  }>;
}

// Lecturer Detail interface
export interface LecturerDetail {
  id: string;
  fullName: string;
  email: string;
  identityNumber?: string;
  identityType?: string;
  phoneNumber?: string;
  isVerified: boolean;
  createdAt: string;
  lecturer: {
    scienceGroup: string | null;
  };
  roles: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  statistics: {
    activeSupervising: number;
    completedSupervising: number;
    totalSupervising: number;
    examining: number;
  };
  supervising: Array<{
    thesisId: string;
    title: string;
    status: string | null;
    role: string;
    student: {
      id: string;
      fullName: string;
      nim: string;
    };
  }>;
  completedSupervising: Array<{
    thesisId: string;
    title: string;
    status: string | null;
    role: string;
    student: {
      id: string;
      fullName: string;
      nim: string;
    };
  }>;
  examining: Array<{
    thesisId: string;
    title: string;
    status: string | null;
    role: string;
    student: {
      id: string;
      fullName: string;
      nim: string;
    };
  }>;
  recentGuidances: Array<{
    id: string;
    approvedDate: string;
    studentName: string;
    studentNim: string;
    thesisTitle: string;
  }>;
}

// Get student detail
export const getStudentDetailAPI = async (id: string): Promise<{ data: StudentDetail }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/students/${id}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat detail mahasiswa');
  }

  return response.json();
};

// Get lecturer detail
export const getLecturerDetailAPI = async (id: string): Promise<{ data: LecturerDetail }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/lecturers/${id}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat detail dosen');
  }

  return response.json();
};

// ========== Kadep Quick Actions ==========

export interface KadepQuickActionsStats {
  failedThesesCount: number;
  pendingChangeRequestsCount: number;
}

export interface FailedThesis {
  id: string;
  title: string;
  rating: string;
  createdAt: string;
  student: {
    id: string;
    fullName: string;
    nim: string;
    email: string;
  };
}

/**
 * Get Kadep quick actions stats (failed thesis count, pending change requests count)
 */
export const getKadepQuickActionsStats = async (): Promise<KadepQuickActionsStats> => {
  const response = await fetch(getApiUrl('/adminfeatures/kadep/quick-actions'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data quick actions');
  }

  const result = await response.json();
  return result.data;
};

/**
 * Get list of FAILED theses
 */
export const getFailedThesesList = async (): Promise<{ data: FailedThesis[]; total: number }> => {
  const response = await fetch(getApiUrl('/adminfeatures/kadep/failed-theses'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat data thesis gagal');
  }

  return response.json();
};

export const updateLecturerByAdminAPI = async (id: string, data: { scienceGroupId: string | null }): Promise<{ data: any }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/lecturers/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mengupdate dosen');
  }
  return response.json();
};

export const adminUpdateStudentAPI = async (id: string, data: {
  status: string;
  sksCompleted: number;
  enrollmentYear?: number;
  currentSemester?: number;
  mandatoryCoursesCompleted?: boolean;
  mkwuCompleted?: boolean;
  internshipCompleted?: boolean;
  kknCompleted?: boolean;
  researchMethodCompleted?: boolean;
}): Promise<{ data: any }> => {
  const response = await fetch(getApiUrl(`/adminfeatures/students/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify({
      status: data.status,
      skscompleted: data.sksCompleted,
      enrollmentYear: data.enrollmentYear,
      currentSemester: data.currentSemester,
      mandatoryCoursesCompleted: data.mandatoryCoursesCompleted,
      mkwuCompleted: data.mkwuCompleted,
      internshipCompleted: data.internshipCompleted,
      kknCompleted: data.kknCompleted,
      researchMethodCompleted: data.researchMethodCompleted
    }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mengupdate mahasiswa');
  }
  return response.json();
};

// ========== Science Groups ==========

export interface ScienceGroup {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export const getScienceGroupsAPI = async (): Promise<{ data: ScienceGroup[] }> => {
  const response = await fetch(getApiUrl('/science-groups'), {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal memuat Kelompok Keilmuan');
  }
  return response.json();
};

export const createScienceGroupAPI = async (data: { name: string }): Promise<{ data: ScienceGroup }> => {
  const response = await fetch(getApiUrl('/science-groups'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal membuat Kelompok Keilmuan');
  }
  return response.json();
};

export const updateScienceGroupAPI = async (id: string, data: { name: string }): Promise<{ data: ScienceGroup }> => {
  const response = await fetch(getApiUrl(`/science-groups/${id}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal mengupdate Kelompok Keilmuan');
  }
  return response.json();
};

export const deleteScienceGroupAPI = async (id: string): Promise<{ message: string }> => {
  const response = await fetch(getApiUrl(`/science-groups/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal menghapus Kelompok Keilmuan');
  }
  return response.json();
};

// Excel Import APIs (Bulk JSON upload)
export const importStudentsExcelAPI = async (data: any[]): Promise<any> => {
  const response = await fetch(getApiUrl('/adminfeatures/students/import-excel'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal import mahasiswa');
  }
  return response.json();
};

export const importLecturersExcelAPI = async (data: any[]): Promise<any> => {
  const response = await fetch(getApiUrl('/adminfeatures/lecturers/import-excel'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal import dosen');
  }
  return response.json();
};

export const importUsersExcelAPI = async (data: any[]): Promise<any> => {
  const response = await fetch(getApiUrl('/adminfeatures/users/import-excel'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal import user');
  }
  return response.json();
};

export const importAcademicYearsExcelAPI = async (data: any[]): Promise<any> => {
  const response = await fetch(getApiUrl('/adminfeatures/academic-years/import-excel'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Gagal import tahun ajaran');
  }
  return response.json();
};
