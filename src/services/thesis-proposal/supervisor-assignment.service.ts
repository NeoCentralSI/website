import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { AssignmentBoard, AssignmentOverview, FinalProposalAttempt, IssueAssignmentResult, StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getJson, parse, send } from './api';

const BASE = '/thesis-proposals';
const query = (academicYearId?: string | null) => (academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '');

// Student
export const getMyProposalOverview = () =>
  getJson<StudentProposalOverview>(`${BASE}/me`, 'Gagal memuat data proposal');
/** Send or replace the final proposal (PDF) of the running period's attempt. */
export async function submitFinalProposal(file: File) {
  const body = new FormData();
  body.append('file', file);
  const response = await apiRequest(getApiUrl(`${BASE}/me/final-proposal`), { method: 'POST', body });
  return parse<{ attempt: FinalProposalAttempt; replaced: boolean }>(response, 'Gagal mengunggah proposal final');
}

// Head of Department (Sekdep and Admin read)
export const getAssignmentOverview = (academicYearId?: string | null) =>
  getJson<AssignmentOverview>(`${BASE}/supervisor-assignments${query(academicYearId)}`, 'Gagal memuat Penetapan Pembimbing');
/** The merged "Penetapan" panel of one semester. */
export const getAssignmentBoard = (academicYearId?: string | null) =>
  getJson<AssignmentBoard>(`${BASE}/supervisor-assignments/board${query(academicYearId)}`, 'Gagal memuat Penetapan Pembimbing');
export const issueAssignment = (academicYearId: string) =>
  send<IssueAssignmentResult>('POST', `${BASE}/supervisor-assignments`, { academicYearId }, 'Gagal menerbitkan Penetapan Pembimbing');
/** Opened with `lib/authenticatedFile` (Authorization header, never a token in the URL). */
export const assignmentPreviewUrl = (academicYearId?: string | null) =>
  `${BASE}/supervisor-assignments/preview${query(academicYearId)}`;
