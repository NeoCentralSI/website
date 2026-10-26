
import { eventInstant, formatWibDate, formatWibTime, wibDaysFromToday } from '@/lib/eventTime';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUpcomingEventsAPI } from '@/services/calendar.service';
import type { CalendarEvent } from '@/types/calendar.types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Loader2, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmptyState from '@/components/ui/empty-state';
import { getEventKindLabel } from './CalendarEventDialog';

interface UpcomingEventsCardProps {
  className?: string;
  /** KP events of the student, merged in as before. */
  extraEvents?: CalendarEvent[];
  isLoadingExtraEvents?: boolean;
  /** Opens the same detail modal as the calendar. */
  onEventClick?: (event: CalendarEvent) => void;
}

const LIMIT = 5;

export function UpcomingEventsCard({
  className,
  extraEvents = [],
  isLoadingExtraEvents = false,
  onEventClick,
}: UpcomingEventsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => getUpcomingEventsAPI(LIMIT),
  });

  const isLoadingAll = isLoading || isLoadingExtraEvents;

  // Filter and sort events (ensure they are future events)
  const events = useMemo(() => {
    return [...(data?.events || []), ...extraEvents]
      // Still going on or coming: it ends now or later (the server already sends only these).
      .filter(event => {
        const end = event.allDay
          ? new Date(eventInstant(event.startDate).getTime() + 24 * 60 * 60 * 1000)
          : eventInstant(event.endDate ?? event.startDate);
        return end >= new Date();
      })
      .sort((a, b) => eventInstant(a.startDate).getTime() - eventInstant(b.startDate).getTime())
      .slice(0, LIMIT);
  }, [data?.events, extraEvents]);

  if (isLoadingAll) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Agenda Mendatang</CardTitle>
          <CardDescription>Kegiatan Anda dalam waktu dekat</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if ((error && events.length === 0) || events.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Agenda Mendatang</CardTitle>
          <CardDescription>Kegiatan Anda dalam waktu dekat</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <EmptyState title="Belum Ada Agenda" description="Tidak ada agenda mendatang" size="sm" className="py-0" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda Mendatang
        </CardTitle>
        <CardDescription>
          {events.length} kegiatan dijadwalkan
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0 min-h-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-6">
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              // Days and times in WIB, whatever the device's zone.
              const daysLeft = Math.max(0, wibDaysFromToday(event.startDate));
              const isToday = daysLeft === 0;

              let daysText = '';
              if (daysLeft === 0) daysText = 'Hari ini';
              else if (daysLeft === 1) daysText = 'Besok';
              else daysText = `${daysLeft} hari lagi`;

              return (
                <div
                  key={event.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onEventClick?.(event)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onEventClick?.(event);
                    }
                  }}
                  className="relative cursor-pointer rounded-md pl-6 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Vertical Line */}
                  {!isLast && (
                    <div className="absolute left-[9px] top-3 -bottom-6 w-0.5 bg-border group-hover:bg-primary/20 transition-colors" />
                  )}

                  {/* Dot Indicator */}
                  <div className={cn(
                    "absolute left-0 top-1.5 h-5 w-5 rounded-full border-4 border-background flex items-center justify-center transition-colors",
                    isToday ? "bg-primary shadow-sm" : "bg-muted-foreground/30 group-hover:bg-primary/50"
                  )}>
                    {isToday && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {event.title}
                      </span>
                      {daysLeft <= 3 ? (
                        <Badge variant={isToday ? "default" : "secondary"} className="shrink-0 text-[10px] px-1.5 py-0 h-5 whitespace-nowrap">
                          {daysText}
                        </Badge>
                      ) : (
                        <span className="shrink-0 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                          {daysText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {event.allDay
                          ? `${formatWibDate(event.startDate, 'short')} • Sepanjang hari`
                          : `${formatWibDate(event.startDate, 'short')} • ${formatWibTime(event.startDate)}`}
                      </span>
                    </div>

                    {/* Location / Link */}
                    {(event.location || event.meetingLink) && (
                      <div className="flex items-center gap-2 mt-1">
                        {event.meetingLink ? (
                          <Badge variant="outline" className="gap-1 p-0.5 px-2 font-normal text-xs hover:bg-muted cursor-pointer as-child" >
                            <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <VideoIcon className="h-3 w-3" />
                              <span>Daring</span>
                            </a>
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Event Type Badge - Optional, clean look */}
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-[10px] font-normal px-2 h-5">
                        {getEventKindLabel(event)}
                      </Badge>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
