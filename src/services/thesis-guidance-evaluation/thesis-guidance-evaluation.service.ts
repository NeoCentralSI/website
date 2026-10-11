import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  DepartmentEvaluations,
  SubmitEvaluationDto,
  ThesisGuidanceEvaluation,
  ThesisGuidanceEvaluationContext,
} from '@/types/thesis-guidance-evaluation.types';

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

export async function getDepartmentEvaluations(params: {
  scope: 'pending' | 'history';
  search?: string;
  page: number;
  pageSize: number;
}): Promise<DepartmentEvaluations> {
  const query = new URLSearchParams({ scope: params.scope, page: String(params.page), pageSize: String(params.pageSize) });
  if (params.search) query.set('search', params.search);
  const response = await apiRequest(getApiUrl(`${BASE}/department?${query.toString()}`));
  const body = (await response.json().catch(() => ({}))) as Partial<DepartmentEvaluations> & { message?: string };
  if (!response.ok) throw new Error(body.message || 'Gagal memuat evaluasi bimbingan');
  return { data: body.data ?? [], meta: body.meta ?? { page: 1, pageSize: params.pageSize, total: 0, totalPages: 1 } };
}

export async function decideEvaluation(evaluationId: string, dto: { approve: boolean; notes?: string | null }) {
  const response = await apiRequest(getApiUrl(`${BASE}/${evaluationId}/decision`), { method: 'POST', body: JSON.stringify(dto) });
  return parse<ThesisGuidanceEvaluation>(response, 'Gagal menyimpan keputusan');
}
