import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

// Types (align with backend contracts as needed)
export type GuidanceStatus = "requested" | "accepted" | "rejected" | "completed" | "cancelled" | "summary_pending";

export interface MyStudentItem {
  studentId: string;
  fullName: string;
  email?: string;
  identityNumber?: string;
  thesisId?: string;
  thesisTitle?: string;
  thesisStatus?: string;
  roles?: string[]; // e.g., ["pembimbing1"]
  thesisRating?: "ONGOING" | "SLOW" | "AT_RISK" | "FAILED";
  latestMilestone?: string;
  // Milestone progress info
  totalMilestones?: number;
  completedMilestones?: number;
  milestoneProgress?: number; // 0-100 percentage
  // Guidance info
  completedGuidanceCount?: number;
  lastGuidanceDate?: string | null;
  deadlineDate?: string | null;
  startDate?: string | null;
}

export interface GuidanceItem {
  id: string;
  studentId?: string;
  studentName?: string;
  supervisorId?: string;
  supervisorName?: string;
  thesisId?: string;
  status: GuidanceStatus;
  // New schema fields
  requestedDate?: string;
  requestedDateFormatted?: string;
  approvedDate?: string;
  approvedDateFormatted?: string;
  duration?: number;
  notes?: string;
  studentNotes?: string; // alias for notes from student
  supervisorFeedback?: string;
  rejectionReason?: string;
  completedAt?: string;
  document?: {
    fileName: string;
    filePath: string;
  } | null;
  documentUrl?: string; // link to external document (e.g., Google Docs, Overleaf)
  createdAt?: string;
  createdAtFormatted?: string;
  updatedAt?: string;
  requestedAt?: string; // alias for createdAt
  // Milestone info
  milestoneId?: string;
  milestone?: {
    id: string;
    title: string;
    status: string;
  } | null;
  milestoneName?: string;
  milestoneStatus?: string;
  milestoneIds?: string[];
  milestoneTitles?: string[];
  [key: string]: unknown;
}

export interface ApproveGuidanceBody {
  feedback?: string;
}

// API calls
export interface StudentDetail {
    thesisId: string;
    title: string;
    status: string;
    rating: string;
    startDate: string | null;
    deadlineDate: string | null;
    student: {
        id: string;
        fullName: string;
        nim: string;
        email: string;
    };
    document: {
        id: string;
        fileName: string;
        url: string;
    } | null;
    proposalDocument: {
        id: string;
        fileName: string;
        url: string;
    } | null;
    milestones: {
        id: string;
        title: string;
        status: string;
        updatedAt: string;
        progressPercentage: number;
    }[];
}

export const validateMilestone = async (milestoneId: string, notes?: string): Promise<{ success: boolean; data: any }> => {
    const res = await apiRequest(getApiUrl(`/milestones/${milestoneId}/validate`), {
        method: "POST",
        body: JSON.stringify({ supervisorNotes: notes }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memvalidasi milestone" }));
        throw new Error(errorData.message || "Gagal memvalidasi milestone");
    }
    return res.json();
};

export const getStudentDetail = async (thesisId: string): Promise<{ success: boolean; data: StudentDetail }> => {
    const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.MY_STUDENTS_DETAIL(thesisId)));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail mahasiswa" }));
        throw new Error(errorData.message || "Gagal memuat detail mahasiswa");
    }
    return res.json();
};

export const getMyStudents = async (params?: { roles?: string }): Promise<{ success: boolean; count: number; students: MyStudentItem[] }> => {
  const qs = params?.roles ? `?roles=${encodeURIComponent(params.roles)}` : "";
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_LECTURER.MY_STUDENTS}${qs}`));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat mahasiswa bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat mahasiswa bimbingan");
  }
  return res.json();
};

export type WarningType = "SLOW" | "AT_RISK" | "FAILED";

export const sendWarningToStudent = async (thesisId: string, warningType: WarningType): Promise<{ success: boolean; message: string }> => {
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_LECTURER.MY_STUDENTS}/${thesisId}/send-warning`), {
    method: "POST",
    body: JSON.stringify({ warningType }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal mengirim peringatan" }));
    throw new Error(errorData.message || "Gagal mengirim peringatan");
  }
  return res.json();
};

export const getPendingRequests = async (params?: { page?: number; pageSize?: number }): Promise<{ success: boolean; page: number; pageSize: number; total: number; totalPages: number; requests: GuidanceItem[] }> => {
  const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUESTS));
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  const res = await apiRequest(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat permintaan bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat permintaan bimbingan");
  }
  return res.json();
};

