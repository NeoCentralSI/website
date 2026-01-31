import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

export type GuidanceStatus = "requested" | "accepted" | "rejected" | "completed" | "cancelled" | "summary_pending";

export interface GuidanceItem {
  id: string;
  thesisId?: string;
  supervisorId?: string;
  supervisorName?: string;
  studentId?: string;
  studentName?: string;
  status: GuidanceStatus;
  // New schema: requestedDate and approvedDate instead of schedule
  requestedDate?: string; // ISO datetime - tanggal diminta mahasiswa
  requestedDateFormatted?: string; // WIB formatted
  approvedDate?: string; // ISO datetime - tanggal disetujui dosen
  approvedDateFormatted?: string; // WIB formatted
  // Guidance details
  duration?: number; // durasi dalam menit
  notes?: string;
  supervisorFeedback?: string;
  rejectionReason?: string;
  completedAt?: string;
  completedAtFormatted?: string;
  // Session summary (diisi mahasiswa)
  sessionSummary?: string;
  actionItems?: string;
  summarySubmittedAt?: string;
  summarySubmittedAtFormatted?: string;
  document?: {
    id?: string;
    fileName: string;
    filePath: string;
  } | null;
  milestoneIds?: string[];
  milestoneTitles?: string[];
  milestoneName?: string;
  thesisTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface StudentRequestGuidanceBody {
  guidanceDate: string; // ISO datetime
  studentNotes?: string;
  file?: File; // thesis file to upload (optional)
  documentUrl?: string; // Link dokumen yang akan dibahas (Google Docs, Overleaf, dll)
  supervisorId?: string;
  milestoneId?: string; // Link to milestone
  milestoneIds?: string[]; // Link multiple milestones
  duration?: number; // durasi dalam menit
  [key: string]: unknown;
}

export interface StudentRescheduleGuidanceBody {
  guidanceDate: string; // ISO datetime
  studentNotes?: string; // optional reason/notes
  duration?: number;
  [key: string]: unknown;
}

export interface StudentNotesBody {
  studentNotes: string;
  [key: string]: unknown;
}

export interface ProgressDetailItem {
  componentId: string;
  name: string;
  description?: string;
  orderIndex?: number;
  isMandatory?: boolean;
  completedAt?: string | null; // ISO
  validatedBySupervisor?: boolean;
  validatedAt?: string | null; // ISO
  notes?: string | null; // catatan dari supervisor
  evidenceUrl?: string | null; // link bukti/dokumen
  [key: string]: unknown;
}

export interface StudentCompleteComponentsBody {
  componentIds: string[];
  completedAt?: string; // ISO
}

export type ActivityType = "guidance" | "submission" | "revision" | "approval" | "milestone" | "notification" | "other";

export interface ActivityLogItem {
  id: string;
  thesisId?: string;
  userId?: string;
  activityType?: ActivityType;
  activity: string; // deskripsi singkat
  notes?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string; // ISO
  [key: string]: unknown;
}

export interface SupervisorItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface GuidanceListResponse {
  success: boolean;
  count: number;
  items: GuidanceItem[];
}

export interface GuidanceDetailResponse {
  success: boolean;
  guidance: GuidanceItem;
}

export interface RequestGuidanceResponse {
  success: boolean;
  guidance: GuidanceItem;
}

export interface ProgressDetailResponse {
  success: boolean;
  thesisId: string;
  components: ProgressDetailItem[];
}

export interface ProgressCompleteResponse {
  success: boolean;
  thesisId: string;
  updated: number;
  created: number;
}

export interface SupervisorsResponse {
  success: boolean;
  thesisId: string;
  supervisors: SupervisorItem[];
}

export interface SupervisorBusySlot {
  id: string;
  start: string;
  end: string;
  duration: number;
  status: GuidanceStatus;
  studentName: string | null;
}

// Helpers
const buildUrl = (endpoint: string, params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return getApiUrl(endpoint);
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) qs.set(k, String(v));
  });
  const sep = endpoint.includes("?") ? "&" : "?";
  return getApiUrl(`${endpoint}${qs.toString() ? sep + qs.toString() : ""}`);
};

// API calls
export const listStudentGuidance = async (params?: { status?: GuidanceStatus; q?: string; page?: number; limit?: number }): Promise<GuidanceListResponse> => {
  const url = buildUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_LIST, {
    status: params?.status,
    q: params?.q,
    page: params?.page,
    limit: params?.limit,
  });
  const res = await apiRequest(url);
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat bimbingan");
  return res.json();
};

export const getStudentGuidanceDetail = async (guidanceId: string): Promise<GuidanceDetailResponse> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_DETAIL(guidanceId));
  const res = await apiRequest(url);
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat detail bimbingan");
  return res.json();
};

export const requestStudentGuidance = async (body: StudentRequestGuidanceBody): Promise<RequestGuidanceResponse> => {
  const fd = new FormData();
  fd.append("guidanceDate", body.guidanceDate);
  if (body.studentNotes) fd.append("studentNotes", body.studentNotes);
  if (body.documentUrl) fd.append("documentUrl", body.documentUrl);
  if (body.supervisorId) fd.append("supervisorId", body.supervisorId);
  if (body.milestoneId) fd.append("milestoneId", body.milestoneId);
  if (body.milestoneIds && Array.isArray(body.milestoneIds)) {
    body.milestoneIds.forEach((id) => fd.append("milestoneIds[]", id));
  }
  if (body.file) fd.append("file", body.file);
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_REQUEST), {
    method: "POST",
    body: fd,
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal mengajukan bimbingan");
  return res.json();
};

