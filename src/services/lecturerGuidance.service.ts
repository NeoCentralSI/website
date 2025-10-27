import { API_CONFIG, getApiUrl } from "../config/api";
import { apiRequest } from "./auth.service";

// Types (align with backend contracts as needed)
export interface MyStudentItem {
  studentId: string;
  fullName: string;
  email?: string;
  thesisId?: string;
  roles?: string[]; // e.g., ["SUPERVISOR_1"]
}

export interface GuidanceItem {
  id: string;
  studentId: string;
  studentName?: string;
  thesisId?: string;
  status: string;
  requestedAt?: string;
  scheduledAt?: string;
  [key: string]: unknown;
}

export interface ProgressSummaryItem {
  studentId: string;
  studentName?: string;
  thesisId?: string;
  completed: number;
  total: number;
}

export interface ProgressDetailItem {
  componentId: string;
  name: string;
  isCompleted: boolean;
  approvedBySupervisor?: boolean;
}

export interface ActivityLogItem {
  id: string;
  action: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

// API calls
export const getMyStudents = async (params?: { roles?: string }): Promise<{ success: boolean; count: number; students: MyStudentItem[] }> => {
  const qs = params?.roles ? `?roles=${encodeURIComponent(params.roles)}` : "";
  const res = await apiRequest(getApiUrl(`${API_CONFIG.ENDPOINTS.THESIS_LECTURER.MY_STUDENTS}${qs}`));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat mahasiswa bimbingan");
  return res.json();
};

export const getPendingRequests = async (): Promise<{ success: boolean; count: number; requests: GuidanceItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUESTS));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat permintaan bimbingan");
  return res.json();
};

export const rejectGuidanceRequest = async (guidanceId: string, body: { message: string }): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUEST_REJECT(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menolak permintaan");
  return res.json();
};

export const approveGuidanceRequest = async (guidanceId: string, body?: Record<string, unknown>): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.REQUEST_APPROVE(guidanceId)), {
    method: "PATCH",
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menyetujui permintaan");
  return res.json();
};

export const getProgressSummary = async (): Promise<{ success: boolean; totalComponents?: number; items: ProgressSummaryItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.PROGRESS_SUMMARY));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat ringkasan progres");
  return res.json();
};

export const getProgressDetail = async (studentId: string): Promise<{ success: boolean; thesisId: string; components: ProgressDetailItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.PROGRESS_DETAIL(studentId)));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat detail progres");
  return res.json();
};

export const approveProgressComponents = async (studentId: string, components: Array<{ componentId: string; approved?: boolean }>): Promise<{ success: boolean; thesisId: string; updated: number; created: number }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.PROGRESS_APPROVE_COMPONENTS(studentId)), {
    method: "PATCH",
    body: JSON.stringify({ components: components.map((c) => ({ ...c, approved: c.approved ?? true })) }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memvalidasi komponen");
  return res.json();
};

export const finalApproval = async (studentId: string): Promise<{ success: boolean; thesisId: string; approved: boolean }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.PROGRESS_FINAL_APPROVAL(studentId)), {
    method: "PATCH",
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal melakukan final approval");
  return res.json();
};

export const failThesis = async (studentId: string, body?: Record<string, unknown>): Promise<{ success: boolean; thesisId: string; status: string }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.FAIL_THESIS(studentId)), {
    method: "PATCH",
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menggagalkan tugas akhir");
  return res.json();
};

export const postFeedback = async (guidanceId: string, body: { message: string }): Promise<{ success: boolean; guidance: GuidanceItem }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.FEEDBACK(guidanceId)), {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal mengirim feedback");
  return res.json();
};

export const getLecturerGuidanceHistory = async (studentId: string): Promise<{ success: boolean; count: number; items: GuidanceItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.GUIDANCE_HISTORY(studentId)));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat riwayat bimbingan");
  return res.json();
};

export const getLecturerActivityLog = async (studentId: string): Promise<{ success: boolean; count: number; items: ActivityLogItem[] }> => {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.ACTIVITY_LOG(studentId)));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat aktivitas");
  return res.json();
};

export const getSupervisorEligibility = async (params?: { threshold?: number }): Promise<{ success: boolean; eligible: boolean; graduatedAsSup2: number; required: number }> => {
  const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_LECTURER.SUPERVISOR_ELIGIBILITY));
  if (params?.threshold != null) url.searchParams.set("threshold", String(params.threshold));
  const res = await apiRequest(url.toString());
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memeriksa eligibility");
  return res.json();
};
