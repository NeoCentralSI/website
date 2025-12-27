import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

// Types (align with backend contracts as needed)
export type GuidanceStatus = "requested" | "accepted" | "rejected" | "completed" | "cancelled";
export type GuidanceType = "online" | "offline";

export interface MyStudentItem {
  studentId: string;
  fullName: string;
  email?: string;
  identityNumber?: string;
  thesisId?: string;
  thesisTitle?: string;
  roles?: string[]; // e.g., ["pembimbing1"]
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
  type?: GuidanceType;
  duration?: number;
  location?: string;
  meetingUrl?: string;
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

export interface ActivityLogItem {
  id: string;
  thesisId?: string;
  userId?: string;
  activityType?: string;
  activity: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ApproveGuidanceBody {
  feedback?: string;
  meetingUrl?: string;
  approvedDate?: string;
  type?: GuidanceType;
  duration?: number;
  location?: string;
}

// API calls
export const getMyStudents = async (params?: { roles?: string }): Promise<{ success: boolean; count: number; students: MyStudentItem[] }> => {
  const qs = params?.roles ? `?roles=${encodeURIComponent(params.roles)}` : "";
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_LECTURER.MY_STUDENTS}${qs}`));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat mahasiswa bimbingan" }));
    throw new Error(errorData.message || "Gagal memuat mahasiswa bimbingan");
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
    method: "POST",
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

export const getLecturerActivityLog = async (studentId: string): Promise<{ success: boolean; count: number; items: ActivityLogItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.ACTIVITY_LOG(studentId)));
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: "Gagal memuat aktivitas" }));
    throw new Error(errorData.message || "Gagal memuat aktivitas");
  }
  return res.json();
};
