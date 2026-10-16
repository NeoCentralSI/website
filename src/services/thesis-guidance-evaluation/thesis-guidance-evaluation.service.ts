import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  EvaluationInbox,
  SubmitEvaluationDto,
  ThesisGuidanceEvaluation,
  ThesisGuidanceEvaluationContext,
} from '@/types/thesis-guidance-evaluation.types';

import type { GuidanceEvaluationViewStatus } from '@/lib/thesisLabels';

const BASE = '/thesis-guidance-evaluations';

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  details?: { path: string; message: string }[];
}

async function parse<T>(response: Response, fallback: string): Promise<Envelope<T>> {
  const body = (await response.json().catch(() => ({}))) as Partial<Envelope<T>>;
  if (!response.ok) {
    throw new Error(body.details?.[0]?.message || body.message || fallback);
  }
  return body as Envelope<T>;
}

/** Evaluations of a thesis (the caller's own when `thesisId` is omitted) and what is due. */
export async function getEvaluationContext(thesisId?: string): Promise<ThesisGuidanceEvaluationContext> {
  const query = thesisId ? `?thesisId=${encodeURIComponent(thesisId)}` : '';
  const response = await apiRequest(getApiUrl(`${BASE}/context${query}`));
  return (await parse<ThesisGuidanceEvaluationContext>(response, 'Gagal memuat evaluasi bimbingan')).data;
}

export async function submitEvaluation(dto: SubmitEvaluationDto) {
  const response = await apiRequest(getApiUrl(BASE), { method: 'POST', body: JSON.stringify(dto) });
  return parse<ThesisGuidanceEvaluation>(response, 'Gagal mengirim evaluasi bimbingan');
}

/** Tugas Akhir > Evaluasi (Ketua Departemen): one page sorted by status priority (Paket E5). */
export async function getEvaluationInbox(params: { status?: GuidanceEvaluationViewStatus; search?: string; page: number; pageSize: number }): Promise<EvaluationInbox> {
  const query = new URLSearchParams({ page: String(params.page), pageSize: String(params.pageSize) });
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  const response = await apiRequest(getApiUrl(`${BASE}/inbox?${query.toString()}`));
  const body = (await response.json().catch(() => ({}))) as Partial<EvaluationInbox> & { message?: string };
  if (!response.ok) throw new Error(body.message || 'Gagal memuat evaluasi bimbingan');
  return {
    data: body.data ?? [],
    meta: body.meta ?? { page: 1, pageSize: params.pageSize, total: 0, totalPages: 1 },
    counts: body.counts ?? { awaitingDecision: 0 },
  };
}

export async function decideEvaluation(evaluationId: string, dto: { approve: boolean; notes?: string | null }) {
  const response = await apiRequest(getApiUrl(`${BASE}/${evaluationId}/decision`), { method: 'POST', body: JSON.stringify(dto) });
  return parse<ThesisGuidanceEvaluation>(response, 'Gagal menyimpan keputusan');
}
