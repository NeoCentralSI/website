import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Bell, Check } from "lucide-react";
import NotificationItem from "@/components/notifications/NotificationItem";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState } from "react";

function groupNotificationsByDate(notifications: any[]) {
  const groups: { [key: string]: any[] } = {};
  
  notifications.forEach(notification => {
    const date = parseISO(notification.createdAt);
    let groupKey = "";
    
    if (isToday(date)) {
      groupKey = "Hari ini";
    } else if (isYesterday(date)) {
      groupKey = "Kemarin";
    } else {
      groupKey = format(date, "d MMMM yyyy", { locale: idLocale });
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });
  
  return groups;
}

export default function NotificationsSheetContent() {
  const { notifications, isLoading, markAsRead, deleteNotification, markAllAsRead, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;
  
  const groupedNotifications = groupNotificationsByDate(filteredNotifications);
  const groupKeys = Object.keys(groupedNotifications).sort((a, b) => {
    if (a === "Hari ini") return -1;
    if (b === "Hari ini") return 1;
    if (a === "Kemarin") return -1;
    if (b === "Kemarin") return 1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="h-8"
          >
            Semua
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
            className="h-8"
          >
            Belum dibaca
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-2 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsRead()}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Check className="h-3 w-3 mr-1" />
            Tandai semua dibaca
          </Button>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {filter === 'unread' ? 'Tidak ada notifikasi yang belum dibaca' : 'Tidak ada notifikasi'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Notifikasi akan muncul di sini'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupKeys.map((groupKey) => (
              <div key={groupKey}>
                <div className="flex items-center mb-3">
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {groupKey}
                  </h3>
                  <div className="flex-1 h-px bg-border ml-3" />
                </div>
                <div className="space-y-1">
                  {groupedNotifications[groupKey].map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
