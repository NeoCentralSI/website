import { useNotifications } from "@/hooks/shared";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Trash2 } from "lucide-react";
import NotificationItem from "@/components/notifications/NotificationItem";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useState } from "react";
import EmptyState from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const { notifications, isLoading, markAsRead, deleteNotification, markAllAsRead, deleteAllNotifications, unreadCount } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  
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
      <div className="flex flex-col gap-3 mb-2 pb-2">
        <div className="flex items-center justify-between gap-2">
          {/* Filters - Left Aligned */}
          <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-md border">
            <Button
              variant={filter === 'all' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className={cn(
                "h-7 text-xs px-3",
                filter === 'all' && "bg-white shadow-sm dark:bg-zinc-800"
              )}
            >
              Semua
            </Button>
            <Button
              variant={filter === 'unread' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('unread')}
              className={cn(
                "h-7 text-xs px-3",
                filter === 'unread' && "bg-white shadow-sm dark:bg-zinc-800"
              )}
            >
              Belum dibaca
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-medium bg-primary/10 text-primary rounded-full">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>
        
        {/* Bulk Actions - Right Aligned (Separate Row to prevent overlap) */}
        {(unreadCount > 0 || notifications.length > 0) && (
          <div className="flex items-center justify-end gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5"
              >
                <Check className="h-3 w-3 mr-1.5" />
                Tandai dibaca
              </Button>
            )}
            
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1.5" />}
                    Hapus semua
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Semua Notifikasi?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menghapus semua notifikasi secara permanen dan tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-white hover:bg-destructive/90"
                      onClick={async () => {
                        setIsDeleting(true);
                        try {
                          await deleteAllNotifications();
                          toast.success("Semua notifikasi dihapus");
                        } catch {
                          toast.error("Gagal menghapus notifikasi");
                        } finally {
                          setIsDeleting(false);
                        }
                      }}
                    >
                      Hapus Semua
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </div>

      <Separator className="mb-4" />

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <EmptyState
            title={filter === 'unread' ? 'Tidak Ada Notifikasi Belum Dibaca' : 'Tidak Ada Notifikasi'}
            description={filter === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Notifikasi akan muncul di sini'}
            size="sm"
            className="py-8"
          />
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
