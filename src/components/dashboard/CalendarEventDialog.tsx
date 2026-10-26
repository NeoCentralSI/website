import { eventInstant, formatWibDate, formatWibTime, wibDayKey } from '@/lib/eventTime';
import { Calendar, ExternalLink, MapPin, Users, Video } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CalendarEvent } from '@/types/calendar.types';

/** The label of an event kind, the same in the calendar and in Agenda Mendatang. */
export function getEventKindLabel(event: Pick<CalendarEvent, 'type' | 'kindLabel'>): string {
  if (event.kindLabel) return event.kindLabel;
  const labels: Record<string, string> = {
    guidance_scheduled: 'Bimbingan',
    student_guidance: 'Bimbingan',
    seminar_scheduled: 'Seminar Hasil',
    seminar_as_examiner: 'Seminar Hasil',
    defense_scheduled: 'Sidang',
    defense_as_examiner: 'Sidang',
    yudisium_event: 'Yudisium',
    internship_seminar: 'Seminar KP',
    outlook_event: 'Outlook',
  };
  return labels[event.type] ?? 'Agenda';
}

const LEGACY_STATUS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  requested: { label: 'Menunggu Persetujuan', variant: 'secondary' },
  accepted: { label: 'Diterima', variant: 'default' },
  rejected: { label: 'Ditolak', variant: 'destructive' },
};

const ROLE_LABELS: Record<string, string> = { student: 'Mahasiswa', lecturer: 'Dosen', admin: 'Admin', moderator: 'Moderator' };

/** "Selasa, 12 Maret 2031 · 09.00–11.00", always in WIB whatever the device's zone. */
export function formatWhen(event: CalendarEvent): string {
  const day = formatWibDate(event.startDate);
  if (event.allDay) return `${day} · Sepanjang hari`;
  const from = formatWibTime(event.startDate);
  const to = event.endDate && eventInstant(event.endDate).getTime() !== eventInstant(event.startDate).getTime() ? formatWibTime(event.endDate) : null;
  return to ? `${day} · ${from}–${to}` : `${day} · ${from}`;
}

/** Outlook link of the viewer's synced copy, or of an event read from Outlook. */
function outlookLink(event: CalendarEvent): string | null {
  if (event.type === 'outlook_event') {
    const webLink = (event as unknown as { metadata?: { webLink?: string } }).metadata?.webLink;
    return webLink ?? null;
  }
  if (event.outlookEventId) return `https://outlook.office.com/calendar/item/${encodeURIComponent(event.outlookEventId)}`;
  // KP events keep their former link: Outlook opened on the day of the event.
  if (event.type === 'internship_seminar') {
    return `https://outlook.live.com/calendar/0/view/day/${wibDayKey(event.startDate)}`;
  }
  return null;
}

/**
 * Detail of a calendar event, the pattern of the Bimbingan modal for every kind: title, date and
 * time, kind badge, status badge, location, description, participants with their role badge, and
 * Tutup · Lihat Detail · Lihat di Outlook (the last two only when they lead somewhere).
 */
export function CalendarEventDialog({ event, onClose }: { event: CalendarEvent | null; onClose: () => void }) {
  const status = event?.statusLabel
    ? { label: event.statusLabel, variant: 'default' as const }
    : event?.status ? LEGACY_STATUS[event.status] : undefined;
  const outlook = event ? outlookLink(event) : null;

  return (
    <Dialog open={!!event} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="overflow-hidden sm:max-w-lg">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="break-words">{event.title}</DialogTitle>
              <DialogDescription>{formatWhen(event)}</DialogDescription>
            </DialogHeader>

            <div className="min-w-0 space-y-4 break-words">
              <div className="flex flex-wrap items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className={event.type === 'outlook_event' ? 'bg-[#0078d4] text-white hover:bg-[#0078d4]/90' : ''}>
                  {getEventKindLabel(event)}
                </Badge>
              </div>

              {status && event.type !== 'outlook_event' && (
                <div>
                  <div className="mb-1 text-sm font-medium">Status</div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              )}

              {event.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">Lokasi</div>
                    <p className="text-sm text-muted-foreground break-words">{event.location}</p>
                  </div>
                </div>
              )}

              {event.meetingLink && (
                <div className="flex items-start gap-2">
                  <Video className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">Rapat Daring</div>
                    {/* Never the raw URL: long links pushed the modal wider than the screen. */}
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Buka tautan rapat
                    </a>
                  </div>
                </div>
              )}

              {event.description && (
                <div>
                  <div className="mb-1 text-sm font-medium">Deskripsi</div>
                  <p className="whitespace-pre-line break-words text-sm text-muted-foreground">{event.description}</p>
                </div>
              )}

              {event.participants && event.participants.length > 0 && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="mb-2 text-sm font-medium">Peserta</div>
                    <div className="space-y-2">
                      {event.participants.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate" title={participant.name}>{participant.name}</span>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {participant.roleLabel ?? ROLE_LABELS[participant.role] ?? 'Peserta'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Equal-width buttons that always stay inside the modal. */}
              <div className="grid auto-cols-fr grid-flow-col gap-2 border-t border-gray-200 pt-4 [&>*]:min-w-0">
                <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
                {/* KP events keep their meeting button. */}
                {event.type === 'internship_seminar' && event.meetingLink && (
                  <Button className="w-full gap-2" asChild>
                    <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Buka Meeting
                    </a>
                  </Button>
                )}
                {event.detailPath && (
                  <Button className="w-full" asChild>
                    <Link to={event.detailPath} onClick={onClose}>Lihat Detail</Link>
                  </Button>
                )}
                {outlook && (
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <a href={outlook} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 shrink-0" />
                      <span className="truncate">{event.type === 'outlook_event' ? 'Buka di Outlook' : 'Lihat di Outlook'}</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
