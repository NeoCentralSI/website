import { useState, useMemo, useEffect } from 'react';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Spinner, Loading } from '@/components/ui/spinner';
import { Calendar, CheckCircle2, MapPin, Clock, CalendarDays, AlertCircle, Sparkles, Lock, Ban, Video, Copy, FileText } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useAdminThesisSeminarSchedulingData, useSetAdminThesisSeminarSchedule, useFinalizeAdminThesisSeminarSchedule, useAdminThesisSeminarDetail, useDownloadInvitationLetter } from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import type { DayOfWeek } from '@/types/seminar.types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Format a Date to YYYY-MM-DD using LOCAL date (avoids UTC shift in +7 timezone) */
function toLocalDateStr(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

/** Get Monday of the week that contains `date`, in local time */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun,1=Mon,...
  const diff = day === 0 ? -6 : 1 - day; // days to subtract to reach Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** Parse ISO time string (1970-01-01T07:00:00Z) or HH:MM → HH:MM */
function extractTime(s: string): string {
  if (!s) return '--:--';
  if (s.includes('T')) {
    const d = new Date(s);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  }
  return s.slice(0, 5);
}

/** Format a YYYY-MM-DD or ISO date to "Senin, 2 Maret 2026" */
function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  // Use UTC components to avoid date-shift from local timezone
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  return utc.toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

/** Format ISO to "2 Mar 2026, 14:30" */
function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

// Matches CalendarDashboard's getEventColor palette
const LECTURER_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  seminarId: string;
  /** Allow selecting a new slot (examiner_assigned or already scheduled) */
  isEditable: boolean;
}

