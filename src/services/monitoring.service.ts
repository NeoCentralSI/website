import { getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";
import type { EvaluationDue, SupervisionClock, ThesisActivityLevel } from '@/lib/thesisLabels';

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
  totalSlow?: number;
  totalEvaluationDue?: number;
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
    email: string;
  };
  status: string;
  activityLevel?: ThesisActivityLevel | null;
  lastActivity: string;
  daysSinceActivity: number;
  supervisionClock?: SupervisionClock | null;
  supervisors: SupervisorInfo[];
}

/** A running thesis whose guidance evaluation is due ("Perlu Evaluasi"). */
export interface EvaluationDueStudent {
  thesisId: string;
  title: string;
  student: { name: string; nim: string; email: string };
  activityLevel: ThesisActivityLevel | null;
  evaluationDue: EvaluationDue;
  supervisionClock: SupervisionClock;
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

export interface SupervisorLoadStudent {
  thesisId: string;
  thesisTitle: string | null;
  role: string | null;
  name: string;
  nim: string;
  email: string | null;
}

export interface SupervisorLoad {
  lecturerId: string;
  lecturerName: string;
  lecturerNip: string | null;
  lecturerEmail: string | null;
  studentCount: number;
  students: SupervisorLoadStudent[];
}

/** Jumlah TA berstatus Penelitian per tingkat aktivitas (nilai turunan). */
export interface ActivityDistribution {
  id: string;
  name: string;
  value: string;
  count: number;
}

export interface TopicDistribution {
  id: string;
  name: string;
  count: number;
}

export interface BatchDistribution {
  id: string;
  name: string;
  count: number;
}

export interface ProgressBucket {
  label: string;
  count: number;
}

export interface GuidanceTrend {
  month: string;
  count: number;
}

export interface MonitoringDashboard {
  summary: ProgressStats;
  statusDistribution: StatusDistribution[];
  activityDistribution: ActivityDistribution[];
  topicDistribution: TopicDistribution[];
  batchDistribution: BatchDistribution[];
  progressDistribution: ProgressBucket[];
  guidanceTrend: GuidanceTrend[];
  atRiskStudents: AtRiskStudent[];
  slowStudents: AtRiskStudent[];
  evaluationDueStudents?: EvaluationDueStudent[];
  supervisorLoads: SupervisorLoad[];
  readyForSeminar: ReadyForSeminarStudent[];
}

export interface ThesisListItem {
  id: string;
  title: string;
  /** Nilai turunan; null bila TA tidak berstatus Penelitian. */
  activityLevel: ThesisActivityLevel | null;
  daysSinceActivity: number | null;
  supervisionClock: SupervisionClock | null;
  startDate: string | null;
  topic: {
    id: string;
    name: string;
  } | null;
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  status: string;
  academicYear: string;
  startSemester: string;
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
    hasPembimbing2: boolean;
    isFullyApproved: boolean;
  };
  lastActivity: string | null;
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

/** Fields the Seminar and Sidang cards share (read-only, from the monitoring detail). */
export interface ThesisDetailEvent {
  id: string;
  /** `ThesisSeminarStatus` / `ThesisDefenceStatus`; shown through `ThesisEventStatusBadge`. */
  status: string;
  /** Calendar date (ISO, midnight UTC). */
  date: string | null;
  /** Time of day (ISO on 1970-01-01, read in UTC), as stored by the seminar and defence modules. */
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  /** Examiners that are still assigned, in order. */
  examiners: { order: number | null; name: string | null }[];
  finalScore: number | null;
  resultFinalizedAt: string | null;
  revisionFinalizedAt: string | null;
  /** A revision is done once a supervisor has approved it. */
  revisions: { total: number; completed: number };
  examinerCount: number;
  scoredCount: number;
  averageScore: number | null;
}

export type ThesisDetailSeminar = ThesisDetailEvent;

export interface ThesisDetailDefence extends ThesisDetailEvent {
  grade: string | null;
  examinerAverageScore: number | null;
  supervisorScore: number | null;
}

export interface ThesisDetail {
  id: string;
  title: string;
  status: string | null;
  activityLevel: ThesisActivityLevel | null;
  daysSinceActivity: number | null;
  supervisionClock: SupervisionClock | null;
  topic: string | null;
  academicYear: string | null;
  startDate: string | null;
  createdAt: string;
  lastActivity: string | null;
  seminarApproval: {
    supervisor1: boolean;
    supervisor2: boolean;
    hasPembimbing2: boolean;
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
  latestDocument: {
    id: string;
    fileName: string;
    filePath: string;
  } | null;
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
  topics: FilterOption[];
  academicYears?: {
    value: string;
    label: string;
    isActive: boolean;
  }[];
}

export interface ThesesFilters {
  status?: string;
  lecturerId?: string;
  topicId?: string;
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
  SUPERVISOR_LOADS: "/thesisGuidance/monitoring/supervisor-loads",
  BATCH_WARNING: "/thesisGuidance/monitoring/batch-warning",
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
  if (filters.topicId) params.append("topicId", filters.topicId);
  if (filters.academicYear && filters.academicYear !== "all") params.append("academicYear", filters.academicYear);
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
 * Get slow students list
 */
export async function getSlowStudents(academicYear?: string): Promise<AtRiskStudent[]> {
  const url = academicYear && academicYear !== "all"
    ? `${getApiUrl("/thesisGuidance/monitoring/slow")}?academicYear=${academicYear}`
    : getApiUrl("/thesisGuidance/monitoring/slow");
  const response = await apiRequest(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil mahasiswa slow");
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
 * Get lecturer supervision workloads
 */
export async function getSupervisorLoads(academicYear?: string): Promise<SupervisorLoad[]> {
  const url = academicYear && academicYear !== "all"
    ? `${ENDPOINTS.SUPERVISOR_LOADS}?academicYear=${academicYear}`
    : ENDPOINTS.SUPERVISOR_LOADS;
  const response = await apiRequest(getApiUrl(url));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil beban bimbingan dosen");
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

/** Peringatan dikirim menurut tingkat aktivitas. */
export type WarningType = 'slow' | 'at_risk';

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

// ========== Progress Report Types ==========

export interface ReportThesisItem {
  no: number;
  nim: string;
  name: string;
  title: string;
  topic: string;
  status: string;
  activityLevel: ThesisActivityLevel | null;
  /** Masa bimbingan, mis. "7 bulan 12 hari". */
  supervisionLabel: string;
  evaluationDue: string | null;
  pembimbing1: string;
  pembimbing2: string;
  guidanceTotal: number;
  guidanceCompleted: number;
  milestoneTotal: number;
  milestoneCompleted: number;
  progressPercent: number;
  startDate: string | null;
  createdAt: string;
}

export interface ReportSummary {
  totalTheses: number;
  totalGuidances: number;
  completedGuidances: number;
  totalMilestones: number;
  completedMilestones: number;
  averageMilestoneProgress: number;
  averageGuidanceCompletion: number;
}

export interface ProgressReportData {
  academicYear: string;
  generatedAt: string;
  summary: ReportSummary;
  statusDistribution: StatusDistribution[];
  activityDistribution: ActivityDistribution[];
  theses: ReportThesisItem[];
}

export interface ReportFilterOptions {
  academicYearId?: string;
  statusIds?: string[];
  activityLevels?: string[];
}

/**
 * Get progress report data for PDF generation
 */
export async function getProgressReport(options: ReportFilterOptions = {}): Promise<ProgressReportData> {
  const params = new URLSearchParams();
  if (options.academicYearId && options.academicYearId !== 'all') params.append('academicYear', options.academicYearId);
  if (options.statusIds?.length) params.append('statusIds', options.statusIds.join(','));
  if (options.activityLevels?.length) params.append('activityLevels', options.activityLevels.join(','));

  const url = `${getApiUrl("/thesisGuidance/monitoring/report")}?${params.toString()}`;

  const response = await apiRequest(url);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil data laporan");
  }
  const result = await response.json();
  return result.data;
}

/**
 * Download progress report as PDF (server-side generation via Gotenberg)
 */
export async function downloadProgressReportPdf(options: ReportFilterOptions = {}): Promise<Blob> {
  const params = new URLSearchParams();
  if (options.academicYearId && options.academicYearId !== 'all') params.append('academicYear', options.academicYearId);
  if (options.statusIds?.length) params.append('statusIds', options.statusIds.join(','));
  if (options.activityLevels?.length) params.append('activityLevels', options.activityLevels.join(','));

  const url = `${getApiUrl("/thesisGuidance/monitoring/report/download")}?${params.toString()}`;

  const response = await apiRequest(url);
  if (!response.ok) {
    let message = "Gagal mengunduh laporan";
    try {
      const json = await response.json();
      if (json.message) message = json.message;
    } catch {
      // response is not JSON
    }
    throw new Error(message);
  }
  return response.blob();
}

/**
 * Send batch warning notifications to students (for management roles)
 */
export async function sendBatchWarnings(thesisIds: string[], warningType: WarningType): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest(
    getApiUrl(ENDPOINTS.BATCH_WARNING),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thesisIds, warningType }),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengirim peringatan batch");
  }
  return response.json();
}
