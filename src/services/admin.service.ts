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
