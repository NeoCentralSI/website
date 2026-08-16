import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import {
  CheckCircle2,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { getNotificationRoute, type NotificationItem as NotificationRecord } from "@/services/notification.service";
import { cn } from "@/lib/utils";

export type NotificationItemProps = {
  notification: NotificationRecord;
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onNavigate?: () => void;
};

function formatMessageWithNames(message: string): string {
  if (!message) return message;
  
  // Backend already sends properly formatted messages with toTitleCaseName
  // Just return the message as-is, no regex processing needed
  return message.trim();
}

export default function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete,
  onNavigate,
}: NotificationItemProps) {
  const navigate = useNavigate();
  const { id, title, message, createdAt, isRead } = notification;
  const created = parseISO(createdAt);
  const route = getNotificationRoute(notification);
  
  // Short relative time formatter: 30s -> "now", 1m -> "1m", 2h -> "2h", 3d -> "3d"
  const ms = Date.now() - created.getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const rel = s < 45 ? "now" : m < 60 ? `${m}m` : h < 24 ? `${h}h` : `${d}d`;
  
  // Absolute timestamp under each item (localized time)
  const absolute = format(created, "dd MMM yyyy HH:mm", { locale: idLocale });
  
  // Format message with proper name casing
  const formattedMessage = message ? formatMessageWithNames(message) : '-';

  const openRelatedPage = async () => {
    if (!isRead) {
      try {
        await onMarkRead(id);
      } catch {
        // Still navigate when a route exists so the user reaches the relevant page.
      }
    }
    if (!route) return;
    onNavigate?.();
    navigate(route);
  };

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className={cn(
          "text-sm leading-5 wrap-break-word",
          isRead ? "text-muted-foreground" : "text-foreground font-medium"
        )}>
          {title || 'Notifikasi'}
        </div>
        <span className="shrink-0 inline-flex h-5 items-center rounded-full border px-2 text-xs text-muted-foreground">
          {rel}
        </span>
      </div>
      
      <p className={cn(
        "text-xs leading-relaxed wrap-break-word mt-0.5",
        isRead ? "text-muted-foreground/80" : "text-muted-foreground"
      )}>
        {formattedMessage}
      </p>

      <div className="mt-1 text-[10px] text-muted-foreground/70">
        {absolute}
      </div>
    </>
  );

  const contentClassName = cn("flex-1 min-w-0 overflow-hidden text-left", !isRead && "pl-4");

  return (
    <div 
      className={cn(
        "group relative p-3 rounded-lg border transition-all duration-200 hover:shadow-sm",
        isRead 
          ? "bg-background border-border" 
          : "bg-muted/30 border-muted-foreground/20 shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        {!isRead && (
          <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-primary" />
        )}
        
        {route ? (
          <button
            type="button"
            className={cn(contentClassName, "cursor-pointer bg-transparent p-0 border-0")}
            onClick={() => { void openRelatedPage(); }}
          >
            {content}
          </button>
        ) : (
          <div className={contentClassName}>
            {content}
          </div>
        )}
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {!isRead && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => { void onMarkRead(id); }}
              title="Tandai sudah dibaca"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => { void onDelete(id); }}
            title="Hapus notifikasi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
