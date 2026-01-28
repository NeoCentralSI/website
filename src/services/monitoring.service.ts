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

export interface MonitoringDashboard {
  summary: ProgressStats;
  statusDistribution: StatusDistribution[];
  atRiskStudents: AtRiskStudent[];
  readyForSeminar: ReadyForSeminarStudent[];
}

export interface ThesisListItem {
  id: string;
  title: string;
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
    pembimbing2: string | null;
  };
  seminarApproval: {
    supervisor1: boolean;
    supervisor2: boolean;
    isFullyApproved: boolean;
  };
  lastActivity: string;
  createdAt: string;
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
