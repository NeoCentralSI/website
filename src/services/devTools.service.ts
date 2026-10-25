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
  SetPeriodFlagsDto,
  DevToolsGuidanceList,
  UpdateGuidanceScheduleDto,
  DevToolsSemesterFlags,
  DevToolsSupervisorRequest,
  DevToolsSupervisorRequestList,
  DevToolsEffects,
  DevToolsEventKind,
  DevToolsEventMode,
  DevToolsEventTarget,
  DevToolsFinalStages,
  DevToolsScheduleDto,
  DevToolsYudisiumPeriod,
  DevToolsPeriodDatesDto,
  DevToolsParticipantStatus,
  DevToolsStudentYudisium,
  DevToolsCplRow,
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

  // --- Proposal tab (plan 10.8) ---
  getSemesterFlags: async (studentId: string): Promise<DevToolsSemesterFlags[]> => {
    const response = await apiRequest(getApiUrl(`${BASE}/students/${studentId}/period-flags`));
    return parseJson<DevToolsSemesterFlags[]>(response, 'Gagal memuat penanda SIA');
  },

  getSupervisorRequests: async (params: { search: string; page: number; pageSize: number }): Promise<DevToolsSupervisorRequestList> => {
    const url = new URL(getApiUrl(`${BASE}/supervisor-requests`));
    if (params.search) url.searchParams.set('search', params.search);
    url.searchParams.set('page', String(params.page));
    url.searchParams.set('pageSize', String(params.pageSize));
    const response = await apiRequest(url.toString());
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || 'Gagal memuat pengajuan pembimbing');
    }
    return response.json() as Promise<DevToolsSupervisorRequestList>;
  },

  setSupervisorRequestTime: async (id: string, createdAt: string): Promise<DevToolsSupervisorRequest> => {
    const response = await apiRequest(getApiUrl(`${BASE}/supervisor-requests/${id}`), { method: 'PATCH', body: JSON.stringify({ createdAt }) });
    return parseJson<DevToolsSupervisorRequest>(response, 'Gagal mengubah waktu pengajuan');
  },

  // --- SIA flags per semester (plan 10.6) ---
  setPeriodFlags: async (studentId: string, data: SetPeriodFlagsDto): Promise<string> => {
    const url = getApiUrl(`${BASE}/students/${studentId}/period-flags`);
    const response = await apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) });
    return parseMsg(response, 'Gagal mengubah penanda SIA');
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

  // --- Guidance sessions ---
  getGuidances: async (params: { search?: string; status?: string; page: number; pageSize: number }): Promise<DevToolsGuidanceList> => {
    const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);
    const response = await apiRequest(getApiUrl(`${BASE}/guidances?${query.toString()}`));
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error((result as { message?: string }).message || 'Gagal memuat sesi bimbingan');
    }
    return { data: result.data ?? [], meta: result.meta } as DevToolsGuidanceList;
  },

  updateGuidanceSchedule: async (id: string, data: UpdateGuidanceScheduleDto): Promise<string> => {
    const url = getApiUrl(`${BASE}/guidances/${id}`);
    const response = await apiRequest(url, { method: 'PATCH', body: JSON.stringify(data) });
    return parseMsg(response, 'Gagal mengubah jadwal sesi bimbingan');
  },

  // --- Seminar Hasil and Sidang TA ---
  getFinalStages: async (studentId: string): Promise<DevToolsFinalStages> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${studentId}`));
    return parseJson<DevToolsFinalStages>(response, 'Gagal memuat seminar dan sidang');
  },

  previewEvent: async (studentId: string, kind: DevToolsEventKind, mode: DevToolsEventMode, target?: DevToolsEventTarget): Promise<DevToolsEffects> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${studentId}/${kind}/preview`), { method: 'POST', body: JSON.stringify({ mode, target }) });
    return parseJson<DevToolsEffects>(response, 'Gagal memuat pratinjau');
  },

  setEventStatus: async (studentId: string, kind: DevToolsEventKind, target: DevToolsEventTarget, mode: 'change' | 'create'): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${studentId}/${kind}/status`), { method: 'POST', body: JSON.stringify({ target, mode }) });
    return parseMsg(response, 'Gagal mengubah status');
  },

  approveRevisions: async (studentId: string, kind: DevToolsEventKind): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${studentId}/${kind}/approve-revisions`), { method: 'POST' });
    return parseMsg(response, 'Gagal menyetujui revisi');
  },

  deleteEvent: async (studentId: string, kind: DevToolsEventKind): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${studentId}/${kind}`), { method: 'DELETE' });
    return parseMsg(response, kind === 'seminar' ? 'Gagal menghapus seminar' : 'Gagal menghapus sidang');
  },

  setEventSchedule: async (kind: DevToolsEventKind, eventId: string, data: DevToolsScheduleDto): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/final-stages/${kind}/${eventId}/schedule`), { method: 'PATCH', body: JSON.stringify(data) });
    return parseMsg(response, 'Gagal mengubah jadwal');
  },

  // --- Yudisium ---
  getYudisiumPeriods: async (): Promise<DevToolsYudisiumPeriod[]> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/periods`));
    return parseJson<DevToolsYudisiumPeriod[]>(response, 'Gagal memuat periode yudisium');
  },

  setYudisiumPeriodDates: async (id: string, data: DevToolsPeriodDatesDto): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/periods/${id}`), { method: 'PATCH', body: JSON.stringify(data) });
    return parseMsg(response, 'Gagal mengubah tanggal periode');
  },

  getStudentYudisium: async (studentId: string): Promise<DevToolsStudentYudisium> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}`));
    return parseJson<DevToolsStudentYudisium>(response, 'Gagal memuat yudisium mahasiswa');
  },

  previewRegisterYudisium: async (studentId: string, yudisiumId: string): Promise<DevToolsEffects> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}/register/preview`), { method: 'POST', body: JSON.stringify({ yudisiumId }) });
    return parseJson<DevToolsEffects>(response, 'Gagal memuat pratinjau');
  },

  registerYudisium: async (studentId: string, yudisiumId: string): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}/register`), { method: 'POST', body: JSON.stringify({ yudisiumId }) });
    return parseMsg(response, 'Gagal mendaftarkan mahasiswa');
  },

  previewRemoveParticipant: async (participantId: string): Promise<DevToolsEffects> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}/remove/preview`), { method: 'POST' });
    return parseJson<DevToolsEffects>(response, 'Gagal memuat pratinjau');
  },

  removeParticipant: async (participantId: string): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}`), { method: 'DELETE' });
    return parseMsg(response, 'Gagal menghapus peserta');
  },

  previewParticipantStatus: async (participantId: string, target: DevToolsParticipantStatus): Promise<DevToolsEffects> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}/status/preview`), { method: 'POST', body: JSON.stringify({ target }) });
    return parseJson<DevToolsEffects>(response, 'Gagal memuat pratinjau');
  },

  setParticipantStatus: async (participantId: string, target: DevToolsParticipantStatus): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}/status`), { method: 'POST', body: JSON.stringify({ target }) });
    return parseMsg(response, 'Gagal mengubah status peserta');
  },

  setRequirementItems: async (participantId: string, action: 'approve' | 'decline', itemId?: string): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}/requirements`), { method: 'POST', body: JSON.stringify({ action, itemId }) });
    return parseMsg(response, 'Gagal mengubah item persyaratan');
  },

  setExitSurvey: async (participantId: string, action: 'fill' | 'clear'): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/participants/${participantId}/exit-survey`), { method: 'POST', body: JSON.stringify({ action }) });
    return parseMsg(response, 'Gagal mengubah exit survey');
  },

  setCplScore: async (studentId: string, cplId: string, score: number): Promise<{ cpl: DevToolsCplRow[] }> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}/cpl/${cplId}`), { method: 'PATCH', body: JSON.stringify({ score }) });
    return parseJson<{ cpl: DevToolsCplRow[] }>(response, 'Gagal mengubah nilai CPL');
  },

  setCplPreset: async (studentId: string, preset: 'all-pass' | 'one-fail'): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}/cpl/${preset}`), { method: 'POST' });
    return parseMsg(response, 'Gagal mengubah nilai CPL');
  },

  setCplRecommendation: async (studentId: string, cplId: string, action: 'create' | 'resolve' | 'delete'): Promise<string> => {
    const response = await apiRequest(getApiUrl(`${BASE}/yudisium/students/${studentId}/cpl/${cplId}/recommendation`), { method: 'POST', body: JSON.stringify({ action }) });
    return parseMsg(response, 'Gagal mengubah rekomendasi CPL');
  },
};
