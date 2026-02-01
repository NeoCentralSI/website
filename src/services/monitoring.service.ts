import { getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

// ========== Types ==========

export interface ProgressStats {
  totalActiveTheses: number;
  totalMilestones: number;
  completedMilestones: number;
  averageProgress: number;
  studentsComplete100: number;
  studentsWithNoProgress: number;
  totalReadyForSeminar: number;
  totalAtRisk: number;
}

export interface StatusDistribution {
  id: string;
  name: string;
  count: number;
}

export interface SupervisorInfo {
  name: string;
  role: string;
}

export interface AtRiskStudent {
  thesisId: string;
  title: string;
  student: {
    name: string;
    nim: string;
  };
  status: string;
  lastActivity: string;
  daysSinceActivity: number;
  supervisors: SupervisorInfo[];
}

export interface ReadyForSeminarStudent {
  thesisId: string;
  title: string;
  student: {
    name: string;
    nim: string;
    email: string;
  };
  supervisors: SupervisorInfo[];
  approvedAt: string;
}

export interface RatingDistribution {
  id: string;
  name: string;
  value: string;
  count: number;
}

export interface MonitoringDashboard {
  summary: ProgressStats;
  statusDistribution: StatusDistribution[];
  ratingDistribution: RatingDistribution[];
  atRiskStudents: AtRiskStudent[];
  readyForSeminar: ReadyForSeminarStudent[];
}

export interface ThesisListItem {
  id: string;
  title: string;
  rating: 'ONGOING' | 'SLOW' | 'AT_RISK' | 'FAILED';
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  status: string;
  academicYear: string;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  supervisors: {
    pembimbing1: string | null;
    pembimbing1Id: string | null;
    pembimbing2: string | null;
    pembimbing2Id: string | null;
  };
  seminarApproval: {
    supervisor1: boolean;
    supervisor2: boolean;
    isFullyApproved: boolean;
  };
  lastActivity: string;
  createdAt: string;
}

// Thesis Detail Types
export interface ThesisDetailParticipant {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface ThesisDetailMilestone {
  id: string;
  title: string;
  status: string;
  progressPercentage: number | null;
  targetDate: string | null;
  completedAt: string | null;
}

export interface ThesisDetailGuidance {
  id: string;
  status: string;
  topic: string | null;
  approvedDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface ThesisDetailScore {
  scorerName: string;
  rubric: string | null;
  score: number | null;
}

export interface ThesisDetailSeminar {
  id: string;
  status: string;
  result: string | null;
  scheduledAt: string | null;
  endTime: string | null;
  room: string | null;
  scores: ThesisDetailScore[];
  averageScore: number | null;
}

export interface ThesisDetailDefence {
  id: string;
  status: string | null;
  scheduledAt: string | null;
  endTime: string | null;
  room: string | null;
  scores: ThesisDetailScore[];
  averageScore: number | null;
}

export interface ThesisDetail {
  id: string;
  title: string;
  status: string | null;
  topic: string | null;
  academicYear: string | null;
  startDate: string | null;
  deadlineDate: string | null;
  createdAt: string;
  lastActivity: string;
  seminarApproval: {
    supervisor1: boolean;
    supervisor2: boolean;
    isFullyApproved: boolean;
    approvedAt: string | null;
  };
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
    phone: string | null;
  };
  supervisors: ThesisDetailParticipant[];
  examiners: ThesisDetailParticipant[];
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  milestones: ThesisDetailMilestone[];
  guidances: {
    items: ThesisDetailGuidance[];
    total: number;
    completed: number;
    pending: number;
  };
  seminars: ThesisDetailSeminar[];
  defences: ThesisDetailDefence[];
}

export interface ThesesListResponse {
  data: ThesisListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterOptions {
  statuses: FilterOption[];
  supervisors: FilterOption[];
  academicYears?: {
    value: string;
    label: string;
    isActive: boolean;
  }[];
}

export interface ThesesFilters {
  status?: string;
  lecturerId?: string;
  academicYear?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ========== Endpoints ==========

const ENDPOINTS = {
  DASHBOARD: "/thesisGuidance/monitoring/dashboard",
  THESES: "/thesisGuidance/monitoring/theses",
  THESIS_DETAIL: "/thesisGuidance/monitoring/theses",
  FILTERS: "/thesisGuidance/monitoring/filters",
  AT_RISK: "/thesisGuidance/monitoring/at-risk",
  READY_SEMINAR: "/thesisGuidance/monitoring/ready-seminar",
};

// ========== Service Functions ==========

/**
 * Get monitoring dashboard data (summary, status distribution, etc.)
 */
export async function getMonitoringDashboard(academicYear?: string): Promise<MonitoringDashboard> {
  const url = academicYear && academicYear !== "all" 
    ? `${ENDPOINTS.DASHBOARD}?academicYear=${academicYear}`
    : ENDPOINTS.DASHBOARD;
  const response = await apiRequest(getApiUrl(url));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil data monitoring");
  }
  const result = await response.json();
  return result.data;
}

/**
 * Get theses list with filters
 */
export async function getThesesList(filters: ThesesFilters = {}): Promise<ThesesListResponse> {
  const params = new URLSearchParams();
  
  if (filters.status) params.append("status", filters.status);
  if (filters.lecturerId) params.append("lecturerId", filters.lecturerId);
  if (filters.academicYear) params.append("academicYear", filters.academicYear);
  if (filters.search) params.append("search", filters.search);
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.pageSize) params.append("pageSize", filters.pageSize.toString());

  const url = `${getApiUrl(ENDPOINTS.THESES)}?${params.toString()}`;
  const response = await apiRequest(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil daftar tugas akhir");
  }
  const result = await response.json();
  return {
    data: result.data,
    pagination: result.pagination,
  };
}

/**
 * Get filter options for dropdowns
 */
export async function getFilterOptions(): Promise<FilterOptions> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.FILTERS));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil opsi filter");
  }
  const result = await response.json();
  return result.data;
}

