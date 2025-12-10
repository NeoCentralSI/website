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
    };
    return labels[type] || type;
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
              <div>
                <div className="text-sm font-medium mb-1">Tipe Event</div>
                <Badge variant="outline">{getEventTypeLabel(selectedEvent.type)}</Badge>
              </div>

              {/* Status */}
              <div>
                <div className="text-sm font-medium mb-1">Status</div>
                <Badge variant={getStatusBadge(selectedEvent.status)}>
                  {selectedEvent.status === 'requested' && 'Menunggu Persetujuan'}
                  {selectedEvent.status === 'accepted' && 'Diterima'}
                  {selectedEvent.status === 'rejected' && 'Ditolak'}
                </Badge>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div>
                  <div className="text-sm font-medium mb-1">Deskripsi</div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>
                </div>
              )}

              {/* Location */}
              {selectedEvent.location && (
                <div>
                  <div className="text-sm font-medium mb-1">Lokasi</div>
                  <p className="text-sm text-muted-foreground">{selectedEvent.location}</p>
                </div>
              )}

              {/* Meeting Link */}
              {selectedEvent.meetingLink && (
                <div>
                  <div className="text-sm font-medium mb-1">Link Meeting</div>
                  <a 
                    href={selectedEvent.meetingLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {selectedEvent.meetingLink}
                  </a>
                </div>
              )}

              {/* Participants */}
              {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                <div>
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
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedEvent(null)}>
                  Tutup
                </Button>
                {selectedEvent.meetingLink && (
                  <Button className="flex-1" asChild>
                    <a href={selectedEvent.meetingLink} target="_blank" rel="noopener noreferrer">
                      Buka Meeting
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
