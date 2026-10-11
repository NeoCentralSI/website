import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  BatchDecisionResult,
  ChangeDecisionDto,
  DepartmentChangeRequests,
  LecturerChangeRequests,
  SubmitChangeRequestDto,
  SubmitTransferDto,
  SupervisorOption,
  ThesisChangeContext,
  ThesisChangeRequest,
} from '@/types/thesis-change-request.types';
import type { SupervisorPosition } from '@/lib/thesisLabels';

const BASE = '/thesis-change-requests';

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  details?: { path: string; message: string }[];
}

/** Reads the JSON envelope; a validation error shows its first field message. */
async function parse<T>(response: Response, fallback: string): Promise<Envelope<T>> {
  const body = (await response.json().catch(() => ({}))) as Partial<Envelope<T>>;
  if (!response.ok) {
    throw new Error(body.details?.[0]?.message || body.message || fallback);
  }
  return body as Envelope<T>;
}

const post = (path: string, body?: unknown) =>
  apiRequest(getApiUrl(`${BASE}${path}`), { method: 'POST', ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

/** Whether a request may be made for a thesis (the caller's own when `thesisId` is omitted), and its requests. */
export async function getThesisChangeContext(thesisId?: string): Promise<ThesisChangeContext> {
  const query = thesisId ? `?thesisId=${encodeURIComponent(thesisId)}` : '';
  const response = await apiRequest(getApiUrl(`${BASE}/context${query}`));
  return (await parse<ThesisChangeContext>(response, 'Gagal memuat pengajuan perubahan')).data;
}

export async function getSupervisorOptions(position?: SupervisorPosition): Promise<SupervisorOption[]> {
  const query = position ? `?position=${position}` : '';
  const response = await apiRequest(getApiUrl(`${BASE}/supervisor-options${query}`));
  return (await parse<SupervisorOption[]>(response, 'Gagal memuat daftar dosen')).data;
}

export async function submitChangeRequest(dto: SubmitChangeRequestDto) {
  return parse<ThesisChangeRequest>(await post('', dto), 'Gagal mengirim pengajuan perubahan');
}

export async function submitTransfer(dto: SubmitTransferDto) {
  return parse<{ batchId: string; requests: ThesisChangeRequest[] }>(await post('/transfer', dto), 'Gagal mengajukan pengalihan mahasiswa');
}

export async function getLecturerChangeRequests(): Promise<LecturerChangeRequests> {
  const response = await apiRequest(getApiUrl(`${BASE}/lecturer`));
  return (await parse<LecturerChangeRequests>(response, 'Gagal memuat pengajuan perubahan')).data;
}

export async function decideAsLecturer(requestId: string, dto: ChangeDecisionDto) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/lecturer-decision`, dto), 'Gagal menyimpan keputusan');
}

export async function cancelChangeRequest(requestId: string) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/cancel`), 'Gagal membatalkan pengajuan');
}

export async function getDepartmentChangeRequests(params: {
  scope: 'pending' | 'history';
  search?: string;
  page: number;
  pageSize: number;
}): Promise<DepartmentChangeRequests> {
  const query = new URLSearchParams({ scope: params.scope, page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search) query.set('search', params.search);
  const response = await apiRequest(getApiUrl(`${BASE}/department?${query.toString()}`));
  const body = (await response.json().catch(() => ({}))) as Partial<DepartmentChangeRequests> & { message?: string };
  if (!response.ok) throw new Error(body.message || 'Gagal memuat pengajuan perubahan');
  return { data: body.data ?? [], meta: body.meta ?? { page: 1, pageSize: params.pageSize, total: 0, totalPages: 1 } };
}

export async function decideAsKadep(requestId: string, dto: ChangeDecisionDto) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/decision`, dto), 'Gagal menyimpan keputusan');
}

export async function decideBatchAsKadep(batchId: string, dto: ChangeDecisionDto) {
  return parse<BatchDecisionResult>(await post(`/batch/${batchId}/decision`, dto), 'Gagal menyimpan keputusan');
}
