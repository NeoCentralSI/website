import { getApiUrl, API_CONFIG } from '@/config/api';
import { apiRequest } from './auth.service';

const EP = API_CONFIG.ENDPOINTS.THESIS_STUDENT;

// ============================================
// Types
// ============================================

export type GuidanceStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'summary_pending'
  | 'completed'
  | 'cancelled'
  | 'deleted';

export type GuidancePhase = 'proposal' | 'thesis';

export interface GuidanceItem {
  id: string;
  thesisId: string;
  supervisorId: string | null;
  supervisorName: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  status: GuidanceStatus;
  phase: GuidancePhase;
  location?: string | null;
  requestedDate: string | null;
  approvedDate: string | null;
  requestedDateFormatted?: string;
  approvedDateFormatted?: string;
  completedAtFormatted?: string;
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
  milestoneName?: string | null;
  thesisTitle?: string | null;
  milestoneIds: string[];
  milestoneTitles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SupervisorInfo {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
}

export interface ThesisStudentInfo {
  id: string | null;
  name: string | null;
  nim: string | null;
  email: string | null;
}

export interface ThesisTopicInfo {
  id: string;
  name: string;
}

export interface ThesisAcademicYearInfo {
  id: string;
  name?: string | null;
  year?: string | number | null;
  semester?: string | null;
  isActive?: boolean;
}

export interface ThesisDocumentInfo {
  id: string;
  fileName: string | null;
  filePath: string | null;
  uploadedAt?: string | null;
}

export interface ThesisStatsSummary {
  totalGuidances: number;
  totalSessions: number;
  totalMilestones: number;
  completedMilestones: number;
  inProgressMilestones: number;
  overdueMilestones: number;
  milestoneProgress: number;
}

export interface ThesisSeminarApprovalSummary {
  pembimbing1: boolean;
  pembimbing2: boolean;
  hasPembimbing2: boolean;
  isFullyApproved: boolean;
}

export interface ThesisSupervisorSummary {
  id: string;
  role: string | null;
  name: string | null;
  email: string | null;
  identityNumber: string | null;
  nip?: string | null;
}

export interface MyThesisDetail {
  id: string;
  title: string | null;
  status: string | null;
  rating?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deadlineDate?: string | null;
  isProposal?: boolean;
  student?: ThesisStudentInfo | null;
  topic?: ThesisTopicInfo | null;
  academicYear?: ThesisAcademicYearInfo | null;
  document?: ThesisDocumentInfo | null;
  proposalDocument?: ThesisDocumentInfo | null;
  uploadedFiles?: ThesisDocumentInfo[];
  supervisors?: ThesisSupervisorSummary[];
  examiners?: SupervisorInfo[];
  stats?: ThesisStatsSummary;
  seminarApproval?: ThesisSeminarApprovalSummary;
}

export interface ThesisHistorySummary {
  id: string;
  title: string;
  status: string;
  topic: string;
  academicYear: string;
  createdAt: string;
  stats: {
    guidances: number;
    completedMilestones: number | string;
  };
}

export interface GuidanceExportItem {
  id: string;
  studentName: string | null;
  studentId: string | null;
  supervisorName: string | null;
  approvedDate: string | null;
  approvedDateFormatted?: string | null;
  completedAt: string | null;
  completedAtFormatted?: string | null;
  duration: number;
  studentNotes?: string | null;
  sessionSummary: string | null;
  actionItems: string | null;
  milestoneName: string | null;
  thesisTitle: string | null;
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
// Student Guidance API
// ============================================

export async function listStudentGuidance(params?: {
  status?: string;
  phase?: string;
}): Promise<{ count: number; items: GuidanceItem[] }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set('status', params.status);
  if (params?.phase) sp.set('phase', params.phase);
  const qs = sp.toString();
  const url = getApiUrl(`${EP.GUIDANCE_LIST}${qs ? `?${qs}` : ''}`);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; count: number; items: GuidanceItem[] }>(response);
  return { count: data.count, items: data.items };
}

