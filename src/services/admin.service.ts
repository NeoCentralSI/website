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
  year: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
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
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateAcademicYearRequest {
  semester?: 'ganjil' | 'genap';
  year?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

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

// Get all users
export const getUsersAPI = async (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  identityType?: string;
  role?: string;
  isVerified?: boolean;
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
  if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.identityType) queryParams.append('identityType', params.identityType);
  if (params?.role) queryParams.append('role', params.role);
  if (params?.isVerified !== undefined) queryParams.append('isVerified', params.isVerified.toString());

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
  student: {
    enrollmentYear: number;
    sksCompleted: number;
    status: string;
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
export const triggerSiaSyncAPI = async (): Promise<{ success: boolean; message?: string }> => {
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
  };
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