export const rescheduleStudentGuidance = async (
  guidanceId: string,
  body: StudentRescheduleGuidanceBody
): Promise<GuidanceDetailResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_RESCHEDULE(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menjadwalkan ulang");
  return res.json();
};

export const cancelStudentGuidance = async (
  guidanceId: string,
  body?: { reason?: string }
): Promise<GuidanceDetailResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_CANCEL(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal membatalkan bimbingan");
  return res.json();
};

export const updateStudentGuidanceNotes = async (
  guidanceId: string,
  body: StudentNotesBody
): Promise<GuidanceDetailResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.GUIDANCE_NOTES(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memperbarui catatan");
  return res.json();
};

export const getStudentProgressDetail = async (): Promise<ProgressDetailResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.PROGRESS));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat progres");
  return res.json();
};

export const completeStudentProgressComponents = async (
  body: StudentCompleteComponentsBody
): Promise<ProgressCompleteResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.PROGRESS_COMPLETE), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memperbarui komponen");
  return res.json();
};

export const getStudentGuidanceHistory = async (): Promise<GuidanceListResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.HISTORY));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat riwayat bimbingan");
  return res.json();
};

export const getStudentActivityLog = async (): Promise<{ success: boolean; count: number; items: ActivityLogItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.ACTIVITY_LOG));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat aktivitas");
  return res.json();
};

export const getStudentSupervisors = async (): Promise<SupervisorsResponse> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.SUPERVISORS));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat pembimbing");
  return res.json();
};

export const getSupervisorAvailability = async (
  supervisorId: string,
  params?: { start?: string; end?: string }
): Promise<{ success: boolean; busySlots: SupervisorBusySlot[] }> => {
  const url = (() => {
    const endpoint = API_CONFIG.ENDPOINTS.THESIS_STUDENT.SUPERVISOR_AVAILABILITY(supervisorId);
    if (!params?.start && !params?.end) return getApiUrl(endpoint);
    const qs = new URLSearchParams();
    if (params?.start) qs.set("start", params.start);
    if (params?.end) qs.set("end", params.end);
    return `${getApiUrl(endpoint)}?${qs.toString()}`;
  })();

  const res = await apiRequest(url);
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat ketersediaan dosen");
  return res.json();
};

// ==================== SESSION SUMMARY ====================

export interface SessionSummaryBody {
  sessionSummary: string;
  actionItems?: string;
}

export interface GuidanceNeedingSummary {
  id: string;
  supervisorName?: string;
  approvedDate?: string;
  approvedDateFormatted?: string;
  duration?: number;
  studentNotes?: string;
  milestoneName?: string;
}

export interface CompletedGuidance {
  id: string;
  supervisorName?: string;
  approvedDate?: string;
  approvedDateFormatted?: string;
  completedAt?: string;
  completedAtFormatted?: string;
  duration?: number;
  studentNotes?: string;
  sessionSummary?: string;
  actionItems?: string;
  milestoneName?: string;
  thesisTitle?: string;
}

export interface GuidanceExport {
  id: string;
  studentName?: string;
  studentId?: string;
  supervisorName?: string;
  approvedDate?: string;
  approvedDateFormatted?: string;
  completedAt?: string;
  completedAtFormatted?: string;
  duration?: number;
  studentNotes?: string;
  sessionSummary?: string;
  actionItems?: string;
  milestoneName?: string;
  thesisTitle?: string;
}

/**
 * Get guidances that need summary submission (accepted + past scheduled time)
 */
export const getGuidancesNeedingSummary = async (): Promise<{ success: boolean; guidances: GuidanceNeedingSummary[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.NEEDS_SUMMARY));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat bimbingan yang perlu diisi");
  return res.json();
};

/**
 * Submit session summary after guidance
 */
export const submitSessionSummary = async (
  guidanceId: string,
  body: SessionSummaryBody
): Promise<{ success: boolean; guidance: { id: string; status: GuidanceStatus; sessionSummary?: string; actionItems?: string } }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.SUBMIT_SUMMARY(guidanceId)), {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal mengirim catatan bimbingan");
  return res.json();
};

/**
 * Mark session as complete directly (skip lecturer approval)
 */
export const markSessionComplete = async (
  guidanceId: string,
  body: SessionSummaryBody
): Promise<{ success: boolean; guidance: { id: string; status: GuidanceStatus; sessionSummary?: string; actionItems?: string; completedAt?: string } }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.COMPLETE_SESSION(guidanceId)), {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menyelesaikan sesi bimbingan");
  return res.json();
};

/**
 * Get completed guidance history for documentation
 */
export const getCompletedGuidanceHistory = async (): Promise<{ success: boolean; guidances: CompletedGuidance[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.COMPLETED_HISTORY));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat riwayat bimbingan selesai");
  return res.json();
};

/**
 * Get single guidance detail for export/download
 */
export const getGuidanceForExport = async (guidanceId: string): Promise<{ success: boolean; guidance: GuidanceExport }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_STUDENT.EXPORT_GUIDANCE(guidanceId)));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat detail bimbingan");
  return res.json();
};
