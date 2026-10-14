import type {
  CandidateLecturer,
  CatalogLecturer,
  KadepDecisionDto,
  KadepQueue,
  LecturerInbox,
  LecturerResponseDto,
  StudentSupervisorRequests,
  SupervisorRequest,
  SupervisorRequestDraft,
  SupervisorRequestInput,
} from '@/types/thesis-proposal.types';
import { getJson, send } from './api';

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
