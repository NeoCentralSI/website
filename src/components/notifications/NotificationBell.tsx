import { BellIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import NotificationsSheetContent from "@/components/notifications/NotificationsSheet";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNotifications } from "@/hooks/shared";

type Props = {
  className?: string;
  onClick?: () => void;
  showZero?: boolean; // show badge even if 0
  refetchIntervalMs?: number; // polling interval
  size?: number; // icon size (px)
};

export default function NotificationBell({
  className,
  onClick,
  showZero = false,
  refetchIntervalMs,
  size = 20,
}: Props) {
  const [open, setOpen] = useState(false);
  const { unreadCount, fetchNotifications, fetchUnreadCount } = useNotifications();
  
  // Use unreadCount from context instead of separate query
  const count = unreadCount ?? 0;
  const showBadge = showZero ? true : count > 0;
  
  // Optional: still allow polling for backup (but context should handle this via FCM)
  useQuery({
    queryKey: ["notification-unread-poll"],
    queryFn: async () => {
      await fetchUnreadCount();
      return null;
    },
    enabled: !!refetchIntervalMs,
    refetchInterval: refetchIntervalMs,
  });

  useEffect(() => {
    if (open) fetchNotifications().catch(() => {});
  }, [open, fetchNotifications]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          className={cn("relative", className)}
          aria-label="Notifikasi"
        >
          <BellIcon style={{ width: size, height: size }} />
          {showBadge && (
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] leading-4 text-white",
                count > 0 ? "bg-red-500" : "bg-muted-foreground/40"
              )}
            >
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[30vw] sm:w-[30vw] sm:max-w-[30vw] min-w-[360px] max-w-none p-0"
      >
        <div className="flex flex-col h-full">
          <div className="border-b bg-background px-6 py-4 pr-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Notifikasi</h2>
              {unreadCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{unreadCount} belum dibaca</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 px-6 py-4 overflow-hidden">
            <NotificationsSheetContent />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
