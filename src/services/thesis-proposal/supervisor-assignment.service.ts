import type { AssignmentOverview, IssueAssignmentResult, StudentProposalOverview } from '@/types/thesis-proposal.types';
import { getJson, send } from './api';

const BASE = '/thesis-proposals';
const query = (academicYearId?: string | null) => (academicYearId ? `?academicYearId=${encodeURIComponent(academicYearId)}` : '');

// Student
export const getMyProposalOverview = () =>
  getJson<StudentProposalOverview>(`${BASE}/me`, 'Gagal memuat data proposal');

// Head of Department (Sekdep and Admin read)
export const getAssignmentOverview = (academicYearId?: string | null) =>
  getJson<AssignmentOverview>(`${BASE}/supervisor-assignments${query(academicYearId)}`, 'Gagal memuat Penetapan Pembimbing');
export const issueAssignment = (academicYearId: string) =>
  send<IssueAssignmentResult>('POST', `${BASE}/supervisor-assignments`, { academicYearId }, 'Gagal menerbitkan Penetapan Pembimbing');
/** Opened with `lib/authenticatedFile` (Authorization header, never a token in the URL). */
export const assignmentPreviewUrl = (academicYearId?: string | null) =>
  `${BASE}/supervisor-assignments/preview${query(academicYearId)}`;
