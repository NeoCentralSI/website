import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { CalendarDashboard } from "@/components/layout/CalendarDashboard";
import { Badge } from "@/components/ui/badge";
import type { CalendarEvent } from "@/types/calendar.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Users, Video } from "lucide-react";

export default function Dashboard() {
  console.log('🎯 [Dashboard] Component rendering');
  
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);

  useEffect(() => {
    console.log('📋 [Dashboard] Setting breadcrumbs and title');
    setBreadcrumbs([{ label: "Dashboard" }]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Generate Outlook web link for viewing event in Outlook Calendar
  const getOutlookWebLink = (event: CalendarEvent) => {
    console.log('[Dashboard] Generating Outlook link for event:', {
      type: event.type,
      title: event.title,
      startDate: event.startDate,
      status: event.status
    });
    
    if (event.type === 'outlook_event') {
      // For Outlook events, use the webLink if available
      const webLink = (event as any)?.metadata?.webLink;
      if (webLink) {
        console.log('[Dashboard] Using webLink for Outlook event:', webLink);
        return webLink;
      }
    }
    
    // For any event (internal or Outlook), try to construct specific event link
    const outlookEventId = (event as any)?.outlookEventId || 
                           (event as any)?.studentCalendarEventId || 
                           (event as any)?.supervisorCalendarEventId;
    
    if (outlookEventId) {
      console.log('[Dashboard] Using specific event ID:', outlookEventId);
      return `https://outlook.live.com/calendar/0/view/event/${outlookEventId}`;
    }
    
    // Fallback: Open Outlook Calendar to the event date and time
    const eventDate = new Date(event.startDate);
    const dateString = eventDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeString = eventDate.toISOString(); // Full ISO string for better navigation
    
    console.log('[Dashboard] Using fallback calendar view for date:', dateString);
    
    // Use the calendar view with date parameter - this will navigate to the specific day
    return `https://outlook.live.com/calendar/0/view/day/${dateString}`;
  };

  const handleCreateEvent = () => {
    setCreateEventOpen(true);
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      guidance_scheduled: 'Bimbingan Diterima',
      guidance_request: 'Bimbingan Menunggu',
      guidance_rejected: 'Bimbingan Ditolak',
      thesis_deadline: 'Deadline Tugas Akhir',
      seminar_scheduled: 'Seminar',
      defense_scheduled: 'Sidang',
      student_guidance: 'Bimbingan Mahasiswa',
      meeting: 'Meeting',
      holiday: 'Libur',
      outlook_event: 'Outlook Calendar',
    };
    return labels[type] || type;
  };

  const getEventTypeBadgeColor = (type: string) => {
    if (type === 'outlook_event') {
      return 'bg-[#0078d4] text-white hover:bg-[#0078d4]/90';
    }
    return '';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      requested: 'secondary',
      accepted: 'default',
      rejected: 'destructive',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Calendar Only */}
      <CalendarDashboard
        onEventClick={handleEventClick}
        onCreateEvent={handleCreateEvent}
      />

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              {selectedEvent && format(new Date(selectedEvent.startDate), 'EEEE, dd MMMM yyyy HH:mm', { locale: idLocale })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              {/* Event Type */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Badge 
                  variant="outline" 
                  className={getEventTypeBadgeColor(selectedEvent.type)}
                >
                  {getEventTypeLabel(selectedEvent.type)}
                </Badge>
              </div>

              {/* Status - hide for outlook events since they're always confirmed */}
              {selectedEvent.type !== 'outlook_event' && (
                <div>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <Badge variant={getStatusBadge(selectedEvent.status)}>
                    {selectedEvent.status === 'requested' && 'Menunggu Persetujuan'}
                    {selectedEvent.status === 'accepted' && 'Diterima'}
                    {selectedEvent.status === 'rejected' && 'Ditolak'}
                  </Badge>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <div className="text-sm font-medium mb-1">Deskripsi</div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">Lokasi</div>
                    <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                  </div>
                </div>
              )}

              {/* Meeting Link */}
              {selectedEvent.meetingLink && (
                <div className="flex items-start gap-2">
                  <Video className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">Link Meeting</div>
                    <a 
                      href={selectedEvent.meetingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                      title={selectedEvent.meetingLink}
                    >
                      {selectedEvent.meetingLink.length > 50 
                        ? selectedEvent.meetingLink.substring(0, 50) + '...' 
                        : selectedEvent.meetingLink}
                    </a>
                  </div>
                </div>
              )}

              {/* Participants */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium mb-2">Peserta</div>
                    <div className="space-y-2">
                      {selectedEvent.participants.map((participant, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span>{participant.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {participant.role === 'student' && 'Mahasiswa'}
                            {participant.role === 'lecturer' && 'Dosen'}
                            {participant.role === 'admin' && 'Admin'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedEvent(null)}>
                  Tutup
                </Button>
                
                {/* Meeting Link Button */}
                {selectedEvent.meetingLink && (
                  <Button className="flex-1 gap-2" asChild>
                    <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Buka Meeting
                    </a>
                  </Button>
                )}
                
                {/* View in Outlook Button - Show for all accepted events or outlook events */}
                {(selectedEvent.type === 'outlook_event' || 
                  selectedEvent.status === 'accepted' || 
                  selectedEvent.type === 'student_guidance' ||
                  selectedEvent.type === 'guidance_scheduled'
                ) && (
                  <Button variant="outline" className="flex-1 gap-2" asChild>
                    <a href={getOutlookWebLink(selectedEvent)} target="_blank" rel="noopener noreferrer">
                      <Calendar className="h-4 w-4" />
                      Lihat di Outlook
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog - Placeholder */}
      <Dialog open={createEventOpen} onOpenChange={setCreateEventOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Buat Event Baru</DialogTitle>
            <DialogDescription>
              Fitur ini akan segera tersedia
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center text-muted-foreground">
            <p>Form untuk membuat event custom akan ditambahkan di sini</p>
          </div>
          <Button variant="outline" onClick={() => setCreateEventOpen(false)}>
            Tutup
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
