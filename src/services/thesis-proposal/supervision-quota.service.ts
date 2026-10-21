import type { LecturerLoadRow, SupervisionLimits, SupervisionLoadOverview } from '@/types/thesis-proposal.types';
import { getJson, send } from './api';

const BASE = '/supervision-quotas';

export const getLoadOverview = (academicYearId?: string) =>
  getJson<SupervisionLoadOverview>(`${BASE}${academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : ''}`, 'Gagal memuat batas bimbingan');
export const setGeneralLimits = (limits: SupervisionLimits) =>
  send<SupervisionLoadOverview>('PUT', `${BASE}/general`, limits, 'Gagal menyimpan batas umum');
export const setPeriodLimits = (academicYearId: string, limits: SupervisionLimits) =>
  send<SupervisionLoadOverview>('PUT', `${BASE}/periods/${academicYearId}`, limits, 'Gagal menyimpan batas periode');
export const clearPeriodLimits = (academicYearId: string) =>
  send<SupervisionLoadOverview>('DELETE', `${BASE}/periods/${academicYearId}`, undefined, 'Gagal menghapus batas periode');
export const getMyLoad = () =>
  getJson<Omit<SupervisionLoadOverview, 'lecturers'> & { me: LecturerLoadRow | null }>(`${BASE}/me`, 'Gagal memuat beban bimbingan');
export const setAcceptingRequests = (acceptingRequests: boolean) =>
  send<{ lecturerId: string; acceptingRequests: boolean }>('PATCH', `${BASE}/me/accepting-requests`, { acceptingRequests }, 'Gagal mengubah penerimaan pengajuan');
