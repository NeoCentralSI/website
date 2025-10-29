import { BellIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUnreadCount } from "@/services/notification.service";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  refetchIntervalMs = 30000,
  size = 20,
}: Props) {
  const { data } = useQuery({
    queryKey: ["notification-unread"],
    queryFn: async () => {
      const res = await getUnreadCount();
      return res.unreadCount ?? 0;
    },
    refetchInterval: refetchIntervalMs,
  });

  const count = data ?? 0;
  const showBadge = showZero ? true : count > 0;

  return (
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
  );
}