/**
 * Get at-risk students list
 */
export async function getAtRiskStudents(academicYear?: string): Promise<AtRiskStudent[]> {
  const url = academicYear && academicYear !== "all"
    ? `${ENDPOINTS.AT_RISK}?academicYear=${academicYear}`
    : ENDPOINTS.AT_RISK;
  const response = await apiRequest(getApiUrl(url));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil mahasiswa berisiko");
  }
  const result = await response.json();
  return result.data;
}

/**
 * Get students ready for seminar
 */
export async function getStudentsReadyForSeminar(academicYear?: string): Promise<ReadyForSeminarStudent[]> {
  const url = academicYear && academicYear !== "all"
    ? `${ENDPOINTS.READY_SEMINAR}?academicYear=${academicYear}`
    : ENDPOINTS.READY_SEMINAR;
  const response = await apiRequest(getApiUrl(url));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil mahasiswa siap seminar");
  }
  const result = await response.json();
  return result.data;
}

/**
 * Get thesis detail by ID
 */
export async function getThesisDetail(thesisId: string): Promise<ThesisDetail> {
  const url = `${ENDPOINTS.THESIS_DETAIL}/${thesisId}`;
  const response = await apiRequest(getApiUrl(url));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil detail tugas akhir");
  }
  const result = await response.json();
  return result.data;
}

export type WarningType = 'SLOW' | 'AT_RISK' | 'FAILED';

/**
 * Send warning notification to student about thesis progress (for monitoring role: Kadep, Sekdep, GKM)
 */
export async function sendWarningToStudent(thesisId: string, warningType: WarningType): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest(
    getApiUrl(`/thesisGuidance/monitoring/theses/${thesisId}/send-warning`),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warningType }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengirim peringatan");
  }
  return response.json();
}

/**
 * Delete thesis (for Kadep only - used for FAILED thesis)
 */
export async function deleteThesisFromMonitoring(thesisId: string, reason?: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest(
    getApiUrl(`/adminfeatures/thesis/${thesisId}`),
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus thesis");
  }
  return response.json();
}
