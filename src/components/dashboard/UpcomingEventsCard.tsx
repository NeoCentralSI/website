
import { useQuery } from '@tanstack/react-query';
import { getUpcomingEventsAPI } from '@/services/calendar.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, isSameDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Loader2, VideoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import EmptyState from '@/components/ui/empty-state';

interface UpcomingEventsCardProps {
  className?: string;
  limit?: number; // Add limit prop to control number of events shown
}

export function UpcomingEventsCard({ className, limit }: UpcomingEventsCardProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['upcoming-events', limit], // Include limit in queryKey
    queryFn: () => getUpcomingEventsAPI(limit ? 30 : 7), // If limit provided (likely home dashboard), fetch 30 days but slice later? Better to just fetch enough. API accepts days, let's stick to 7 or 30 days lookahead.
    // Let's use 14 days lookahead for "Upcoming"
  });

  // Filter and sort events (ensure they are future events)
  const events = data?.events
    ?.filter(event => new Date(event.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, limit || 5); // Default to 5 events if no limit specified

  if (isLoading) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Agenda Mendatang</CardTitle>
          <CardDescription>Kegiatan anda dalam waktu dekat</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !events || events.length === 0) {
    return (
      <Card className={cn("h-full", className)}>
        <CardHeader>
          <CardTitle>Agenda Mendatang</CardTitle>
           <CardDescription>Kegiatan anda dalam waktu dekat</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center min-h-[200px]">
          <EmptyState
            title=""
            description="Tidak ada agenda mendatang"
            size="sm"
            className="py-0"
          />
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
              const eventDate = new Date(event.startDate);
              const now = new Date();
              const isToday = isSameDay(eventDate, now);
              
              // Calculate remaining days
              // We reset time to midnight for accurate day comparison
              const date1 = new Date(eventDate);
              date1.setHours(0, 0, 0, 0);
              const date2 = new Date(now);
              date2.setHours(0, 0, 0, 0);
              const daysLeft = differenceInDays(date1, date2);
              
              let daysText = '';
              if (daysLeft === 0) daysText = 'Hari ini';
              else if (daysLeft === 1) daysText = 'Besok';
              else daysText = `${daysLeft} hari lagi`;

              return (
                <div key={event.id} className="relative pl-6 group">
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
                        {format(eventDate, 'EEE, d MMM yyyy • HH:mm', { locale: idLocale })}
                      </span>
                    </div>
                    
                     {/* Location / Link */}
                    {(event.location || event.meetingLink) && (
                      <div className="flex items-center gap-2 mt-1">
                        {event.meetingLink ? (
                           <Badge variant="outline" className="gap-1 p-0.5 px-2 font-normal text-xs hover:bg-muted cursor-pointer as-child" >
                              <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                                <VideoIcon className="h-3 w-3" />
                                <span>Online Meeting</span>
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
                            {formatEventType(event.type)}
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

function formatEventType(type: string) {
  const labels: Record<string, string> = {
    guidance_scheduled: 'Bimbingan',
    guidance_request: 'Permintaan Bimbingan',
    thesis_deadline: 'Deadline TA',
    seminar_scheduled: 'Seminar',
    defense_scheduled: 'Sidang',
    student_guidance: 'Bimbingan Mhs',
    meeting: 'Rapat',
    holiday: 'Libur',
    outlook_event: 'Outlook',
  };
  return labels[type] || type.replace(/_/g, ' ');
}
