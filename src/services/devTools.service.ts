/**
 * DEV TOOLS SERVICE
 * ⚠️ DELETE THIS FILE when dev tools are no longer needed.
 */
import { getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  DevToolsStudent,
  DevToolsStudentDetail,
  UpdateStudentDto,
  UpdateUserDto,
  ThesisRecord,
  CreateUserDto,
  DevToolsUserListItem,
  RoleOption,
  DevToolsAcademicYear,
  CloseMetopenPeriodResult,
} from '@/types/devTools.types';

const BASE = '/devtools';

async function parseJson<T>(response: Response, fallbackMsg: string): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || fallbackMsg);
  }
  const result = await response.json();
  return result.data as T;
}

async function parseMsg(response: Response, fallbackMsg: string): Promise<string> {
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((result as { message?: string }).message || fallbackMsg);
  }
  return (result as { message?: string }).message || 'OK';
}

export const devToolsService = {
  // --- Students ---
  getStudents: async (search?: string, status?: string): Promise<DevToolsStudent[]> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    const qs = params.toString();
    const url = getApiUrl(`${BASE}/students${qs ? `?${qs}` : ''}`);
    const response = await apiRequest(url);
    return parseJson<DevToolsStudent[]>(response, 'Gagal memuat daftar mahasiswa');
  },

  getStudentDetail: async (id: string): Promise<DevToolsStudentDetail> => {
    const url = getApiUrl(`${BASE}/students/${id}`);
    const response = await apiRequest(url);
    return parseJson<DevToolsStudentDetail>(response, 'Gagal memuat detail mahasiswa');
  },

  updateStudent: async (id: string, data: UpdateStudentDto): Promise<void> => {
    const url = getApiUrl(`${BASE}/students/${id}`);
    const response = await apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Gagal memperbarui data mahasiswa');
    }
  },

  resetStudent: async (id: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/students/${id}/reset`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseMsg(response, 'Gagal mereset snapshot akademik mahasiswa');
  },

  resetStudentProgress: async (id: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/students/${id}/reset-progress`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseMsg(response, 'Gagal mereset progress SIMPTA mahasiswa');
  },

  // --- Users ---
  getUsers: async (search?: string): Promise<DevToolsUserListItem[]> => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    const qs = params.toString();
    const url = getApiUrl(`${BASE}/users${qs ? `?${qs}` : ''}`);
    const response = await apiRequest(url);
    return parseJson<DevToolsUserListItem[]>(response, 'Gagal memuat daftar user');
  },

  updateUser: async (id: string, data: UpdateUserDto): Promise<void> => {
    const url = getApiUrl(`${BASE}/users/${id}`);
    const response = await apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Gagal memperbarui data user');
    }
  },

  deleteUser: async (id: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/users/${id}`);
    const response = await apiRequest(url, { method: 'DELETE' });
    return parseMsg(response, 'Gagal menghapus user');
  },

  changePassword: async (id: string, password: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/users/${id}/password`);
    const response = await apiRequest(url, { method: 'PATCH', body: JSON.stringify({ password }) });
    return parseMsg(response, 'Gagal mengubah password');
  },

  createUser: async (data: CreateUserDto): Promise<string> => {
    const url = getApiUrl(`${BASE}/users`);
    const response = await apiRequest(url, { method: 'POST', body: JSON.stringify(data) });
    return parseMsg(response, 'Gagal membuat user');
  },

  // --- Roles ---
  getRoles: async (): Promise<RoleOption[]> => {
    const url = getApiUrl(`${BASE}/roles`);
    const response = await apiRequest(url);
    return parseJson<RoleOption[]>(response, 'Gagal memuat daftar role');
  },

  // --- Metopen Eligibility Snapshot ---
  setMetopenEligibility: async (studentId: string, eligibleMetopen: boolean | null): Promise<string> => {
    const url = getApiUrl(`${BASE}/metopen-eligibility/${studentId}`);
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ eligibleMetopen }),
    });
    return parseMsg(response, 'Gagal mengubah snapshot eligibility Metopen');
  },

  setThesisCourseEligibility: async (studentId: string, takingThesisCourse: boolean | null): Promise<string> => {
    const url = getApiUrl(`${BASE}/thesis-course-eligibility/${studentId}`);
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ takingThesisCourse }),
    });
    return parseMsg(response, 'Gagal mengubah snapshot MK Tugas Akhir');
  },

  // --- Thesis ---
  getTheses: async (studentId: string): Promise<ThesisRecord[]> => {
    const url = getApiUrl(`${BASE}/thesis/${studentId}`);
    const response = await apiRequest(url);
    return parseJson<ThesisRecord[]>(response, 'Gagal memuat data thesis');
  },

  deleteThesis: async (id: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/thesis/${id}`);
    const response = await apiRequest(url, { method: 'DELETE' });
    return parseMsg(response, 'Gagal menghapus thesis');
  },

  getAcademicYears: async (): Promise<DevToolsAcademicYear[]> => {
    const url = getApiUrl(`${BASE}/academic-years`);
    const response = await apiRequest(url);
    return parseJson<DevToolsAcademicYear[]>(response, 'Gagal memuat tahun ajaran');
  },

  setThesisAcademicYear: async (thesisId: string, academicYearId: string): Promise<string> => {
    const url = getApiUrl(`${BASE}/thesis/${thesisId}/academic-year`);
    const response = await apiRequest(url, {
      method: 'PATCH',
      body: JSON.stringify({ academicYearId }),
    });
    return parseMsg(response, 'Gagal menandai thesis ke tahun ajaran');
  },

  closeMetopenPeriod: async (
    closedAcademicYearId: string,
    dryRun: boolean,
    force = false,
  ): Promise<CloseMetopenPeriodResult> => {
    const url = getApiUrl(`${BASE}/scenarios/close-metopen-period`);
    const response = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify({ closedAcademicYearId, dryRun, force }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Gagal menutup periode Metopel');
    }
    const result = await response.json();
    return result.data as CloseMetopenPeriodResult;
  },
};
