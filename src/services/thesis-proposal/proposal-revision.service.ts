import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { LecturerProposalRevisionState, ProposalRevision, ProposalRevisionAction } from '@/types/thesis-proposal.types';
import { getJson, parse, send } from './api';

const BASE = '/thesis-proposals';

/** Student: send (or replace, before review) the revised proposal (PDF). */
export async function submitProposalRevision(file: File) {
  const body = new FormData();
  body.append('file', file);
  const response = await apiRequest(getApiUrl(`${BASE}/me/proposal-revision`), { method: 'POST', body });
  return parse<{ revision: ProposalRevision; replaced: boolean }>(response, 'Gagal mengunggah proposal revisi');
}

/** Supervisors (and Kadep, Sekdep, Admin): the revision cycle of one thesis. */
export const getProposalRevision = (thesisId: string) =>
  getJson<LecturerProposalRevisionState>(`${BASE}/theses/${encodeURIComponent(thesisId)}/proposal-revision`, 'Gagal memuat proposal revisi');

/** Pembimbing 1: approve (the thesis returns to research) or ask for a revision (notes required). */
export const reviewProposalRevision = (id: string, input: { action: ProposalRevisionAction; notes?: string | null }) =>
  send<{ revision: ProposalRevision; thesis: { id: string; status: string; startDate: string | null } | null }>(
    'POST',
    `${BASE}/proposal-revisions/${encodeURIComponent(id)}/review`,
    input,
    'Gagal menyimpan tinjauan proposal revisi',
  );
