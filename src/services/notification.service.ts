import { API_CONFIG, getApiUrl } from '../config/api';
import { apiRequest } from './auth.service';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

/**
 * Get user notifications
 */
export const getNotificationsAPI = async (params?: {
  limit?: number;
  offset?: number;
  onlyUnread?: boolean;
}): Promise<NotificationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  if (params?.onlyUnread) queryParams.append('onlyUnread', 'true');

  const url = getApiUrl(`${API_CONFIG.ENDPOINTS.NOTIFICATION.BASE}?${queryParams.toString()}`);
  const response = await apiRequest(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch notifications');
  }

  return await response.json();
};

/**
 * Get unread count only
 */
export const getUnreadCountAPI = async (): Promise<UnreadCountResponse> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.UNREAD_COUNT);
  const response = await apiRequest(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch unread count');
  }

  return await response.json();
};

/**
 * Mark notification as read
 */
export const markNotificationAsReadAPI = async (id: string): Promise<{ success: boolean }> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_READ(id));
  const response = await apiRequest(url, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to mark notification as read');
  }

  return await response.json();
};

/**
 * Mark all notifications as read
 */
export const markAllAsReadAPI = async (): Promise<{ success: boolean; marked: number }> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.MARK_ALL_READ);
  const response = await apiRequest(url, {
    method: 'PATCH',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to mark all as read');
  }

  return await response.json();
};

/**
 * Delete notification
 */
export const deleteNotificationAPI = async (id: string): Promise<{ success: boolean }> => {
  const url = getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION.DELETE(id));
  const response = await apiRequest(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete notification');
  }

  return await response.json();
};

