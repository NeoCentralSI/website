import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";

export interface NotificationItem {
  id: string;
  title?: string | null;
  message?: string | null;
  isRead: boolean;
  createdAt: string; // ISO
}

export interface NotificationsListResponse {
  success: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

export async function getNotifications(params?: { limit?: number; offset?: number; onlyUnread?: boolean }): Promise<NotificationsListResponse> {
  const url = new URL(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.BASE));
  if (params?.limit != null) url.searchParams.set("limit", String(params.limit));
  if (params?.offset != null) url.searchParams.set("offset", String(params.offset));
  if (params?.onlyUnread != null) url.searchParams.set("onlyUnread", String(params.onlyUnread));
  const res = await apiRequest(url.toString());
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat notifikasi");
  return res.json();
}

export async function getUnreadCount(): Promise<UnreadCountResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.UNREAD_COUNT));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memuat jumlah notifikasi");
  return res.json();
}

export async function markAllNotificationsRead(): Promise<{ success: boolean; marked: number }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_ALL_READ), { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menandai semua notifikasi");
  return res.json();
}

export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_READ(id)), { method: "PATCH" });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menandai notifikasi");
  return res.json();
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.DELETE(id)), { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menghapus notifikasi");
  return res.json();
}

export async function deleteAllNotifications(): Promise<{ success: boolean; deleted: number }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.DELETE_ALL), { method: "DELETE" });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menghapus semua notifikasi");
  return res.json();
}
 
export async function registerFcmToken(token: string): Promise<{ success: boolean; registered: number }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.FCM_REGISTER), {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal mendaftarkan FCM token");
  return res.json();
}

export async function unregisterFcmToken(token: string): Promise<{ success: boolean; removed: number }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.FCM_UNREGISTER), {
    method: "DELETE",
    body: JSON.stringify({ token }),
  });
  if (!res.ok) throw new Error((await res.json()).message || "Gagal menghapus FCM token");
  return res.json();
}

export interface ThesisDeletionNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
}

export interface CheckThesisDeletionResponse {
  success: boolean;
  data: {
    hasDeletedThesis: boolean;
    notification: ThesisDeletionNotification | null;
  };
}

/**
 * Check if student has a thesis deletion notification
 * Used to show "please re-register" message on frontend
 */
export async function checkThesisDeletionNotification(): Promise<CheckThesisDeletionResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.CHECK_THESIS_DELETED));
  if (!res.ok) throw new Error((await res.json()).message || "Gagal memeriksa status tugas akhir");
  return res.json();
}


