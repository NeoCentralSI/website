import type {
  CandidateLecturer,
  CatalogLecturer,
  KadepDecisionDto,
  KadepQueue,
  LecturerApprovalInbox,
  LecturerInbox,
  LecturerResponseDto,
  StudentSupervisorRequests,
  SupervisorRequest,
  SupervisorRequestDraft,
  SupervisorRequestInput,
} from '@/types/thesis-proposal.types';
import { getApiUrl } from '@/config/api';
import type { LecturerInboxKind } from '@/lib/thesisLabels';
import { apiRequest } from '@/services/auth.service';
import { getJson, parse, send } from './api';

const BASE = '/thesis-proposals';

// Student
export const getMySupervisorRequests = () =>
  getJson<StudentSupervisorRequests>(`${BASE}/me/supervisor-requests`, 'Gagal memuat pengajuan pembimbing');
export const saveDraft = (dto: SupervisorRequestInput) =>
  send<SupervisorRequestDraft>('PUT', `${BASE}/me/supervisor-request-draft`, dto, 'Gagal menyimpan draf');
export const getCatalog = () => getJson<CatalogLecturer[]>(`${BASE}/catalog`, 'Gagal memuat daftar dosen');
export const submitRequest = (dto: SupervisorRequestInput) =>
  send<SupervisorRequest>('POST', `${BASE}/supervisor-requests`, dto, 'Gagal mengirim pengajuan');
export const withdrawRequest = (id: string) =>
  send<SupervisorRequest>('POST', `${BASE}/supervisor-requests/${id}/withdraw`, undefined, 'Gagal menarik pengajuan');

// Lecturer
export const getLecturerInbox = () =>
  getJson<LecturerInbox>(`${BASE}/supervisor-requests/inbox`, 'Gagal memuat permohonan pembimbing');
/** Tugas Akhir > Permohonan (Paket E5): Pengajuan Pembimbing and the lecturer's Perubahan TA steps. */
export async function getLecturerApprovalInbox(params: {
  kind?: LecturerInboxKind;
  status?: string;
  search?: string;
  page: number;
  pageSize: number;
}): Promise<LecturerApprovalInbox> {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.kind) query.set('kind', params.kind);
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const body = await parse<LecturerApprovalInbox['data']>(
    await apiRequest(getApiUrl(`${BASE}/lecturer-inbox?${query.toString()}`)),
    'Gagal memuat permohonan',
  ) as unknown as Partial<LecturerApprovalInbox>;
  return {
    data: body.data ?? [],
    meta: body.meta ?? { page: 1, pageSize: params.pageSize, total: 0, totalPages: 1 },
    counts: body.counts ?? { waiting: 0, waitingRequests: 0, waitingChanges: 0 },
  };
}
export const markUnderReview = (id: string) =>
  send<SupervisorRequest>('POST', `${BASE}/supervisor-requests/${id}/review`, undefined, 'Gagal menandai pengajuan');
export const respondAsLecturer = (id: string, dto: LecturerResponseDto) =>
  send<SupervisorRequest>('POST', `${BASE}/supervisor-requests/${id}/respond`, dto, 'Gagal menyimpan keputusan');

// Head of Department
export const getKadepQueue = () =>
  getJson<KadepQueue>(`${BASE}/supervisor-requests/kadep-queue`, 'Gagal memuat antrean pengajuan');
export const getRecommendations = (id: string) =>
  getJson<{ alternatives: CandidateLecturer[]; message?: string }>(`${BASE}/supervisor-requests/${id}/recommendations`, 'Gagal memuat rekomendasi');
export const getAssignableLecturers = (id: string) =>
  getJson<{ lecturers: CandidateLecturer[] }>(`${BASE}/supervisor-requests/${id}/assignable-lecturers`, 'Gagal memuat daftar dosen');
export const decideAsKadep = (id: string, dto: KadepDecisionDto) =>
  send<SupervisorRequest>('POST', `${BASE}/supervisor-requests/${id}/decision`, dto, 'Gagal menyimpan keputusan');

export const getRequestDetail = (id: string) =>
  getJson<SupervisorRequest>(`${BASE}/supervisor-requests/${id}`, 'Gagal memuat detail pengajuan');
