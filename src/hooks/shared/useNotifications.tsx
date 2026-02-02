/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationAPI,
  deleteAllNotifications as deleteAllNotificationsAPI,
  type NotificationItem,
} from '@/services/notification.service';
import { useAuth } from '@/hooks/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (params?: { limit?: number; offset?: number; onlyUnread?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useAuth();
  const queryClient = useQueryClient();

  // Use React Query for unread count to leverage cache invalidation
  const { data: unreadCountData } = useQuery({
    queryKey: ['notification-unread'],
    queryFn: async () => {
      const response = await getUnreadCount();
      return response.unreadCount;
    },
    enabled: isLoggedIn,
    staleTime: 30 * 1000, // Consider stale after 30 seconds
    refetchInterval: 60 * 1000, // Poll every 60 seconds as fallback for missed FCM
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when tab gains focus
    refetchOnReconnect: true, // Refetch when network reconnects
  });
  
  const unreadCount = unreadCountData ?? 0;

  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;
    
    // Just invalidate the query, let React Query handle refetching
    queryClient.invalidateQueries({ queryKey: ['notification-unread'] });
  }, [isLoggedIn, queryClient]);

  const fetchNotifications = useCallback(async (params?: { limit?: number; offset?: number; onlyUnread?: boolean }) => {
    if (!isLoggedIn) return;

    try {
      setIsLoading(true);
      const response = await getNotifications(params);
      setNotifications(response.notifications);
      // Also update unread count from response
      queryClient.setQueryData(['notification-unread'], response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, queryClient]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      // Check if notification is already read
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      await markNotificationRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Decrement unread count if notification was unread
      if (wasUnread) {
        queryClient.setQueryData(['notification-unread'], (old: number | undefined) => Math.max(0, (old ?? 0) - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
      // Revert on error
      await fetchUnreadCount();
      throw error;
    }
  }, [notifications, fetchUnreadCount, queryClient]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      queryClient.setQueryData(['notification-unread'], 0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }, [queryClient]);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      // Check if notification was unread before deleting
      const notification = notifications.find(n => n.id === id);
      const wasUnread = notification && !notification.isRead;
      
      await deleteNotificationAPI(id);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      // Decrement unread count if deleted notification was unread
      if (wasUnread) {
        queryClient.setQueryData(['notification-unread'], (old: number | undefined) => Math.max(0, (old ?? 0) - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert on error
      await fetchUnreadCount();
      throw error;
    }
  }, [notifications, fetchUnreadCount, queryClient]);

  const deleteAllNotifications = useCallback(async () => {
    try {
      await deleteAllNotificationsAPI();
      
      // Clear all notifications from local state
      setNotifications([]);
      queryClient.setQueryData(['notification-unread'], 0);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }, [queryClient]);

  // NOTE: FCM listener is handled by useGuidanceRealtime hook in DashboardLayout
  // to avoid duplicate listeners and ensure proper event routing based on notification type
  // The query ['notification-unread'] will be invalidated by useGuidanceRealtime when FCM arrives

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

