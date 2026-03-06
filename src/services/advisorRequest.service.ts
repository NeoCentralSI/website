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
  quotaSoftLimit: number;
  currentCount: number;
  remaining: number;
  activeTheses: number;
  trafficLight: 'green' | 'yellow' | 'red';
  supervisedTopics: string[];
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
  lecturerId: string;
  topicId: string;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  justificationText: string | null;
  status: AdvisorRequestStatus;
  routeType: 'normal' | 'escalated';
  rejectionReason: string | null;
  kadepNotes: string | null;
  createdAt: string;
  updatedAt: string;
  withdrawnAt: string | null;
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
  };
  topic: { id: string; name: string };
  redirectTarget?: {
    id: string;
    user: { id: string; fullName: string };
    scienceGroup?: { id: string; name: string };
  };
}

export interface AdvisorAccessState {
  studentId: string;
  thesisId: string | null;
  thesisTitle: string | null;
  thesisStatus: string | null;
  gateConfigured: boolean;
  gateOpen: boolean;
  gates: AdvisorAccessGate[];
  supervisors: AdvisorSupervisorSummary[];
  hasOfficialSupervisor: boolean;
  hasBlockingRequest: boolean;
  blockingRequest: AdvisorRequest | null;
  requestStatus: AdvisorRequestStatus | null;
  canBrowseCatalog: boolean;
  canSubmitRequest: boolean;
  canOpenLogbook: boolean;
  reason: string;
  nextStep: string;
}

export type AdvisorRequestStatus =
  | 'pending'
  | 'escalated'
  | 'approved'
  | 'rejected'
  | 'override_approved'
  | 'redirected'
  | 'withdrawn'
  | 'assigned';

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

  submitRequest: async (data: {
    lecturerId: string;
    topicId: string;
    proposedTitle?: string;
    backgroundSummary?: string;
    justificationText?: string;
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
  getDosenInbox: async (): Promise<ApiResponse<AdvisorRequest[]>> => {
    const url = getApiUrl('/advisorRequest/inbox');
    const response = await apiRequest(url);
    return parseResponse<AdvisorRequest[]>(response);
  },

  respondToRequest: async (id: string, data: { action: 'accept' | 'reject'; rejectionReason?: string }): Promise<ApiResponse<AdvisorRequest>> => {
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

  decideRequest: async (id: string, data: { action: 'override' | 'redirect'; targetLecturerId?: string; notes?: string }): Promise<ApiResponse<AdvisorRequest>> => {
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
};
