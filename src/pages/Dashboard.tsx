import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { CalendarDashboard } from "@/components/layout/CalendarDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { CalendarEvent } from "@/types/calendar.types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getEventStatisticsAPI, getUpcomingEventsAPI } from "@/services/calendar.service";
import { useRole } from "@/hooks/useRole";

export default function Dashboard() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);
  const { getRoleNames } = useRole();
  const primaryRole = getRoleNames()[0] || 'student';

  useEffect(() => {
    setBreadcrumbs([{ label: "Dashboard" }]);
    setTitle(undefined);
  }, [setBreadcrumbs, setTitle]);

  // Get event statistics
  const { data: stats } = useQuery({
    queryKey: ['event-statistics'],
    queryFn: getEventStatisticsAPI,
    staleTime: 5 * 60 * 1000,
  });

  // Get upcoming events
  const { data: upcomingData } = useQuery({
    queryKey: ['upcoming-events'],
    queryFn: () => getUpcomingEventsAPI(7),
    staleTime: 2 * 60 * 1000,
  });

  const upcomingEvents = upcomingData?.events || [];

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
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Hari Ini</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayEvents || 0}</div>
            <p className="text-xs text-muted-foreground">Event yang dijadwalkan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Mendatang</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.upcomingEvents || 0}</div>
            <p className="text-xs text-muted-foreground">7 hari ke depan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selesai Bulan Ini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completedThisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Event yang diselesaikan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {primaryRole === 'lecturer' ? 'Perlu Tindakan' : 'Event Tertunda'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pendingActions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {primaryRole === 'lecturer' ? 'Permintaan bimbingan' : 'Menunggu konfirmasi'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content: Calendar and Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar - Takes 2 columns */}
        <div className="lg:col-span-2">
          <CalendarDashboard
            onEventClick={handleEventClick}
            onCreateEvent={handleCreateEvent}
          />
        </div>

        {/* Upcoming Events Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Mendatang</CardTitle>
              <CardDescription>7 hari ke depan</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Tidak ada event mendatang
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col gap-2 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm line-clamp-1">{event.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(new Date(event.startDate), 'EEEE, dd MMM yyyy', { locale: idLocale })}
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(event.status)} className="text-xs">
                          {format(new Date(event.startDate), 'HH:mm')}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs w-fit">
                        {getEventTypeLabel(event.type)}
                      </Badge>
                    </div>
                  ))}
                  
                  {upcomingEvents.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      +{upcomingEvents.length - 5} event lainnya
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
