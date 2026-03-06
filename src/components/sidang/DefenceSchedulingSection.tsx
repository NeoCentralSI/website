import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import idLocale from '@fullcalendar/core/locales/id';
import type { DateSelectArg, EventInput } from '@fullcalendar/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Spinner, Loading } from '@/components/ui/spinner';
import { Calendar, CheckCircle2, MapPin, Clock, CalendarDays, PencilLine, AlertCircle } from 'lucide-react';
import { useDefenceSchedulingData, useSetDefenceSchedule } from '@/hooks/defence';
import { toTitleCaseName } from '@/lib/text';
import type { DayOfWeek } from '@/types/defence.types';

function toLocalDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function extractTime(s: string): string {
  if (!s) return '--:--';
  if (s.includes('T')) {
    const d = new Date(s);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  return s.slice(0, 5);
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

const LECTURER_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

interface Props {
  defenceId: string;
  isEditable: boolean;
}

interface PendingSchedule {
  date: string;
  startTime: string;
  endTime: string;
  roomId: string | null;
  isOnline: boolean;
  meetingLink: string;
}

export function DefenceSchedulingSection({ defenceId, isEditable }: Props) {
  const { data: schedulingData, isLoading } = useDefenceSchedulingData(defenceId);
  const { mutate: doSetSchedule, isPending: isSaving } = useSetDefenceSchedule();

  const [pendingSchedule, setPendingSchedule] = useState<PendingSchedule | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const lecturerColorMap = useMemo(() => {
    if (!schedulingData) return {} as Record<string, string>;
    const map: Record<string, string> = {};
    let idx = 0;
    schedulingData.lecturerAvailabilities.forEach((a) => {
      if (!map[a.lecturerId]) {
        map[a.lecturerId] = LECTURER_COLORS[idx++ % LECTURER_COLORS.length];
      }
    });
    return map;
  }, [schedulingData]);

  const availabilityEvents = useMemo((): EventInput[] => {
    if (!schedulingData) return [];
    const events: EventInput[] = [];
    const weekMonday = getMondayOfWeek(new Date());
    const DAY_OFFSET: Record<DayOfWeek, number> = {
      monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4,
    };

    schedulingData.lecturerAvailabilities.forEach((slot) => {
      const offset = DAY_OFFSET[slot.day];
      if (offset === undefined) return;
      const startTime = extractTime(slot.startTime);
      const endTime = extractTime(slot.endTime);
      const color = lecturerColorMap[slot.lecturerId] || '#94a3b8';

      for (let week = 0; week < 8; week++) {
        const d = new Date(weekMonday);
        d.setDate(weekMonday.getDate() + offset + week * 7);
        const dateStr = toLocalDateStr(d);

        if (slot.validFrom && dateStr < slot.validFrom.slice(0, 10)) continue;
        if (slot.validUntil && dateStr > slot.validUntil.slice(0, 10)) continue;

        events.push({
          id: `avail-${slot.id}-w${week}`,
          title: toTitleCaseName(slot.lecturerName),
          start: `${dateStr}T${startTime}:00`,
          end: `${dateStr}T${endTime}:00`,
          backgroundColor: color + '22',
          borderColor: color,
          textColor: color,
          display: 'block',
          classNames: ['availability-event'],
          extendedProps: { type: 'availability' },
        });
      }
    });

    return events;
  }, [schedulingData, lecturerColorMap]);

  const scheduleEvent = useMemo((): EventInput[] => {
    const cs = schedulingData?.currentSchedule;
    if (!cs?.date || !cs.startTime || !cs.endTime) return [];
    const dateStr = cs.date.slice(0, 10);
    const scheduleTitle = cs.isOnline
      ? '📌 Sidang Daring'
      : `📌 Sidang${cs.room ? ` · ${cs.room.name}` : ''}`;
    return [{
      id: 'defence-schedule',
      title: scheduleTitle,
      start: `${dateStr}T${extractTime(cs.startTime)}:00`,
      end: `${dateStr}T${extractTime(cs.endTime)}:00`,
      backgroundColor: '#16a34a',
      borderColor: '#15803d',
      textColor: '#ffffff',
      classNames: ['schedule-event'],
      extendedProps: { type: 'schedule' },
    }];
  }, [schedulingData]);

  const allEvents = useMemo(() => [...availabilityEvents, ...scheduleEvent], [availabilityEvents, scheduleEvent]);

  const handleDateSelect = (info: DateSelectArg) => {
    if (!isEditable) return;
    setFormError(null);
    setPendingSchedule({
      date: info.startStr.slice(0, 10),
      startTime: info.startStr.slice(11, 16) || '08:00',
      endTime: info.endStr?.slice(11, 16) || '10:00',
      roomId: schedulingData?.rooms[0]?.id || null,
      isOnline: false,
      meetingLink: '',
    });
  };

  const validateForm = (s: PendingSchedule): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(s.date);
    if (selected < today) return 'Tanggal tidak boleh berada di masa lalu.';
    if (s.startTime >= s.endTime) return 'Waktu mulai harus sebelum waktu selesai.';
    if (s.isOnline) {
      if (!s.meetingLink.trim()) return 'URL meeting wajib diisi untuk sidang daring.';
      try {
        new URL(s.meetingLink);
      } catch {
        return 'URL meeting tidak valid.';
      }
      return null;
    }
    if (!s.roomId) return 'Ruangan harus dipilih.';
    return null;
  };

  const handleSave = () => {
    if (!pendingSchedule) return;
    const err = validateForm(pendingSchedule);
    if (err) {
      setFormError(err);
      return;
    }

    setFormError(null);
    doSetSchedule(
      {
        defenceId,
        payload: {
          date: pendingSchedule.date,
          startTime: pendingSchedule.startTime,
          endTime: pendingSchedule.endTime,
          isOnline: pendingSchedule.isOnline,
          roomId: pendingSchedule.isOnline ? null : pendingSchedule.roomId,
          meetingLink: pendingSchedule.isOnline ? pendingSchedule.meetingLink.trim() : null,
        },
      },
      {
        onSuccess: () => {
          toast.success('Jadwal sidang berhasil ditetapkan.');
          setPendingSchedule(null);
        },
        onError: (err) => {
          toast.error(err.message || 'Gagal menyimpan jadwal.');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Penjadwalan Sidang
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
            <Loading size="md" text="Memuat data penjadwalan..." />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedulingData) return null;

  const { rooms, currentSchedule: current } = schedulingData;
  const selectedRoom = rooms.find((r) => r.id === pendingSchedule?.roomId);

  const legendItems = [
    ...new Set(schedulingData.lecturerAvailabilities.map((a) => a.lecturerId)),
  ].map((id) => ({
    id,
    name: schedulingData.lecturerAvailabilities.find((a) => a.lecturerId === id)?.lecturerName || '-',
    color: lecturerColorMap[id] || '#94a3b8',
  }));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Penjadwalan Sidang
            </CardTitle>
            {current && (
              <Badge variant="success" className="flex items-center gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                Terjadwal
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {current && (
            <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex-1 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                  Jadwal Ditetapkan
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-green-800">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{formatDateLong(current.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600 shrink-0" />
                    <span>
                      {extractTime(current.startTime || '')} – {extractTime(current.endTime || '')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600 shrink-0" />
                    <span>{current.isOnline ? 'Sidang Daring' : (current.room?.name || '-')}</span>
                  </div>
                </div>
                {current.isOnline && current.meetingLink && (
                  <a
                    href={current.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-green-700 underline break-all"
                  >
                    {current.meetingLink}
                  </a>
                )}
              </div>
              {isEditable && (
                <p className="text-xs text-green-600 flex items-center gap-1 self-center">
                  <PencilLine className="h-3 w-3" />
                  Pilih slot baru untuk ubah jadwal
                </p>
              )}
            </div>
          )}

          {legendItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="font-medium">Ketersediaan dosen:</span>
              {legendItems.map((item) => (
                <div key={item.id} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm border"
                    style={{ backgroundColor: item.color + '33', borderColor: item.color }}
                  />
                  <span className="text-foreground">{toTitleCaseName(item.name)}</span>
                </div>
              ))}
              {current && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-600" />
                  <span className="text-foreground">Jadwal Sidang</span>
                </div>
              )}
            </div>
          )}

          <div className="seminar-calendar-wrapper rounded-xl border overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale={idLocale}
              firstDay={1}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay',
              }}
              height={520}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              nowIndicator
              allDaySlot={false}
              weekends={false}
              selectable={isEditable}
              selectMirror={isEditable}
              select={handleDateSelect}
              events={allEvents}
              eventClick={(info) => info.jsEvent.preventDefault()}
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              dayHeaderContent={(args) => {
                const day = args.date.toLocaleDateString('id-ID', { weekday: 'short' });
                return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
              }}
            />
          </div>

          {isEditable && (
            <p className="text-xs text-muted-foreground text-center">
              Klik dan seret pada kalender untuk memilih slot waktu sidang.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={pendingSchedule !== null && isEditable}
        onOpenChange={(open) => {
          if (!open) {
            setPendingSchedule(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-4 w-4 text-primary" />
              Atur Jadwal Sidang
            </DialogTitle>
          </DialogHeader>

          {pendingSchedule && (
            <div className="space-y-4 py-1">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sched-date" className="text-xs">Tanggal</Label>
                  <Input
                    id="sched-date"
                    type="date"
                    value={pendingSchedule.date}
                    onChange={(e) => {
                      setFormError(null);
                      setPendingSchedule((prev) => prev ? { ...prev, date: e.target.value } : prev);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sched-start" className="text-xs">Waktu Mulai</Label>
                  <Input
                    id="sched-start"
                    type="time"
                    value={pendingSchedule.startTime}
                    onChange={(e) => {
                      setFormError(null);
                      setPendingSchedule((prev) => prev ? { ...prev, startTime: e.target.value } : prev);
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sched-end" className="text-xs">Waktu Selesai</Label>
                  <Input
                    id="sched-end"
                    type="time"
                    value={pendingSchedule.endTime}
                    onChange={(e) => {
                      setFormError(null);
                      setPendingSchedule((prev) => prev ? { ...prev, endTime: e.target.value } : prev);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sched-is-online"
                    checked={pendingSchedule.isOnline}
                    onCheckedChange={(checked) => {
                      const nextOnline = checked === true;
                      setFormError(null);
                      setPendingSchedule((prev) => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          isOnline: nextOnline,
                          roomId: nextOnline ? null : (prev.roomId || rooms[0]?.id || null),
                          meetingLink: nextOnline ? prev.meetingLink : '',
                        };
                      });
                    }}
                  />
                  <Label htmlFor="sched-is-online" className="text-xs cursor-pointer">
                    Sidang daring (tanpa ruangan)
                  </Label>
                </div>

                {pendingSchedule.isOnline ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-meeting-link" className="text-xs">URL Meeting</Label>
                    <Input
                      id="sched-meeting-link"
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={pendingSchedule.meetingLink}
                      onChange={(e) => {
                        setFormError(null);
                        setPendingSchedule((prev) => prev ? { ...prev, meetingLink: e.target.value } : prev);
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="sched-room" className="text-xs">Ruangan</Label>
                    <Select
                      value={pendingSchedule.roomId || ''}
                      onValueChange={(val) => {
                        setFormError(null);
                        setPendingSchedule((prev) => prev ? { ...prev, roomId: val } : prev);
                      }}
                    >
                      <SelectTrigger id="sched-room">
                        <SelectValue placeholder="Pilih ruangan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {pendingSchedule.date && (pendingSchedule.isOnline || pendingSchedule.roomId) && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-sm space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Pratinjau</p>
                  <p className="font-medium text-foreground">{formatDateLong(pendingSchedule.date)}</p>
                  <p className="text-muted-foreground text-xs">
                    {pendingSchedule.startTime} – {pendingSchedule.endTime}&nbsp;·&nbsp;
                    {pendingSchedule.isOnline ? 'Sidang Daring' : selectedRoom?.name}
                  </p>
                  {pendingSchedule.isOnline && pendingSchedule.meetingLink.trim() && (
                    <p className="text-muted-foreground text-xs break-all">{pendingSchedule.meetingLink.trim()}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingSchedule(null);
                setFormError(null);
              }}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</>
              ) : (
                'Tetapkan Jadwal'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        .seminar-calendar-wrapper {
          --fc-border-color: var(--border);
          --fc-button-text-color: var(--foreground);
          --fc-button-bg-color: transparent;
          --fc-button-border-color: var(--border);
          --fc-button-hover-bg-color: var(--accent);
          --fc-button-hover-border-color: var(--border);
          --fc-button-active-bg-color: var(--primary);
          --fc-button-active-border-color: var(--primary);
          --fc-button-active-text-color: var(--primary-foreground);
          --fc-today-bg-color: var(--accent);
          --fc-page-bg-color: var(--background);
          --fc-neutral-bg-color: var(--secondary);
          --fc-now-indicator-color: var(--destructive);
          font-family: inherit;
        }

        .seminar-calendar-wrapper .fc-header-toolbar {
          padding: 1rem 1rem 0;
          margin-bottom: 0.75rem !important;
          gap: 0.5rem;
        }

        .seminar-calendar-wrapper .fc-toolbar-title {
          font-size: 1rem !important;
          font-weight: 600 !important;
          color: var(--foreground);
        }

        .seminar-calendar-wrapper .fc-button {
          height: 2.25rem;
          padding: 0 0.875rem !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          border-radius: var(--radius) !important;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-transform: none !important;
        }

        .seminar-calendar-wrapper .fc-button:hover {
          background-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
          border-color: var(--border) !important;
        }

        .seminar-calendar-wrapper .fc-button-active,
        .seminar-calendar-wrapper .fc-button-active:hover {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-color: var(--primary) !important;
        }

        .seminar-calendar-wrapper .fc-button:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
          z-index: 10;
        }

        .seminar-calendar-wrapper .fc-button-group .fc-button {
          border-radius: 0 !important;
        }
        .seminar-calendar-wrapper .fc-button-group .fc-button:first-child {
          border-top-left-radius: var(--radius) !important;
          border-bottom-left-radius: var(--radius) !important;
        }
        .seminar-calendar-wrapper .fc-button-group .fc-button:last-child {
          border-top-right-radius: var(--radius) !important;
          border-bottom-right-radius: var(--radius) !important;
        }

        .seminar-calendar-wrapper .fc-col-header-cell {
          background-color: var(--muted);
          padding: 0.375rem 0 !important;
        }
        .seminar-calendar-wrapper .fc-col-header-cell-cushion {
          color: var(--muted-foreground);
          font-weight: 500;
          font-size: 0.8125rem;
          letter-spacing: 0.01em;
        }

        .seminar-calendar-wrapper .fc-day-today {
          background-color: var(--accent) !important;
        }
        .seminar-calendar-wrapper .fc-day-today .fc-col-header-cell-cushion {
          color: var(--primary);
          font-weight: 600;
        }

        .seminar-calendar-wrapper .fc-timegrid-slot-label-cushion {
          font-size: 0.75rem;
          color: var(--muted-foreground);
        }

        .seminar-calendar-wrapper .fc-event.availability-event {
          pointer-events: none !important;
          cursor: default;
        }
        .seminar-calendar-wrapper .fc-event {
          border-radius: 5px !important;
          padding: 1px 4px !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          cursor: default;
        }
        .seminar-calendar-wrapper .schedule-event {
          font-weight: 600 !important;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.15);
        }

        .seminar-calendar-wrapper .fc-highlight {
          background-color: var(--primary) !important;
          opacity: 0.15;
        }
        .seminar-calendar-wrapper .fc-event-mirror {
          background-color: var(--primary) !important;
          border-color: var(--primary) !important;
          opacity: 0.8;
        }

        .seminar-calendar-wrapper .fc-timegrid-now-indicator-line {
          border-color: var(--destructive) !important;
          border-width: 2px !important;
        }
        .seminar-calendar-wrapper .fc-timegrid-now-indicator-arrow {
          border-top-color: var(--destructive) !important;
          border-bottom-color: var(--destructive) !important;
        }

        .seminar-calendar-wrapper .fc-scroller::-webkit-scrollbar { width: 5px; }
        .seminar-calendar-wrapper .fc-scroller::-webkit-scrollbar-track { background: transparent; }
        .seminar-calendar-wrapper .fc-scroller::-webkit-scrollbar-thumb {
          background-color: var(--border);
          border-radius: 3px;
        }
      `}</style>
    </>
  );
}
