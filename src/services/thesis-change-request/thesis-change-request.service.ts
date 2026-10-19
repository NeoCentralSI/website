import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  BatchDecisionResult,
  ChangeDecisionDto,
  ChangeRequestInbox,
  ChangeRequestKindFilter,
  SubmitChangeRequestDto,
  SubmitTransferDto,
  SupervisorOption,
  ThesisChangeContext,
  ThesisChangeRequest,
} from '@/types/thesis-change-request.types';
import type { ChangeRequestViewStatus, SupervisorPosition } from '@/lib/thesisLabels';

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

export async function decideAsLecturer(requestId: string, dto: ChangeDecisionDto) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/lecturer-decision`, dto), 'Gagal menyimpan keputusan');
}

export async function cancelChangeRequest(requestId: string) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/cancel`), 'Gagal membatalkan pengajuan');
}

/** Tugas Akhir > Perubahan (Ketua Departemen): one page sorted by status priority. */
export async function getChangeRequestInbox(params: {
  status?: ChangeRequestViewStatus;
  kind?: ChangeRequestKindFilter;
  search?: string;
  page?: number;
  pageSize?: number;
  /** The open requests of one "Alihkan Mahasiswa" batch instead of a filter. */
  batchId?: string;
}): Promise<ChangeRequestInbox> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.kind) query.set('kind', params.kind);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  if (params.batchId) query.set('batchId', params.batchId);
  const response = await apiRequest(getApiUrl(`${BASE}/inbox?${query.toString()}`));
  const body = (await response.json().catch(() => ({}))) as Partial<ChangeRequestInbox> & { message?: string };
  if (!response.ok) throw new Error(body.message || 'Gagal memuat pengajuan perubahan');
  return {
    data: body.data ?? [],
    meta: body.meta ?? { page: 1, pageSize: params.pageSize ?? 10, total: 0, totalPages: 1 },
    counts: body.counts ?? { awaitingDecision: 0, inProgress: 0 },
  };
}

export async function decideAsKadep(requestId: string, dto: ChangeDecisionDto) {
  return parse<ThesisChangeRequest>(await post(`/${requestId}/decision`, dto), 'Gagal menyimpan keputusan');
}

export async function decideBatchAsKadep(batchId: string, dto: ChangeDecisionDto) {
  return parse<BatchDecisionResult>(await post(`/batch/${batchId}/decision`, dto), 'Gagal menyimpan keputusan');
}