export async function getStudentGuidanceDetail(
  guidanceId: string,
): Promise<{ guidance: GuidanceItem }> {
  const url = getApiUrl(EP.GUIDANCE_DETAIL(guidanceId));
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; guidance: GuidanceItem }>(response);
  return { guidance: data.guidance };
}

export async function getStudentSupervisors(): Promise<{
  thesisId: string | null;
  supervisors: SupervisorInfo[];
}> {
  const url = getApiUrl(EP.SUPERVISORS);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; thesisId: string | null; supervisors: SupervisorInfo[] }>(response);
  return { thesisId: data.thesisId, supervisors: data.supervisors };
}

export async function requestGuidance(body: {
  supervisorId?: string;
  guidanceDate: string;
  duration?: number;
  studentNotes?: string;
  documentUrl?: string;
  phase?: GuidancePhase;
}): Promise<GuidanceItem> {
  const url = getApiUrl(EP.GUIDANCE_REQUEST);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await handleJson<{ success: boolean; guidance: GuidanceItem }>(response);
  return data.guidance;
}

export async function rescheduleStudentGuidance(
  id: string,
  body: { guidanceDate: string; studentNotes?: string },
): Promise<GuidanceItem> {
  const url = getApiUrl(EP.GUIDANCE_RESCHEDULE(id));
  const response = await apiRequest(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await handleJson<{ success: boolean; guidance: GuidanceItem }>(response);
  return data.guidance;
}

export async function cancelStudentGuidance(
  id: string,
  body?: { reason?: string },
): Promise<GuidanceItem> {
  const url = getApiUrl(EP.GUIDANCE_CANCEL(id));
  const response = await apiRequest(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await handleJson<{ success: boolean; guidance: GuidanceItem }>(response);
  return data.guidance;
}

export async function updateStudentGuidanceNotes(
  id: string,
  body: { studentNotes: string },
): Promise<GuidanceItem> {
  const url = getApiUrl(EP.GUIDANCE_NOTES(id));
  const response = await apiRequest(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await handleJson<{ success: boolean; guidance: GuidanceItem }>(response);
  return data.guidance;
}

export async function submitSessionSummary(
  id: string,
  body: { sessionSummary: string; actionItems?: string },
): Promise<void> {
  const url = getApiUrl(EP.SUBMIT_SUMMARY(id));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await handleJson(response);
}

export async function completeGuidanceSession(
  id: string,
  body: { sessionSummary: string; actionItems?: string },
): Promise<void> {
  const url = getApiUrl(EP.COMPLETE_SESSION(id));
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await handleJson(response);
}

export async function getCompletedGuidanceHistory(phase?: string): Promise<{
  guidances: CompletedGuidance[];
}> {
  const qs = phase ? `?phase=${phase}` : '';
  const url = getApiUrl(`${EP.COMPLETED_HISTORY}${qs}`);
  const response = await apiRequest(url);
  return handleJson(response);
}

export async function getMyThesisDetail(): Promise<MyThesisDetail | null> {
  const url = getApiUrl(EP.MY_THESIS);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; thesis: MyThesisDetail | null }>(response);
  return data.thesis ?? null;
}

export async function getGuidancesNeedingSummary(): Promise<GuidanceItem[]> {
  const url = getApiUrl(EP.NEEDS_SUMMARY);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; guidances: GuidanceItem[] }>(response);
  return data.guidances;
}

export async function exportGuidance(id: string): Promise<GuidanceExportItem> {
  const url = getApiUrl(EP.EXPORT_GUIDANCE(id));
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; guidance: GuidanceExportItem }>(response);
  return data.guidance;
}

// ============================================
// Supervisor Availability
// ============================================

export interface SupervisorBusySlot {
  id: string;
  start: string;
  end: string;
  studentName?: string;
}

