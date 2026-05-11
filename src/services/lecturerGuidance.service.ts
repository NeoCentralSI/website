import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';

const EP = API_CONFIG.ENDPOINTS.THESIS_LECTURER;

// ============================================
// Types
// ============================================

export interface GuidanceItem {
  id: string;
  thesisId: string;
  supervisorId: string | null;
  studentId?: string;
  studentName?: string;
  studentNim?: string;
  studentEmail?: string | null;
  status: string;
  phase?: string;
  location?: string | null;
  requestedDate: string | null;
  approvedDate: string | null;
  requestedDateFormatted?: string;
  approvedDateFormatted?: string;
  summarySubmittedAtFormatted?: string | null;
  duration: number;
  notes: string | null;
  studentNotes: string | null;
  supervisorFeedback: string | null;
  rejectionReason: string | null;
  sessionSummary: string | null;
  actionItems: string | null;
  summarySubmittedAt: string | null;
  completedAt: string | null;
  document: { id: string; fileName: string | null; filePath: string | null } | null;
  documentUrl: string | null;
  milestoneIds?: string[];
  milestoneTitles?: string[];
  milestoneName?: string | null;
  thesisTitle?: string | null;
  createdAt: string;
  updatedAt: string;
  thesis?: {
    id: string;
    title: string | null;
    student?: { user?: { fullName?: string; identityNumber?: string } };
  };
  supervisor?: { user?: { fullName?: string } };
}

// ============================================
// Response helper
// ============================================

async function handleJson<T = unknown>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({ message: 'Request gagal' }));
  if (!response.ok) {
    throw new Error(json.message || `Request gagal (${response.status})`);
  }
  return json as T;
}

// ============================================
// Lecturer Guidance API
// ============================================

/** Backend returns { data: { total, rows, page, pageSize } } for paginated endpoints */
function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && 'rows' in data && Array.isArray((data as { rows: unknown }).rows)) {
    return (data as { rows: T[] }).rows;
  }
  return [];
}

export async function getPendingRequests(params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  requests: GuidanceItem[];
}> {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  const qs = sp.toString();
  const url = getApiUrl(`${EP.REQUESTS}${qs ? `?${qs}` : ''}`);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: unknown }>(response);
  const items = extractItems<GuidanceItem>(data.data);
  return {
    success: true,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? items.length,
    total: items.length,
    totalPages: 1,
    requests: items,
  };
}

export async function getScheduledGuidances(params?: { pageSize?: number }): Promise<GuidanceItem[]> {
  void params;
  const url = getApiUrl(EP.SCHEDULED);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: unknown }>(response);
  return extractItems<GuidanceItem>(data.data);
}

export async function approveGuidanceRequest(
  guidanceId: string,
  body?: { feedback?: string },
): Promise<void> {
  const url = getApiUrl(EP.REQUEST_APPROVE(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    ...(body ? {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    } : {}),
  });
  await handleJson(response);
}

export async function rejectGuidanceRequest(
  guidanceId: string,
  body: { rejectionReason?: string; message?: string },
): Promise<void> {
  const url = getApiUrl(EP.REQUEST_REJECT(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejectionReason: body.rejectionReason ?? body.message }),
  });
  await handleJson(response);
}

