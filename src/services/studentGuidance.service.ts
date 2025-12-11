import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

export type GuidanceStatus = "requested" | "accepted" | "rejected";

export interface GuidanceItem {
  id: string;
  thesisId?: string;
  supervisorId?: string;
  supervisorName?: string;
  status: GuidanceStatus;
  scheduledAt?: string; // ISO datetime
  scheduledAtFormatted?: string; // WIB formatted (from backend)
  schedule?: {
    id: string;
    guidanceDate: string;
    guidanceDateFormatted?: string;
  } | null;
  location?: string;
  notes?: string;
  document?: {
    id: string;
    fileName: string;
    filePath: string; // relative path served at /uploads
  } | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface StudentRequestGuidanceBody {
  guidanceDate: string; // ISO datetime
  studentNotes?: string;
  file: File; // thesis file to upload
  meetingUrl?: string;
  supervisorId?: string;
  [key: string]: unknown;
}

export interface StudentRescheduleGuidanceBody {
  guidanceDate: string; // ISO datetime
  studentNotes?: string; // optional reason/notes
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
  completedAt?: string | null; // ISO
  validatedBySupervisor?: boolean;
  [key: string]: unknown;
}

export interface StudentCompleteComponentsBody {
  componentIds: string[];
  completedAt?: string; // ISO
}

export interface ActivityLogItem {
  id: string;
  action: string;
  actor?: string;
  timestamp: string; // ISO
  details?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SupervisorItem {
  id: string;
  name: string;
  email?: string;
  nidn?: string;
  avatarUrl?: string;
  [key: string]: unknown;
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
  if (body.meetingUrl) fd.append("meetingUrl", body.meetingUrl);
  if (body.supervisorId) fd.append("supervisorId", body.supervisorId);
  fd.append("file", body.file);
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
    method: "POST",
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