export interface SupervisorsResponse {
  thesisId: string | null;
  supervisors: SupervisorInfo[];
}

export async function getSupervisorAvailability(
  supervisorId: string,
  params: { start: string; end: string },
): Promise<{ busySlots: SupervisorBusySlot[] }> {
  const sp = new URLSearchParams({ start: params.start, end: params.end });
  const url = getApiUrl(`${EP.SUPERVISOR_AVAILABILITY(supervisorId)}?${sp.toString()}`);
  const response = await apiRequest(url);
  const data = await handleJson<{ busySlots?: Array<{ start: string; end: string; studentName?: string }> }>(response);
  return {
    busySlots: (data.busySlots ?? []).map((slot, index) => ({
      id: `${slot.start}-${slot.end}-${index}`,
      ...slot,
    })),
  };
}

// ============================================
// Student Guidance Request (with file upload)
// ============================================

export async function requestStudentGuidance(body: {
  guidanceDate: string;
  studentNotes?: string;
  file?: File;
  documentUrl?: string;
  supervisorId?: string;
  milestoneIds?: string[];
  phase?: GuidancePhase;
}): Promise<{ guidance: GuidanceItem }> {
  const formData = new FormData();
  formData.append('guidanceDate', body.guidanceDate);
  if (body.studentNotes) formData.append('studentNotes', body.studentNotes);
  if (body.documentUrl) formData.append('documentUrl', body.documentUrl);
  if (body.supervisorId) formData.append('supervisorId', body.supervisorId);
  if (body.phase) formData.append('phase', body.phase);
  if (body.milestoneIds) {
    body.milestoneIds.forEach((id) => formData.append('milestoneIds[]', id));
  }
  if (body.file) formData.append('file', body.file);

  const url = getApiUrl(EP.GUIDANCE_REQUEST);
  const response = await apiRequest(url, {
    method: 'POST',
    body: formData,
  });
  return handleJson(response);
}

// ============================================
// Thesis History & Supervisor 2 Request
// ============================================

export async function getStudentThesisHistory(): Promise<{ theses: ThesisHistorySummary[] }> {
  const url = getApiUrl(EP.THESIS_HISTORY);
  const response = await apiRequest(url);
  return handleJson<{ success: boolean; theses: ThesisHistorySummary[] }>(response);
}

export async function getPendingSupervisor2Request(): Promise<PendingSupervisor2Request | null> {
  const url = getApiUrl(EP.PENDING_SUPERVISOR_2);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; request: PendingSupervisor2Request }>(response);
  return data.request ?? null;
}

export interface AvailableSupervisor2Item {
  id: string;
  fullName: string | null;
  email: string | null;
  identityNumber: string | null;
  scienceGroup: string | null;
}

export interface PendingSupervisor2Request {
  requestId: string;
  lecturerId: string;
  lecturerName: string | null;
  requestedAt: string;
}

export async function getAvailableSupervisors2(): Promise<AvailableSupervisor2Item[]> {
  const url = getApiUrl(EP.AVAILABLE_SUPERVISORS_2);
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; lecturers?: AvailableSupervisor2Item[]; data?: AvailableSupervisor2Item[] }>(response);
  return data.lecturers ?? data.data ?? [];
}

export async function requestSupervisor2(lecturerId: string): Promise<{ message: string }> {
  const url = getApiUrl(EP.REQUEST_SUPERVISOR_2);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lecturerId }),
  });
  return handleJson<{ message: string }>(response);
}

export async function cancelSupervisor2Request(): Promise<{ message: string }> {
  const url = getApiUrl(EP.CANCEL_SUPERVISOR_2);
  const response = await apiRequest(url, { method: 'POST' });
  return handleJson<{ message: string }>(response);
}

export interface ProgressDetailItem {
  componentId: string;
  name: string;
  description?: string | null;
  completedAt?: string | null;
  validatedBySupervisor?: boolean;
}