export async function cancelGuidanceByLecturer(
  guidanceId: string,
  body?: { reason?: string },
): Promise<void> {
  const url = getApiUrl(EP.REQUEST_CANCEL(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  await handleJson(response);
}

export async function getLecturerGuidanceDetail(guidanceId: string): Promise<{ guidance: GuidanceItem }> {
  const url = getApiUrl(EP.GUIDANCE_DETAIL(guidanceId));
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: { guidance: GuidanceItem } }>(response);
  return data.data;
}

export async function submitLecturerFeedback(
  guidanceId: string,
  body: { feedback: string },
): Promise<void> {
  const url = getApiUrl(EP.FEEDBACK(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await handleJson(response);
}

export async function getPendingApproval(params?: { pageSize?: number }): Promise<{
  total: number;
  guidances: GuidanceItem[];
}> {
  void params;
  const url = getApiUrl(EP.PENDING_APPROVAL);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: GuidanceItem[] }>(response);
  const items = data.data ?? [];
  return { total: items.length, guidances: items };
}

export async function approveSummary(
  guidanceId: string,
  body?: { supervisorFeedback?: string },
): Promise<void> {
  const url = getApiUrl(EP.APPROVE_SUMMARY(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  await handleJson(response);
}

export const approveSessionSummary = (guidanceId: string): Promise<void> =>
  approveSummary(guidanceId);

export type PendingApprovalItem = GuidanceItem;

export async function rejectSummary(
  guidanceId: string,
  body?: { reason?: string },
): Promise<void> {
  const url = getApiUrl(EP.REJECT_SUMMARY(guidanceId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  await handleJson(response);
}

export async function getGuidanceHistory(studentId: string): Promise<GuidanceItem[]> {
  const url = getApiUrl(EP.GUIDANCE_HISTORY(studentId));
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: GuidanceItem[] }>(response);
  return data.data ?? [];
}

// ============================================
// My Students
// ============================================

export interface MyStudentItem {
  studentId: string;
  thesisId?: string;
  fullName?: string;
  email?: string | null;
  identityNumber?: string | null;
  thesisTitle?: string | null;
  thesisStatus?: string | null;
  roles?: string[];
  thesisRating?: string | null;
  latestMilestone?: string | null;
  totalMilestones?: number;
  completedMilestones?: number;
  milestoneProgress?: number;
  completedGuidanceCount?: number;
  lastGuidanceDate?: string | null;
  deadlineDate?: string | null;
  startDate?: string | null;
  [key: string]: unknown;
}

export async function getMyStudents(): Promise<{ students: MyStudentItem[] }> {
  const url = getApiUrl(EP.MY_STUDENTS);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: MyStudentItem[] }>(response);
  return { students: data.data ?? [] };
}

export interface StudentDetail {
  thesisId?: string;
  title?: string | null;
  status?: string | null;
  rating?: string | null;
  startDate?: string | null;
  deadlineDate?: string | null;
  researchMethodScore?: {
    supervisorScore?: number | null;
    lecturerScore?: number | null;
    finalScore?: number | null;
    isFinalized?: boolean;
  } | null;
  student: {
    id?: string | null;
    fullName?: string;
    nim?: string;
    email?: string | null;
  };
  document?: {
    id?: string;
    fileName?: string | null;
    url?: string | null;
  } | null;
  proposalDocument?: {
    id?: string;
    fileName?: string | null;
    url?: string | null;
  } | null;
  uploadedFiles?: Array<{
    id?: string;
    fileName?: string | null;
    filePath?: string | null;
    url?: string | null;
    uploadedAt?: string | null;
    guidanceDate?: string | null;
  }>;
  guidanceHistory?: {
    count: number;
    items: GuidanceItem[];
  };
  milestones?: Array<{
    id: string;
    title?: string | null;
    status?: string | null;
    updatedAt?: string | null;
    updatedAtFormatted?: string | null;
    targetDate?: string | null;
    orderIndex?: number;
    progressPercentage?: number;
    description?: string | null;
    supervisorNotes?: string | null;
    feedback?: string | null;
    latestDocument?: {
      fileName?: string | null;
      filePath?: string | null;
    } | null;
  }>;
  [key: string]: unknown;
}

export async function getStudentDetail(thesisId: string): Promise<{ data: StudentDetail }> {
  const url = getApiUrl(EP.MY_STUDENTS_DETAIL(thesisId));
  const response = await apiRequest(url);
  const json = await handleJson<{ success: boolean; data: StudentDetail }>(response);
  return { data: json.data };
}

export async function validateMilestone(milestoneId: string): Promise<void> {
  const url = getApiUrl(`/milestones/${milestoneId}/validate`);
  const response = await apiRequest(url, { method: 'POST' });
  await handleJson(response);
}

export interface CreateMilestoneForStudentDto {
  title: string;
  description?: string;
  targetDate?: string;
  instructions?: string;
  supervisorNotes?: string;
}

export async function createMilestoneForStudent(
  thesisId: string,
  data: CreateMilestoneForStudentDto,
): Promise<Record<string, unknown>> {
  const url = getApiUrl(`${EP.MY_STUDENTS_DETAIL(thesisId)}/milestones`);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleJson(response);
}

// ============================================
// Warning Notifications
// ============================================

export type WarningType = 'SLOW' | 'AT_RISK' | 'FAILED';

export async function sendWarningToStudent(
  thesisId: string,
  warningType: WarningType,
): Promise<{ success: boolean; message: string }> {
  const url = getApiUrl(`${EP.MY_STUDENTS_DETAIL(thesisId)}/warning`);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ warningType }),
  });
  return handleJson<{ success: boolean; message: string }>(response);
}

// ============================================
// Supervisor 2 Requests
// ============================================

export interface Supervisor2RequestItem {
  requestId: string;
  studentName: string;
  studentNim?: string;
  studentEmail?: string;
  thesisTitle: string;
  requestedAt: string;
}

export async function getSupervisor2Requests(): Promise<Supervisor2RequestItem[]> {
  const url = getApiUrl(EP.SUPERVISOR2_REQUESTS);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; data: Supervisor2RequestItem[] }>(response);
  return data.data ?? [];
}

export async function approveSupervisor2Request(requestId: string): Promise<{ message: string }> {
  const url = getApiUrl(EP.SUPERVISOR2_APPROVE(requestId));
  const response = await apiRequest(url, { method: 'POST' });
  return handleJson<{ message: string }>(response);
}

export async function rejectSupervisor2Request(
  requestId: string,
  reason?: string,
): Promise<{ message: string }> {
  const url = getApiUrl(EP.SUPERVISOR2_REJECT(requestId));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  return handleJson<{ message: string }>(response);
}

// ============================================
// Proposal Version History (for Lecturer)
// ============================================

export interface ProposalVersion {
    id: string;
    version: number;
    isLatest: boolean;
    fileName: string | null;
    fileSize: number | null;
    description: string | null;
    mimeType?: string | null;
    submittedAsFinalAt?: string | null;
    createdAt: string;
    url: string | null;
  }

export async function getStudentProposalVersions(
  thesisId: string,
): Promise<{ thesisId: string; versions: ProposalVersion[] }> {
  const url = getApiUrl(EP.STUDENT_PROPOSAL_VERSIONS(thesisId));
  const response = await apiRequest(url);
  return handleJson(response);
}
