import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Check, CheckCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useNotifications } from '@/hooks/shared';
import { getNotificationRoute, type NotificationItem } from '@/services/notification.service';
import { cn } from '@/lib/utils';

export default function Notifikasi() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  
  // Memoized breadcrumbs
  const breadcrumbs = useMemo(() => [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Notifikasi' },
  ], []);
  
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle, breadcrumbs]);
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications({ onlyUnread: filter === 'unread' });
  }, [filter, fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleOpenNotification = async (notification: NotificationItem) => {
    const route = getNotificationRoute(notification);
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (!route) return;
    navigate(route);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: idLocale,
      });
    } catch {
      return dateString;
    }
  };

  return (
      <div className="p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-base font-semibold tracking-tight sm:text-lg">Notifikasi</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Anda memiliki {unreadCount} notifikasi yang belum dibaca
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Semua
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Belum Dibaca ({unreadCount})
          </Button>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isLoading}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-[calc(100vh-300px)] items-center justify-center">
          <Spinner className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <EmptyState
              title={filter === 'unread' ? 'Tidak Ada Notifikasi Belum Dibaca' : 'Tidak Ada Notifikasi'}
              description={filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Notifikasi akan muncul di sini'}
              size="md"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const route = getNotificationRoute(notification);
            return (
            <Card
              key={notification.id}
              className={cn(
                "transition-colors",
                !notification.isRead
                  ? "bg-blue-50 border-blue-200"
                  : "bg-white hover:bg-gray-50"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {route ? (
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left cursor-pointer bg-transparent p-0 border-0"
                      onClick={() => { void handleOpenNotification(notification); }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                        )}
                        <h3 className="font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full shrink-0" />
                        )}
                        <h3 className="font-semibold text-gray-900 truncate">
                          {notification.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 shrink-0">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { void handleMarkAsRead(notification.id); }}
                        title="Tandai sudah dibaca"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { void handleDelete(notification.id); }}
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
      </div>
  );
}