export type GuidanceNeedingSummary = GuidanceItem;
export interface CompletedGuidance {
  id: string;
  supervisorName: string | null;
  approvedDate: string | null;
  approvedDateFormatted?: string;
  completedAt: string | null;
  completedAtFormatted?: string;
  duration: number;
  studentNotes: string | null;
  sessionSummary: string | null;
  actionItems: string | null;
  milestoneName: string | null;
  thesisTitle: string | null;
  phase: GuidancePhase;
}

export async function getStudentProgressDetail(): Promise<{ thesisId: string | null }> {
  const thesis = await getMyThesisDetail();
  return { thesisId: thesis?.id ?? null };
}

// ============================================
// Guidance Export & PDF Generation
// ============================================

export async function getGuidanceForExport(
  guidanceId: string,
): Promise<{ guidance: GuidanceExportItem }> {
  const url = getApiUrl(EP.EXPORT_GUIDANCE(guidanceId));
  const response = await apiRequest(url);
  const data = await handleJson<{ success: boolean; guidance: GuidanceExportItem }>(response);
  return { guidance: data.guidance };
}

export async function generateGuidanceLogPdf(
  guidanceIds: string[],
): Promise<Blob> {
  const url = getApiUrl(EP.GENERATE_LOG);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guidanceIds }),
  });
  if (!response.ok) {
    const json = await response.json().catch(() => ({ message: 'Gagal generate PDF' }));
    throw new Error(json.message || `Gagal generate PDF (${response.status})`);
  }
  return response.blob();
}

// ============================================
// Thesis Proposal (Re-registration)
// ============================================

export async function proposeThesis(body: {
  title: string;
  topicId?: string;
}): Promise<{ thesis: { id: string; title: string; status: string; message: string } }> {
  const url = getApiUrl(EP.PROPOSE_THESIS);
  const response = await apiRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleJson(response);
}

// ============================================
// Proposal Versioning
// ============================================

export interface ProposalVersion {
  id: string;
  version: number;
  isLatest: boolean;
  fileName: string | null;
  fileSize: number | null;
  mimeType?: string | null;
  description: string | null;
  submittedAsFinalAt?: string | null;
  createdAt: string;
  url: string | null;
}

export interface FinalProposalVersionStatus {
  id: string;
  version: number;
  submittedAsFinalAt: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  url: string | null;
}

export interface ProposalSubmissionStatus {
  thesisId: string;
  hasSupervisor: boolean;
  proposalStatus: string | null;
  latestVersion: ProposalVersion | null;
  finalProposalVersion: FinalProposalVersionStatus | null;
}

export async function uploadProposalVersion(
  file: File,
  description?: string,
): Promise<{ data: ProposalVersion }> {
  const formData = new FormData();
  formData.append('file', file);
  if (description) formData.append('description', description);

  const url = getApiUrl(EP.PROPOSAL_UPLOAD);
  const response = await apiRequest(url, {
    method: 'POST',
    body: formData,
  });
  return handleJson(response);
}

export async function getProposalVersions(): Promise<{
  thesisId: string | null;
  versions: ProposalVersion[];
}> {
  const url = getApiUrl(EP.PROPOSAL_VERSIONS);
  const response = await apiRequest(url);
  return handleJson(response);
}

export async function getProposalSubmissionStatus(): Promise<ProposalSubmissionStatus> {
  const url = getApiUrl(EP.PROPOSAL_STATUS);
  const response = await apiRequest(url);
  const json = await handleJson<{ success: boolean; data: ProposalSubmissionStatus }>(response);
  return json.data;
}

export async function submitFinalProposal(): Promise<{
  data: {
    thesisId: string;
    finalProposalVersion: ProposalVersion;
    alreadySubmitted: boolean;
  };
}> {
  const url = getApiUrl(EP.PROPOSAL_SUBMIT_FINAL);
  const response = await apiRequest(url, {
    method: 'POST',
  });
  return handleJson(response);
}