interface PendingSchedule {
  date: string;      // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  roomId: string | null;
  isOnline: boolean;
  meetingLink: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AdminThesisSeminarSchedulingSection({ seminarId, isEditable }: Props) {
  const { data: schedulingData, isLoading } = useAdminThesisSeminarSchedulingData(seminarId);
  const { data: seminarDetail } = useAdminThesisSeminarDetail(seminarId);
  const { mutate: doSetSchedule, isPending: isSaving } = useSetAdminThesisSeminarSchedule();
  const { mutate: doFinalizeSchedule, isPending: isFinalizing } = useFinalizeAdminThesisSeminarSchedule();
  const { mutate: doDownloadInvitation, isPending: isDownloadingInvitation } = useDownloadInvitationLetter();

  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState<boolean>(false);
  const [inputNomorSurat, setInputNomorSurat] = useState<string>('');

  const handleDownloadInvitation = () => {
    if (seminarDetail?.invitationLetterNo) {
      setInputNomorSurat(seminarDetail.invitationLetterNo);
    }
    setIsInvitationDialogOpen(true);
  };

  const confirmDownloadInvitation = () => {
    doDownloadInvitation({ seminarId, nomorSurat: inputNomorSurat });
    setIsInvitationDialogOpen(false);
  };

  const [pendingSchedule, setPendingSchedule] = useState<PendingSchedule | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState<boolean>(false);

  // Sync selectedRoomId with current schedule when data loads
  useEffect(() => {
    if (schedulingData?.currentSchedule?.room?.id) {
      setSelectedRoomId(schedulingData.currentSchedule.room.id);
    }
  }, [schedulingData]);


  // ── Stable color assignment per lecturer ──────────────────────────────────
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

  // ── Expand recurring weekly availability into FC events (8-week window) ───
  const availabilityEvents = useMemo((): EventInput[] => {
    if (!schedulingData) return [];
    const events: EventInput[] = [];
    // Anchor to Monday of the current local week — avoids the UTC-offset day-shift bug
    const weekMonday = getMondayOfWeek(new Date());
    // dayIdx offset from Monday: monday=0, tuesday=1, ..., friday=4
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

  const effectiveRoomId = selectedRoomId || schedulingData?.currentSchedule?.room?.id || schedulingData?.rooms[0]?.id;

  const blockedEvents = useMemo((): EventInput[] => {
    if (!schedulingData?.roomBookings || !effectiveRoomId) return [];
    const isDraft = seminarDetail?.status === 'examiner_assigned';
    return schedulingData.roomBookings
      .filter((b: any) => b.roomId === effectiveRoomId)
      .map((b: any) => {
        const dateStr = b.date.slice(0, 10);
        const isCurrentSeminar = b.id === `seminar-${seminarId}`;
        
        // Draft color (green) vs Finalized color (sky blue)
        const activeBgColor = isDraft ? '#16a34a' : '#0ea5e9';
        const activeBorderColor = isDraft ? '#15803d' : '#0284c7';

        return {
          id: `blocked-${b.id}`,
          title: `🔒 ${b.title}`,
          start: `${dateStr}T${extractTime(b.startTime)}:00`,
          end: `${dateStr}T${extractTime(b.endTime)}:00`,
          backgroundColor: isCurrentSeminar ? activeBgColor : '#ef4444',
          borderColor: isCurrentSeminar ? activeBorderColor : '#dc2626',
          textColor: '#ffffff',
          display: 'block',
          classNames: ['blocked-event'],
          extendedProps: { type: 'blocked', ...b },
        };
      });
  }, [schedulingData, effectiveRoomId, seminarId, seminarDetail?.status]);

  // ── Already-scheduled seminar event (green) ───────────────────────────────
  const scheduleEvent = useMemo((): EventInput[] => {
    const cs = schedulingData?.currentSchedule;
    if (!cs?.date || !cs.startTime || !cs.endTime) return [];
    
    // Only show the green 'Draft' card if it's still in examiner_assigned status
    // Once finalized, it will be shown as a blue 'Locked' card via blockedEvents
    if (seminarDetail?.status !== 'examiner_assigned') return [];
    
    const dateStr = cs.date.slice(0, 10);

    const scheduleTitle = cs.isOnline
      ? '📌 Seminar Daring'
      : `📌 Seminar${cs.room ? ` · ${cs.room.name}` : ''}`;
    return [{
      id: 'seminar-schedule',
      title: scheduleTitle,
      start: `${dateStr}T${extractTime(cs.startTime)}:00`,
      end: `${dateStr}T${extractTime(cs.endTime)}:00`,
      backgroundColor: '#16a34a',
      borderColor: '#15803d',
      textColor: '#ffffff',
      classNames: ['schedule-event'],
      extendedProps: { type: 'schedule' },
    }];
  }, [schedulingData, seminarDetail]);

  const allEvents = useMemo(
    () => [...availabilityEvents, ...scheduleEvent, ...blockedEvents],
    [availabilityEvents, scheduleEvent, blockedEvents]
  );

  const recommendations = useMemo(() => {
    if (!schedulingData) return [];
    const participantIds = schedulingData.participantIds || [];
    if (!participantIds.length || !effectiveRoomId) return [];
    if (!schedulingData.lecturerAvailabilities) return [];

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    interface TimeSlot {
      start: number; // minutes from midnight
      end: number;
    }

    const recommendationsList: Array<{
      date: string;
      startTime: string;
      endTime: string;
      roomId: string;
    }> = [];

    daysOfWeek.forEach((dayName) => {
      const availByLecturer: Record<string, TimeSlot[]> = {};
      participantIds.forEach((lId: string) => {
        const avails = schedulingData.lecturerAvailabilities.filter(
          (a: any) => a.lecturerId === lId && a.day === dayName
        );
        availByLecturer[lId] = avails.map((a: any) => {
          const s = extractTime(a.startTime);
          const e = extractTime(a.endTime);
          if (s === '--:--' || e === '--:--') return { start: 0, end: 0 };
          const [sH, sM] = s.split(':').map(Number);
          const [eH, eM] = e.split(':').map(Number);
          return { start: sH * 60 + sM, end: eH * 60 + eM };
        }).filter(slot => slot.start < slot.end);
      });

      if (participantIds.some((lId: string) => availByLecturer[lId].length === 0)) return;

      let commonSlots = availByLecturer[participantIds[0]];

      for (let i = 1; i < participantIds.length; i++) {
        const nextSlots = availByLecturer[participantIds[i]];
        const newCommon: TimeSlot[] = [];

        commonSlots.forEach((c) => {
          nextSlots.forEach((n) => {
            const start = Math.max(c.start, n.start);
            const end = Math.min(c.end, n.end);
            if (start < end) {
              newCommon.push({ start, end });
            }
          });
        });
        commonSlots = newCommon;
      }

      const twoHourSlots: TimeSlot[] = [];
      commonSlots.forEach((slot) => {
        let currentStart = slot.start;
        while (currentStart + 120 <= slot.end) {
          twoHourSlots.push({ start: currentStart, end: currentStart + 120 });
          currentStart += 60;
        }
      });

      if (twoHourSlots.length === 0) return;

      const dayIndexMap: Record<string, number> = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
      };
      const targetDay = dayIndexMap[dayName];

      // Use local-date arithmetic to avoid the UTC midnight-rollover bug
      // that causes off-by-one day errors when running after 17:00 WIB (+7).
      const now = new Date();
      const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      for (let d = 0; d < 30; d++) {
        const testDate = new Date(todayLocal);
        testDate.setDate(todayLocal.getDate() + d);
        if (testDate.getDay() === targetDay) {
          const dateStr = toLocalDateStr(testDate);

          twoHourSlots.forEach((timeSlot) => {
            const sH = Math.floor(timeSlot.start / 60);
            const sM = timeSlot.start % 60;
            const eH = Math.floor(timeSlot.end / 60);
            const eM = timeSlot.end % 60;

            const startTimeStr = `${String(sH).padStart(2, '0')}:${String(sM).padStart(2, '0')}`;
            const endTimeStr = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}`;

            const hasConflict = (schedulingData.roomBookings || []).some((b: any) => {
              if (b.roomId !== effectiveRoomId) return false;
              if (b.date.slice(0, 10) !== dateStr) return false;

              const [bSH, bSM] = extractTime(b.startTime).split(':').map(Number);
              const [bEH, bEM] = extractTime(b.endTime).split(':').map(Number);
              const bStart = bSH * 60 + bSM;
              const bEnd = bEH * 60 + bEM;

              return timeSlot.start < bEnd && timeSlot.end > bStart;
            });

            if (!hasConflict) {
              recommendationsList.push({
                date: dateStr,
                startTime: startTimeStr,
                endTime: endTimeStr,
                roomId: effectiveRoomId,
              });
            }
          });
        }
      }
    });

    // Clamp recommendations to 06:00-18:00 window
    const clampedList = recommendationsList.filter((r) => {
      const [sH] = r.startTime.split(':').map(Number);
      const [eH, eM] = r.endTime.split(':').map(Number);
      return sH >= 6 && (eH < 18 || (eH === 18 && eM === 0));
    });

    return clampedList.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [schedulingData, effectiveRoomId]);

  const roomConflicts = useMemo(() => {
    if (!schedulingData || !effectiveRoomId) return [];
    const bookings = [...(schedulingData.roomBookings || [])];
    
    // If there's a current draft schedule that isn't in roomBookings yet, add it
    const cs = schedulingData.currentSchedule;
    if (cs?.date && cs.startTime && cs.endTime && cs.room?.id === effectiveRoomId) {
      const exists = bookings.some(b => b.id === `seminar-${seminarId}`);
      if (!exists && seminarDetail?.status === 'examiner_assigned') {
        bookings.push({
          id: `seminar-${seminarId}`,
          title: `${seminarDetail.student?.name || 'Seminar'}`,
          date: cs.date,
          startTime: cs.startTime,
          endTime: cs.endTime,
          roomId: cs.room?.id || '',
          isOnline: cs.isOnline
        });
      }
    }

    return bookings.filter((b: any) => b.roomId === effectiveRoomId);
  }, [schedulingData, effectiveRoomId, seminarId, seminarDetail]);

  const handleSelectAllow = (selectInfo: any) => {
    if (!schedulingData?.roomBookings || !effectiveRoomId) return true;
    const start = selectInfo.start.getTime();
    const end = selectInfo.end.getTime();

    const activeRoomBookings = schedulingData.roomBookings.filter(
      (b: any) => b.roomId === effectiveRoomId
    );

    const hasOverlap = activeRoomBookings.some((b: any) => {
      const bDate = b.date.slice(0, 10);
      const bStart = new Date(`${bDate}T${extractTime(b.startTime)}:00`).getTime();
      const bEnd = new Date(`${bDate}T${extractTime(b.endTime)}:00`).getTime();
      return start < bEnd && end > bStart;
    });

    return !hasOverlap;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDateSelect = (info: DateSelectArg) => {
    if (!isEditable) return;
    setFormError(null);
    setPendingSchedule({
      date: info.startStr.slice(0, 10),
      startTime: info.startStr.slice(11, 16) || '08:00',
      endTime: info.endStr?.slice(11, 16) || '10:00',
      roomId: selectedRoomId || schedulingData?.rooms[0]?.id || null,
      isOnline: false,
      meetingLink: '',
    });
  };

  /** Validate form fields; returns error message or null */
  const validateForm = (s: PendingSchedule): string | null => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Use local date parsing to avoid UTC offset causing wrong weekday
    const [yr, mo, dy] = s.date.split('-').map(Number);
    const selected = new Date(yr, mo - 1, dy);
    if (selected < today) return 'Tanggal tidak boleh berada di masa lalu.';
    const dayOfWeek = selected.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'Seminar hanya dapat dijadwalkan pada hari kerja (Senin – Jumat).';
    if (s.startTime >= s.endTime) return 'Waktu mulai harus sebelum waktu selesai.';
    const [startH, startM] = s.startTime.split(':').map(Number);
    const [endH, endM] = s.endTime.split(':').map(Number);
    if (startH < 6) return 'Waktu mulai tidak boleh sebelum pukul 06.00.';
    if (endH > 18 || (endH === 18 && endM > 0)) return 'Waktu selesai tidak boleh setelah pukul 18.00.';
    if (s.isOnline) {
      if (!s.meetingLink.trim()) return 'URL meeting wajib diisi untuk seminar daring.';
      try {
        new URL(s.meetingLink);
      } catch {
        return 'URL meeting tidak valid.';
      }
      return null;
    }
    if (!s.roomId) return 'Ruangan harus dipilih.';

    // Room conflict check (client-side)
    if (schedulingData?.roomBookings) {
      const dateStr = s.date;
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      const conflict = schedulingData.roomBookings.find((b: any) => {
        if (b.roomId !== s.roomId) return false;
        if (b.date.slice(0, 10) !== dateStr) return false;
        
        // Skip comparing against itself (if editing existing draft)
        if (b.id === `seminar-${seminarId}`) return false;

        const [bSH, bSM] = extractTime(b.startTime).split(':').map(Number);
        const [bEH, bEM] = extractTime(b.endTime).split(':').map(Number);
        const bStart = bSH * 60 + bSM;
        const bEnd = bEH * 60 + bEM;

        return startMins < bEnd && endMins > bStart;
      });

      if (conflict) return `Ruangan sudah digunakan untuk: ${conflict.title}.`;
    }

    return null;
  };

  const handleSave = () => {
    if (!pendingSchedule) return;
    const err = validateForm(pendingSchedule);
    if (err) { setFormError(err); return; }
    setFormError(null);
    doSetSchedule(
      {
        seminarId,
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
          toast.success('Jadwal seminar berhasil ditetapkan.');
          setPendingSchedule(null);
        },
        onError: (err) => {
          setFormError(err.message || 'Gagal menyimpan jadwal.');
        },
      }
    );
  };



  const supervisors = [...((seminarDetail as any)?.supervisors || [])].sort((a, b) => (a.role || '').localeCompare(b.role || ''));
  const examiners = seminarDetail?.examiners || [];
  const canEditSchedule = isEditable && !['scheduled', 'ongoing', 'passed', 'passed_with_revision', 'failed', 'cancelled'].includes(seminarDetail?.status as string);

  // Unique lecturers for the legend
  // Unique lecturers for the legend, ordered by role (Pembimbing 1, Pembimbing 2, then Examiners)
  const legendItems = useMemo(() => {
    if (!schedulingData) return [];
    
    const lecturerIds = [...new Set(schedulingData.lecturerAvailabilities.map((a) => a.lecturerId))];
    
    return lecturerIds
      .map((id) => {
        const avail = schedulingData.lecturerAvailabilities.find((a) => a.lecturerId === id);
        // Find role from supervisors or examiners
        const supervisor = supervisors.find((s: any) => s.id === id || s.lecturerId === id);
        const examiner = examiners.find((e: any) => e.lecturerId === id);
        
        let sortOrder = 99;
        if (supervisor) {
          sortOrder = supervisor.role === 'pembimbing_1' ? 1 : 2;
        } else if (examiner) {
          sortOrder = 10 + (examiner.order || 0);
        }

        return {
          id,
          name: avail?.lecturerName || '-',
          color: lecturerColorMap[id] || '#94a3b8',
          sortOrder
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [schedulingData, supervisors, examiners, lecturerColorMap]);

  const handleCopyMessage = () => {
    const studentName = toTitleCaseName(seminarDetail?.student?.name) || '-';
    const studentNim = seminarDetail?.student?.nim || '-';
    const title = seminarDetail?.thesis?.title || '-';

    const formattedSupervisors = supervisors.map((s: any) => `• ${toTitleCaseName(s.name)} ${s.role ? `(${formatRoleName(s.role)})` : ''}`).join('\n');
    const formattedExaminers = examiners.map((e: any) => `• ${toTitleCaseName(e.lecturerName || e.lecturer?.name || '-')}`).join('\n');

    const schedDate = current?.date ? formatDateLong(current.date) : '-';
    const schedTime = current?.startTime && current?.endTime ? `${extractTime(current.startTime)} - ${extractTime(current.endTime)}` : '-';
    const place = current?.isOnline ? `Daring: ${current.meetingLink || 'Tautan belum diatur'}` : `Luring: ${current?.room?.name || 'Ruangan belum diatur'}`;

    const recsText = recommendations.length > 0
      ? recommendations.map((r, idx) => `   ${idx + 1}. ${formatDateLong(r.date)} (${r.startTime} - ${r.endTime})`).join('\n')
      : '   (Tidak ada rekomendasi alternatif)';

    const message = `Berikut ini adalah informasi dan jadwal Seminar Hasil Tugas Akhir yang akan ditetapkan:
• Mahasiswa: ${studentName} (${studentNim})
• Judul TA: ${title}
• Dosen Pembimbing:
${formattedSupervisors}
• Dosen Penguji:
${formattedExaminers}
• Waktu: ${schedDate}, ${schedTime}
• Ruangan: ${place}

Berikut ini adalah beberapa jadwal rekomendasi tambahan jika tidak bisa mengikuti jadwal di atas:
${recsText}

Mohon konfirmasinya untuk mensegerakan kelangsungan Seminar Hasil Tugas Akhir mahasiswa kita tersebut.`;

    navigator.clipboard.writeText(message);
    toast.success('Pesan jadwal seminar berhasil disalin.');
  };

  // ── Loading/Error states (Must be AFTER all hooks) ─────────────────────────
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Penjadwalan Seminar Hasil (Admin)
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        .fc-timegrid-event-harness:has(.blocked-event) {
          left: 0px !important;
          right: 0px !important;
          width: 100% !important;
          z-index: 50 !important;
        }
        .blocked-event {
          opacity: 1 !important;
          border-radius: 6px !important;
        }
        .blocked-event .fc-event-main {
          font-weight: 700 !important;
          font-size: 11px !important;
          padding: 6px !important;
        }
      `}} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Calendar card */}
        <div className="lg:col-span-2 flex flex-col">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3 shrink-0">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Penjadwalan Seminar Hasil
                </CardTitle>
                <div className="flex items-center gap-3">
                  {seminarDetail?.status === 'examiner_assigned' && current?.date && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs shrink-0 px-2.5 py-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/80 mt-0.5" />
                      Draft Jadwal Tersimpan
                    </Badge>
                  )}
                  {['scheduled', 'ongoing', 'passed', 'passed_with_revision', 'failed', 'cancelled'].includes(seminarDetail?.status as string) && (
                    <div className="flex items-center gap-1.5">
                      <Badge variant="success" className="flex items-center gap-1 text-xs shrink-0 px-2.5 py-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terjadwal
                      </Badge>
                      {seminarDetail?.scheduledAt && (
                        <div className="flex flex-col items-end mr-1">
                          <span className="text-[10px] text-muted-foreground leading-none">Dijadwalkan pada:</span>
                          <span className="text-[10px] font-medium text-foreground">{formatDateTime(seminarDetail.scheduledAt)}</span>
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="outline"
                        disabled={isDownloadingInvitation}
                        onClick={handleDownloadInvitation}
                        className="h-8 w-8 shadow-sm border-border/80 hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Unduh Surat Undangan"
                      >
                        {isDownloadingInvitation ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-4 w-4" />}
                      </Button>
                    </div>
                  )}
                  {seminarDetail?.status === 'examiner_assigned' && current?.date && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        disabled={isFinalizing}
                        onClick={() => setShowFinalizeConfirm(true)}
                        className="h-8 w-8 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                        title="Tetapkan Jadwal"
                      >
                        {isFinalizing ? <Spinner className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>

                      <Button
                        size="icon"
                        variant="outline"
                        onClick={handleCopyMessage}
                        className="h-8 w-8 shadow-sm border-border/80 hover:bg-accent text-muted-foreground hover:text-foreground"
                        title="Salin Pesan Jadwal"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {schedulingData?.rooms?.length > 0 && (
                    <Select
                      value={selectedRoomId || schedulingData?.currentSchedule?.room?.id || schedulingData.rooms[0]?.id}
                      onValueChange={(val) => setSelectedRoomId(val)}
                      disabled={['scheduled', 'ongoing', 'passed', 'passed_with_revision', 'failed', 'cancelled'].includes(seminarDetail?.status as string)}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs bg-background">
                        <SelectValue placeholder="Pilih ruangan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {schedulingData.rooms.map((r: any) => (
                          <SelectItem key={r.id} value={r.id} className="text-xs">
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 justify-between space-y-4">
              {/* Legend Items mapped on top */}
              {legendItems.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pb-2 border-b">
                  <span className="font-medium">Ketersediaan dosen:</span>
                  {legendItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm border"
                        style={{ backgroundColor: item.color + '33', borderColor: item.color }}
                      />
                      <span className="text-foreground font-medium">{toTitleCaseName(item.name)}</span>
                    </div>
                  ))}
                  {current && (
                    <div className="flex items-center gap-3 ml-2 pl-3 border-l">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#16a34a]" />
                        <span className="text-foreground font-medium">Draft Jadwal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#0ea5e9]" />
                        <span className="text-foreground font-medium">Jadwal Final</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="seminar-calendar-wrapper rounded-xl border overflow-hidden flex-1 flex flex-col min-h-[520px]">
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
                  height="100%"
                  slotMinTime="06:00:00"
                  slotMaxTime="18:00:00"
                  selectConstraint={{ startTime: '06:00', endTime: '18:00', dows: [1, 2, 3, 4, 5] }}
                  nowIndicator
                  allDaySlot={false}
                  weekends={false}
                  selectable={canEditSchedule}
                  selectMirror={canEditSchedule}
                  select={handleDateSelect}
                  events={allEvents}
                  selectAllow={handleSelectAllow}
                  eventClick={(info) => info.jsEvent.preventDefault()}
                  slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                  eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                  dayHeaderContent={(args) => {
                    const day = args.date.toLocaleDateString('id-ID', { weekday: 'short' });
                    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                  }}
                />
              </div>
              {canEditSchedule && (
                <p className="text-xs text-muted-foreground text-center shrink-0">
                  Klik dan seret pada kalender untuk memilih slot waktu seminar.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recommendations & Blocked Slots */}
        <div className="lg:col-span-1 flex flex-col gap-4 min-h-full">
          {/* 1. Rekomendasi Jadwal */}
          <Card className="flex flex-col flex-1 shadow-sm min-h-0">
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Rekomendasi Jadwal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-start min-h-0 overflow-y-auto space-y-2 text-xs">
              {recommendations.length > 0 ? (
                <div className="flex flex-col gap-2 w-full">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (!canEditSchedule) return;
                        setFormError(null);
                        setPendingSchedule({
                          date: rec.date,
                          startTime: rec.startTime,
                          endTime: rec.endTime,
                          roomId: rec.roomId,
                          isOnline: false,
                          meetingLink: '',
                        });
                      }}
                      className={`p-2.5 rounded-lg border-2 bg-card transition-all flex flex-col gap-1 text-left ${canEditSchedule
                        ? 'hover:bg-accent/50 cursor-pointer border-primary/20 hover:border-primary/40'
                        : 'opacity-60 border-border/50 cursor-not-allowed'
                        }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-primary text-[13px]">
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary/80" />
                        <span>Rekomendasi Jadwal #{idx + 1}</span>
                      </div>
                      <div className="flex flex-col text-muted-foreground text-[11px] pl-5 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span>{formatDateLong(rec.date)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground/70" />
                          <span>{rec.startTime} - {rec.endTime}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 my-auto w-full">
                  <AlertCircle className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-foreground">Tidak Ada Rekomendasi</p>
                  <p className="text-[11px] max-w-[200px] mx-auto">
                    Tidak ditemukan slot waktu 2 jam yang sesuai untuk seluruh peserta seminar.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 2. Slot Terblokir */}
          <Card className="flex flex-col flex-1 shadow-sm min-h-0">
            <CardHeader className="pb-3 border-b shrink-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                Slot Terblokir
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col justify-start min-h-0 overflow-y-auto space-y-2 text-xs">
              {roomConflicts.length > 0 ? (
                <div className="flex flex-col gap-2 w-full">
                  {roomConflicts.map((c: any) => {
                    const isCurrent = c.id === `seminar-${seminarId}`;
                    const isDraft = seminarDetail?.status === 'examiner_assigned';
                    
                    let bgClass = 'bg-destructive/5 border-destructive/20 text-destructive';
                    let textClass = 'text-destructive';
                    let iconClass = 'text-destructive';
                    
                    if (isCurrent) {
                      if (isDraft) {
                        bgClass = 'bg-green-500/10 border-green-500/30 dark:text-green-100 backdrop-blur-sm';
                        textClass = 'text-green-600 dark:text-green-400';
                        iconClass = 'text-green-600 dark:text-green-400';
                      } else {
                        bgClass = 'bg-sky-500/10 border-sky-500/30 dark:text-sky-100 backdrop-blur-sm';
                        textClass = 'text-sky-600 dark:text-sky-400';
                        iconClass = 'text-sky-600 dark:text-sky-400';
                      }
                    }

                    return (
                      <div
                        key={c.id}
                        className={`p-2.5 rounded-lg border flex flex-col gap-1 text-left ${bgClass}`}
                      >
                        <div className={`flex items-center gap-1.5 font-semibold text-[13px] ${textClass}`}>
                          {isCurrent ? <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${iconClass}`} /> : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
                          <span className="truncate">{c.title}</span>
                        </div>
                        <div className="flex flex-col text-muted-foreground text-[11px] pl-5 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{formatDateLong(c.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{extractTime(c.startTime)} - {extractTime(c.endTime)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground space-y-2 my-auto w-full">
                  <Ban className="h-6 w-6 text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-foreground">Tidak Ada Slot Terblokir</p>
                  <p className="text-[11px] max-w-[200px] mx-auto">
                    Seluruh waktu ketersediaan terpilih saat ini berstatus aman dari konflik.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Finalize confirmation modal ── */}
      <Dialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              Jadwalkan Seminar Hasil Secara Resmi
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 text-xs sm:text-sm text-muted-foreground">
            <p>Anda akan menjadwalkan Seminar Hasil TA berikut:</p>

            <div className="space-y-3 bg-muted/40 rounded-lg border p-4 font-medium text-foreground">
              <div>
                <span className="text-xs text-muted-foreground block font-normal">Mahasiswa</span>
                <span className="block mt-0.5 text-xs sm:text-sm font-semibold">
                  {toTitleCaseName(seminarDetail?.student?.name)} ({seminarDetail?.student?.nim})
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block font-normal">Judul TA</span>
                <span className="block mt-0.5 text-xs sm:text-sm leading-snug font-medium">{seminarDetail?.thesis?.title || '-'}</span>
              </div>

              {supervisors.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block font-normal">Dosen Pembimbing</span>
                  <div className="space-y-0.5 mt-0.5">
                    {supervisors.map((s: any, idx: number) => (
                      <span key={idx} className="block text-xs font-medium">
                        • {toTitleCaseName(s.name)} {s.role ? `(${formatRoleName(s.role)})` : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {examiners.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block font-normal">Dosen Penguji</span>
                  <div className="space-y-0.5 mt-0.5">
                    {examiners.map((e: any, idx: number) => (
                      <span key={idx} className="block text-xs font-medium">
                        • {toTitleCaseName(e.lecturerName || e.lecturer?.name || '-')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {current && (
                <div className="border-t pt-3 mt-2 space-y-1.5">
                  <span className="text-xs text-muted-foreground block font-normal">Informasi Jadwal</span>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{formatDateLong(current.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{extractTime(current.startTime || '')} - {extractTime(current.endTime || '')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {current.isOnline ? (
                      <>
                        <Video className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate text-blue-600 underline max-w-[300px]">{current.meetingLink || 'Tautan belum diatur'}</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{current.room?.name || 'Ruangan belum diatur'}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setShowFinalizeConfirm(false)} disabled={isFinalizing} className="px-4">
              Batal
            </Button>
            <Button
              disabled={isFinalizing}
              onClick={() => {
                doFinalizeSchedule(seminarId, {
                  onSuccess: () => {
                    toast.success('Jadwal seminar berhasil ditetapkan.');
                    setShowFinalizeConfirm(false);
                  },
                  onError: () => toast.error('Gagal menetapkan jadwal seminar.'),
                });
              }}
              className="px-4 font-semibold"
            >
              {isFinalizing ? <Spinner className="h-4 w-4 animate-spin mr-2" /> : null}
              Jadwalkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Download Invitation Modal ── */}
      <Dialog open={isInvitationDialogOpen} onOpenChange={setIsInvitationDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Unduh Surat Undangan
            </DialogTitle>
            <DialogDescription>
              Masukkan nomor surat untuk disertakan dalam dokumen PDF undangan.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nomorSurat">Nomor Surat (Opsional)</Label>
              <Input
                id="nomorSurat"
                placeholder="Contoh: 0123/UN16.15/TA/2026"
                value={inputNomorSurat}
                onChange={(e) => setInputNomorSurat(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInvitationDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={confirmDownloadInvitation} disabled={isDownloadingInvitation}>
              {isDownloadingInvitation ? (
                <Spinner className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              Unduh PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Schedule form modal ── */}
      <Dialog
        open={pendingSchedule !== null && isEditable}
        onOpenChange={(open) => { if (!open) { setPendingSchedule(null); setFormError(null); } }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Atur Jadwal Seminar
            </DialogTitle>
          </DialogHeader>

          {pendingSchedule && (
            <div className="space-y-4 py-1">
              {/* Validation error */}
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Date / time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sched-date" className="text-xs">Tanggal</Label>
                  <DatePicker
                    value={pendingSchedule.date ? new Date(pendingSchedule.date) : undefined}
                    onChange={(date) => {
                      setFormError(null);
                      setPendingSchedule((prev) => prev ? { ...prev, date: date ? toLocalDateStr(date) : '' } : prev);
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

              {/* Room select */}
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
                    Seminar daring (tanpa ruangan)
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
                        {rooms.map((r: any) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Preview summary */}
              {pendingSchedule.date && (pendingSchedule.isOnline || pendingSchedule.roomId) && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-sm space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">Pratinjau</p>
                  <p className="font-medium text-foreground">{formatDateLong(pendingSchedule.date)}</p>
                  <p className="text-muted-foreground text-xs">
                    {pendingSchedule.startTime} – {pendingSchedule.endTime}&nbsp;·&nbsp;
                    {pendingSchedule.isOnline ? 'Seminar Daring' : selectedRoom?.name}
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
              onClick={() => { setPendingSchedule(null); setFormError(null); }}
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
