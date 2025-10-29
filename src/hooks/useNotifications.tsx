/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationAPI,
  type NotificationItem,
} from '@/services/notification.service';
import { useAuth } from './useAuth';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (params?: { limit?: number; offset?: number; onlyUnread?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
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
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isLoggedIn } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return;
    
    try {
  const response = await getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isLoggedIn]);

  const fetchNotifications = useCallback(async (params?: { limit?: number; offset?: number; onlyUnread?: boolean }) => {
    if (!isLoggedIn) return;

    try {
      setIsLoading(true);
  const response = await getNotifications(params);
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  const markAsRead = useCallback(async (id: string) => {
    try {
  await markNotificationRead(id);
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      throw error;
    }
  }, [fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    try {
  await markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
  await deleteNotificationAPI(id);
      
      // Update local state
      setNotifications(prev => prev.filter(notif => notif.id !== id));
      
      // Update unread count
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }, [fetchUnreadCount]);

  // Fetch unread count on mount and when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      
      // Poll for unread count every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

