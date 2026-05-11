import { getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

// ============================================
// Types
// ============================================

export interface LecturerCatalogItem {
  lecturerId: string;
  fullName: string;
  identityNumber: string;
  email: string;
  avatarUrl: string | null;
  scienceGroup: { id: string; name: string } | null;
  quotaMax: number;
  activeTheses: number;
  activeCount: number;
  normalAvailable: number;
  trafficLight: 'green' | 'yellow' | 'red';
  statusLabel?: string;
  supervisedTopics: string[];
}

export interface LecturerQuotaSnapshot {
  lecturerId: string;
  fullName: string;
  identityNumber: string;
  email: string | null;
  avatarUrl: string | null;
  scienceGroup: { id: string; name: string } | null;
  quotaMax: number;
  quotaSoftLimit: number;
  currentCount: number;
  activeCount: number;
  bookingCount: number;
  pendingKadepCount: number;
  normalAvailable: number;
  overquotaAmount: number;
  trafficLight: 'green' | 'yellow' | 'red';
  isNearLimit: boolean;
  isFull: boolean;
}

export interface AdvisorQuotaEntry {
  id: string;
  source: 'request' | 'supervisor';
  requestId: string | null;
  supervisorId: string | null;
  bucket: 'active' | 'booking' | 'pendingKadep';
  lecturerId: string;
  studentId: string | null;
  studentName: string;
  studentIdentityNumber: string;
  studentAvatarUrl: string | null;
  thesisId: string | null;
  thesisTitle: string | null;
  topicName: string | null;
  roleName: string | null;
  requestStatus: AdvisorRequestStatus;
  lecturerApprovalNote?: string | null;
  rejectionReason?: string | null;
  justificationText?: string | null;
  studentJustification?: string | null;
  lecturerOverquotaReason?: string | null;
  kadepNotes?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  proposalStatus?: string | null;
  thesisStatus?: string | null;
}

export interface DosenInboxPayload {
  summary: LecturerQuotaSnapshot | null;
  pendingRequests: AdvisorRequest[];
  activeOfficial: AdvisorQuotaEntry[];
  bookings: AdvisorQuotaEntry[];
  pendingKadep: AdvisorQuotaEntry[];
}

export interface AdvisorAccessGate {
  id: string;
  title: string;
  templateId: string | null;
  templateName: string;
  status: string;
  isCompleted: boolean;
}

export interface AdvisorSupervisorSummary {
  id: string;
  lecturerId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: string | null;
}

export interface AdvisorRequest {
  id: string;
  studentId: string;
  lecturerId: string | null;
  topicId: string | null;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  problemStatement: string | null;
  proposedSolution: string | null;
  researchObject: string | null;
  researchPermitStatus: 'approved' | 'in_process' | 'not_approved' | null;
  justificationText: string | null;
  studentJustification: string | null;
  requestType: AdvisorRequestType;
  lecturerApprovalNote?: string | null;
  lecturerOverquotaReason?: string | null;
  status: AdvisorRequestStatus;
  routeType: 'normal' | 'escalated';
  rejectionReason: string | null;
  kadepNotes: string | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
  withdrawCount: number;
  reviewedAt: string | null;
  lecturerRespondedAt: string | null;
  student: {
    id: string;
    user: { id: string; fullName: string; identityNumber: string; avatarUrl?: string };
  };
  lecturer: {
    id: string;
    scienceGroupId?: string;
    user: { id: string; fullName: string; identityNumber?: string; avatarUrl?: string };
    scienceGroup?: { id: string; name: string };
    supervisionQuotas?: Array<{ quotaMax: number; quotaSoftLimit: number; currentCount: number }>;
  } | null;
  topic: { id: string; name: string } | null;
  redirectTarget?: {
    id: string;
    user: { id: string; fullName: string };
    scienceGroup?: { id: string; name: string };
  };
  quotaSnapshot?: LecturerQuotaSnapshot | null;
  quotaPreview?: {
    projectedCurrentCount: number;
    willBeOverquota: boolean;
    projectedOverquotaAmount: number;
  } | null;
}

export interface AdvisorRequestDraft {
  id: string | null;
  studentId: string | null;
  lecturerId: string | null;
  topicId: string | null;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  problemStatement: string | null;
  proposedSolution: string | null;
  researchObject: string | null;
  researchPermitStatus: 'approved' | 'in_process' | 'not_approved' | null;
  justificationText: string | null;
  studentJustification: string | null;
  attachmentId: string | null;
  attachment?: {
    id: string;
    fileName: string;
    filePath: string;
    fileSize?: number | null;
    mimeType?: string | null;
    createdAt?: string;
  } | null;
  lecturer?: AdvisorRequest['lecturer'];
  topic?: AdvisorRequest['topic'];
  lastSubmittedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  requestType: AdvisorRequestType;
  source: 'draft' | 'latest_submission' | 'empty';
}

export interface AdvisorAccessState {
  studentId: string;
  thesisId: string | null;
  thesisTitle: string | null;
  thesisStatus: string | null;
  eligibleMetopen: boolean | null;
  hasExternalEligibility: boolean;
  metopenEligibilitySource: 'sia' | 'devtools' | null;
  metopenEligibilityUpdatedAt: string | null;
  metopenReadOnly: boolean;
  gateConfigured: boolean;
  gateOpen: boolean;
  gates: AdvisorAccessGate[];
  supervisors: AdvisorSupervisorSummary[];
  hasOfficialSupervisor: boolean;
  hasBlockingRequest: boolean;
  blockingRequest: AdvisorRequest | null;
  latestRequest: AdvisorRequest | null;
  requestStatus: AdvisorRequestStatus | null;
  canBrowseCatalog: boolean;
  canViewCatalog: boolean;
  canSubmitRequest: boolean;
  canOpenLogbook: boolean;
  reason: string;
  nextStep: string;
}

export type AdvisorRequestStatus =
  | 'pending'
  | 'under_review'
  | 'pending_kadep'
  | 'booking_approved'
  | 'active_official'
  | 'revision_requested'
  | 'rejected_by_dosen'
  | 'rejected_by_kadep'
  | 'canceled'
  | 'closed'
  | 'escalated'
  | 'approved'
  | 'rejected'
  | 'override_approved'
  | 'redirected'
  | 'withdrawn'
  | 'assigned';

export type AdvisorRequestType = 'ta_01' | 'ta_02';

export interface AlternativeLecturer {
  lecturerId: string;
  fullName: string;
  identityNumber: string;
  avatarUrl: string | null;
  scienceGroup: { id: string; name: string } | null;
  quotaMax: number;
  currentCount: number;
  remaining: number;
  activeTheses: number;
  sameTopicCount: number;
  trafficLight: 'green' | 'yellow';
  score: number;
}

export interface KadepQueue {
  escalated: AdvisorRequest[];
  pendingAssignment: AdvisorRequest[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// ============================================
// Helper to parse API Response
// ============================================
async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request gagal' }));
    throw new Error(errorData.message || `Request gagal (${response.status})`);
  }
  return response.json();
}

// ============================================
// API Service
// ============================================

export const advisorRequestService = {
  // Student
  getAccessState: async (): Promise<ApiResponse<AdvisorAccessState>> => {
    const url = getApiUrl('/advisorRequest/access-state');
    const response = await apiRequest(url);
    return parseResponse<AdvisorAccessState>(response);
  },

  getCatalog: async (academicYearId?: string): Promise<ApiResponse<LecturerCatalogItem[]>> => {
    const params = academicYearId ? `?academicYearId=${academicYearId}` : '';
    const url = getApiUrl(`/advisorRequest/catalog${params}`);
    const response = await apiRequest(url);
    return parseResponse<LecturerCatalogItem[]>(response);
  },

  getMyDraft: async (): Promise<ApiResponse<AdvisorRequestDraft>> => {
    const url = getApiUrl('/advisorRequest/draft');
    const response = await apiRequest(url);
    return parseResponse<AdvisorRequestDraft>(response);
  },

  saveDraft: async (data: Partial<{
    lecturerId: string | null;
    topicId: string | null;
    proposedTitle: string | null;
    backgroundSummary: string | null;
    problemStatement: string | null;
    proposedSolution: string | null;
    researchObject: string | null;
    researchPermitStatus: 'approved' | 'in_process' | 'not_approved' | null;
    justificationText: string | null;
    studentJustification: string | null;
    attachmentId: string | null;
  }>): Promise<ApiResponse<AdvisorRequestDraft>> => {
    const url = getApiUrl('/advisorRequest/draft');
    const response = await apiRequest(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse<AdvisorRequestDraft>(response);
  },

  submitRequest: async (data: {
    lecturerId?: string | null;
    topicId: string;
    proposedTitle: string;
    backgroundSummary: string;
    problemStatement: string;
    proposedSolution: string;
    researchObject: string;
    researchPermitStatus: 'approved' | 'in_process' | 'not_approved';
    justificationText?: string;
    studentJustification?: string;
  }): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl('/advisorRequest');
    const response = await apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse<AdvisorRequest>(response);
  },

  getMyRequests: async (): Promise<ApiResponse<AdvisorRequest[]>> => {
    const url = getApiUrl('/advisorRequest/my');
    const response = await apiRequest(url);
    return parseResponse<AdvisorRequest[]>(response);
  },

  withdrawRequest: async (id: string): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl(`/advisorRequest/${id}/withdraw`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse<AdvisorRequest>(response);
  },

  // Dosen
  getDosenInbox: async (): Promise<ApiResponse<DosenInboxPayload>> => {
    const url = getApiUrl('/advisorRequest/inbox');
    const response = await apiRequest(url);
    return parseResponse<DosenInboxPayload>(response);
  },

  getDosenInboxHistory: async (): Promise<ApiResponse<AdvisorRequest[]>> => {
    const url = getApiUrl('/advisorRequest/inbox/history');
    const response = await apiRequest(url);
    return parseResponse<AdvisorRequest[]>(response);
  },

  markUnderReview: async (id: string): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl(`/advisorRequest/${id}/mark-review`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse<AdvisorRequest>(response);
  },

  respondToRequest: async (id: string, data: { action: 'accept' | 'reject'; approvalNote?: string; lecturerOverquotaReason?: string; rejectionReason?: string }): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl(`/advisorRequest/${id}/respond`);
    const response = await apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse<AdvisorRequest>(response);
  },

  // KaDep
  getKadepQueue: async (): Promise<ApiResponse<KadepQueue>> => {
    const url = getApiUrl('/advisorRequest/kadep-queue');
    const response = await apiRequest(url);
    return parseResponse<KadepQueue>(response);
  },

  getRecommendations: async (id: string): Promise<ApiResponse<{ alternatives: AlternativeLecturer[] }>> => {
    const url = getApiUrl(`/advisorRequest/${id}/recommendations`);
    const response = await apiRequest(url);
    return parseResponse<{ alternatives: AlternativeLecturer[] }>(response);
  },

  decideRequest: async (id: string, data: { action: 'approve' | 'reject' | 'override' | 'redirect' | 'request_revision'; targetLecturerId?: string; notes?: string }): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl(`/advisorRequest/${id}/decide`);
    const response = await apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return parseResponse<AdvisorRequest>(response);
  },

  assignAdvisor: async (id: string): Promise<ApiResponse<{ message: string; thesisId: string; assignedLecturerId: string }>> => {
    const url = getApiUrl(`/advisorRequest/${id}/assign`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse<{ message: string; thesisId: string; assignedLecturerId: string }>(response);
  },

  getDetail: async (id: string): Promise<ApiResponse<AdvisorRequest>> => {
    const url = getApiUrl(`/advisorRequest/${id}`);
    const response = await apiRequest(url);
    return parseResponse<AdvisorRequest>(response);
  },

  getBatchTA04: async (academicYearId: string): Promise<Blob> => {
    const url = getApiUrl(`/advisorRequest/batch-ta04/${academicYearId}`);
    const response = await apiRequest(url);
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Gagal mengunduh batch TA-04');
    }
    return response.blob();
  },

  finalizeBatchTA04: async (academicYearId: string): Promise<ApiResponse<{
    documentId: string;
    fileName: string;
    storedFileName: string;
    filePath: string;
    thesisCount: number;
    academicYear: string;
  }>> => {
    const url = getApiUrl(`/advisorRequest/batch-ta04/${academicYearId}/finalize`);
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse<{
      documentId: string;
      fileName: string;
      storedFileName: string;
      filePath: string;
      thesisCount: number;
      academicYear: string;
    }>(response);
  },
};
