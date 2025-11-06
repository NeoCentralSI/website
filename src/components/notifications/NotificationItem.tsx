import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  CalendarDays, 
  MessageSquareText, 
  FileText, 
  BookOpen,
  CheckCircle2,
  Trash2,
  Clock
} from "lucide-react";

export type NotificationItemProps = {
  notification: {
    id: string;
    title?: string | null;
    message?: string | null;
    createdAt: string;
    isRead: boolean;
  };
  onMarkRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function formatMessageWithNames(message: string): string {
  if (!message) return message;
  
  // Backend already sends properly formatted messages with toTitleCaseName
  // Just return the message as-is, no regex processing needed
  return message.trim();
}

function getNotificationIcon(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase();
  
  if (text.includes('bimbingan') || text.includes('guidance')) {
    return <CalendarDays className="h-4 w-4" />;
  }
  if (text.includes('catatan') || text.includes('feedback') || text.includes('comment')) {
    return <MessageSquareText className="h-4 w-4" />;
  }
  if (text.includes('dokumen') || text.includes('document') || text.includes('file')) {
    return <FileText className="h-4 w-4" />;
  }
  if (text.includes('tugas') || text.includes('thesis') || text.includes('proposal')) {
    return <BookOpen className="h-4 w-4" />;
  }
  
  return <Clock className="h-4 w-4" />;
}

function getNotificationColor(title: string, message: string) {
  const text = `${title} ${message}`.toLowerCase();
  
  if (text.includes('bimbingan') || text.includes('guidance')) {
    return 'bg-blue-50 text-blue-600 border-blue-200';
  }
  if (text.includes('catatan') || text.includes('feedback')) {
    return 'bg-green-50 text-green-600 border-green-200';
  }
  if (text.includes('dokumen') || text.includes('document')) {
    return 'bg-purple-50 text-purple-600 border-purple-200';
  }
  if (text.includes('ditolak') || text.includes('rejected') || text.includes('gagal')) {
    return 'bg-red-50 text-red-600 border-red-200';
  }
  
  return 'bg-gray-50 text-gray-600 border-gray-200';
}

export default function NotificationItem({ 
  notification, 
  onMarkRead, 
  onDelete 
}: NotificationItemProps) {
  const { id, title, message, createdAt, isRead } = notification;
  const created = parseISO(createdAt);
  
  // Short relative time formatter: 30s -> "now", 1m -> "1m", 2h -> "2h", 3d -> "3d"
  const ms = Date.now() - created.getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  const rel = s < 45 ? "now" : m < 60 ? `${m}m` : h < 24 ? `${h}h` : `${d}d`;
  
  // Absolute timestamp under each item (localized time)
  const absolute = format(created, "dd MMM yyyy HH:mm", { locale: idLocale });
  
  const iconColorClass = getNotificationColor(title || '', message || '');
  
  // Format message with proper name casing
  const formattedMessage = message ? formatMessageWithNames(message) : '-';

  return (
    <div 
      className={cn(
        "group relative p-4 rounded-lg border transition-all duration-200 hover:shadow-sm",
        isRead 
          ? "bg-background border-border" 
          : "bg-muted/30 border-muted-foreground/20 shadow-sm"
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-3 left-3 h-2 w-2 rounded-full bg-primary" />
      )}
      
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg border shrink-0",
          iconColorClass
        )}>
          {getNotificationIcon(title || '', message || '')}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={cn(
              "text-sm leading-5 wrap-break-word flex-1",
              isRead ? "text-muted-foreground" : "text-foreground font-medium"
            )}>
              {title || 'Notifikasi'}
            </h4>
            <span className="shrink-0 inline-flex h-5 items-center rounded-full border px-2 text-xs text-muted-foreground">
              {rel}
            </span>
          </div>
          
          <p className={cn(
            "text-xs leading-5 wrap-break-word whitespace-pre-wrap",
            isRead ? "text-muted-foreground/80" : "text-muted-foreground"
          )}>
            {formattedMessage}
          </p>

          {/* Absolute timestamp */}
          <div className="mt-1 text-[10px] text-muted-foreground">
            {absolute}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isRead && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => onMarkRead(id)}
              title="Tandai sudah dibaca"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(id)}
            title="Hapus notifikasi"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