export const getScheduledGuidances = async (params?: { page?: number; pageSize?: number }): Promise<{ success: boolean; page: number; pageSize: number; total: number; totalPages: number; guidances: GuidanceItem[] }> => {
  const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.SCHEDULED));
  if (params?.page) url.searchParams.set("page", String(params.page));
  if (params?.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  const res = await apiRequest(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat bimbingan terjadwal" }));
    throw new Error(errorData.message || "Gagal memuat bimbingan terjadwal");
  }
  return res.json();
};

export const rejectGuidanceRequest = async (guidanceId: string, body: { message: string }): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUEST_REJECT(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal menolak permintaan" }));
    throw new Error(errorData.message || "Gagal menolak permintaan");
  }
  return res.json();
};

export const approveGuidanceRequest = async (guidanceId: string, body?: Record<string, unknown>): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUEST_APPROVE(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui permintaan" }));
    throw new Error(errorData.message || "Gagal menyetujui permintaan");
  }
  return res.json();
};

export const postFeedback = async (guidanceId: string, body: { message: string }): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.FEEDBACK(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal mengirim feedback" }));
    throw new Error(errorData.message || "Gagal mengirim feedback");
  }
  return res.json();
};

export const getLecturerGuidanceHistory = async (studentId: string): Promise<{ success: boolean; count: number; items: GuidanceItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.GUIDANCE_HISTORY(studentId)));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat riwayat bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat riwayat bimbingan");
  }
  return res.json();
};

// ==================== SESSION SUMMARY APPROVAL ====================

export interface PendingApprovalItem {
  id: string;
  studentName?: string;
  studentId?: string;
  approvedDate?: string;
  approvedDateFormatted?: string;
  summarySubmittedAt?: string;
  summarySubmittedAtFormatted?: string;
  sessionSummary?: string;
  actionItems?: string;
  milestoneName?: string;
}

/**
 * Get guidances pending summary approval (for 1-click approve)
 */
export const getPendingApproval = async (params?: { page?: number; pageSize?: number }): Promise<{
  success: boolean;
  total: number;
  guidances: PendingApprovalItem[];
  page: number;
  pageSize: number;
}> => {
  const url = (() => {
    const base = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.PENDING_APPROVAL);
    if (!params?.page && !params?.pageSize) return base;
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    return `${base}?${qs.toString()}`;
  })();
  
  const res = await apiRequest(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat catatan bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat catatan bimbingan");
  }
  return res.json();
};

/**
 * Approve session summary - 1 click, minimal interaction
 */
export const approveSessionSummary = async (guidanceId: string): Promise<{
  success: boolean;
  guidance: { id: string; status: GuidanceStatus; completedAt?: string };
}> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.APPROVE_SUMMARY(guidanceId)), {
    method: "PUT",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal menyetujui catatan" }));
    throw new Error(errorData.message || "Gagal menyetujui catatan");
  }
  return res.json();
};

// Guidance detail response type
export interface GuidanceDetailItem extends GuidanceItem {
  studentNim?: string;
  studentEmail?: string;
  thesisTitle?: string;
  sessionSummary?: string;
  actionItems?: string;
  summarySubmittedAt?: string;
  summarySubmittedAtFormatted?: string;
  completedAtFormatted?: string;
  createdAtFormatted?: string;
}

/**
 * Get detailed guidance info for session detail page
 */
export const getLecturerGuidanceDetail = async (guidanceId: string): Promise<{
  success: boolean;
  guidance: GuidanceDetailItem;
}> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.GUIDANCE_DETAIL(guidanceId)));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat detail bimbingan");
  }
  return res.json();
};

// ==================== MILESTONE MANAGEMENT ====================

export interface CreateMilestoneForStudentDto {
  title: string;
  description?: string;
  targetDate?: string;
  supervisorNotes?: string;
}

/**
 * Create milestone for student (supervisor only)
 */
export const createMilestoneForStudent = async (thesisId: string, data: CreateMilestoneForStudentDto): Promise<{
  success: boolean;
  message: string;
  data: {
    id: string;
    title: string;
    description?: string;
    status: string;
    progressPercentage: number;
  };
}> => {
  const res = await apiRequest(getApiUrl(`/milestones/thesis/${thesisId}/by-supervisor`), {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal membuat milestone" }));
    throw new Error(errorData.message || "Gagal membuat milestone");
  }
  return res.json();
};
