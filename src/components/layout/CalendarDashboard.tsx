import { useState, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { getMyCalendarEventsAPI } from '@/services/calendar.service';
import type { CalendarEvent } from '@/types/calendar.types';
import { useRole } from '@/hooks/shared';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { EventClickArg, DateSelectArg, EventInput } from '@fullcalendar/core';
import idLocale from '@fullcalendar/core/locales/id';

interface CalendarDashboardProps {
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  compact?: boolean;
}

export function CalendarDashboard({ onEventClick, onCreateEvent }: CalendarDashboardProps) {
  const [filterType, setFilterType] = useState<string>('all');
  const calendarRef = useRef<FullCalendar>(null);
  
  const { getRoleNames } = useRole();
  const role = getRoleNames()[0] as 'student' | 'lecturer' | 'admin' | undefined;

  // Get calendar events with dynamic date range
  const { data, error, isLoading } = useQuery({
    queryKey: ['calendar-events', filterType],
    queryFn: async () => {
      try {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        
        console.log('[Calendar Dashboard] ===== FETCHING CALENDAR EVENTS =====');
        console.log('[Calendar Dashboard] Role:', role);
        console.log('[Calendar Dashboard] Filter type:', filterType);
        console.log('[Calendar Dashboard] Start date:', startDate.toISOString());
        console.log('[Calendar Dashboard] End date:', endDate.toISOString());
        
        const result = await getMyCalendarEventsAPI({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          types: filterType !== 'all' ? [filterType] : undefined,
        });
        
        console.log('[Calendar Dashboard] API Response:', result);
        console.log('[Calendar Dashboard] Events count:', result?.events?.length || 0);
        console.log('[Calendar Dashboard] Events:', result?.events);
        
        return result;
      } catch (err) {
        console.error('[Calendar Dashboard] Error fetching events:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
  });
  
  if (error) {
    console.error('[Calendar Dashboard] Query error:', error);
  }
  
  console.log('[Calendar Dashboard] isLoading:', isLoading);
  console.log('[Calendar Dashboard] data:', data);

  const events = data?.events || [];
  console.log('[Calendar Dashboard] Processed events:', events.length);

  // Get event color based on type
  const getEventColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      // Student events
      guidance_scheduled: '#3b82f6',      // blue-500 - accepted
      guidance_request: '#f59e0b',        // amber-500 - pending
      guidance_rejected: '#ef4444',       // red-500 - rejected
      thesis_deadline: '#dc2626',         // red-600
      seminar_scheduled: '#8b5cf6',       // purple-500
      defense_scheduled: '#f97316',       // orange-500
      submission_deadline: '#ec4899',     // pink-500
      
      // Lecturer events
      student_guidance: '#14b8a6',        // teal-500 - accepted guidance
      seminar_as_examiner: '#6366f1',     // indigo-500
      defense_as_examiner: '#ea580c',     // orange-600
      
      // Admin events
      academic_year_start: '#84cc16',     // lime-500
      academic_year_end: '#eab308',       // yellow-500
      registration_period: '#a855f7',     // purple-500
      
      // Common events
      meeting: '#64748b',                 // slate-500
      holiday: '#dc2626',                 // red-600
      announcement: '#059669',            // emerald-600
    };

    return colorMap[type] || '#6b7280'; // gray-500 default
  };

  // Convert events to FullCalendar format
  const fullCalendarEvents: EventInput[] = useMemo(() => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startDate,
      end: event.endDate,
      backgroundColor: getEventColor(event.type),
      borderColor: getEventColor(event.type),
      extendedProps: {
        ...event,
      },
      classNames: ['cursor-pointer'],
    }));
  }, [events]);

  // Get event type options based on role
  const getEventTypeOptions = () => {
    if (!role) return [{ value: 'all', label: 'Semua Event' }];

    const commonOptions = [
      { value: 'all', label: 'Semua Event' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'holiday', label: 'Libur' },
    ];

    const roleOptions = {
      student: [
        { value: 'guidance_scheduled', label: 'Bimbingan Diterima' },
        { value: 'guidance_request', label: 'Bimbingan Menunggu' },
        { value: 'guidance_rejected', label: 'Bimbingan Ditolak' },
        { value: 'thesis_deadline', label: 'Deadline Tugas Akhir' },
        { value: 'seminar_scheduled', label: 'Seminar' },
        { value: 'defense_scheduled', label: 'Sidang' },
        { value: 'submission_deadline', label: 'Deadline Pengumpulan' },
      ],
      lecturer: [
        { value: 'guidance_request', label: 'Permintaan Bimbingan' },
        { value: 'student_guidance', label: 'Bimbingan Diterima' },
        { value: 'guidance_rejected', label: 'Bimbingan Ditolak' },
        { value: 'seminar_as_examiner', label: 'Seminar (Penguji)' },
        { value: 'defense_as_examiner', label: 'Sidang (Penguji)' },
      ],
      admin: [
        { value: 'academic_year_start', label: 'Mulai Tahun Akademik' },
        { value: 'academic_year_end', label: 'Akhir Tahun Akademik' },
        { value: 'registration_period', label: 'Periode Registrasi' },
      ],
    };

    return [...commonOptions, ...(roleOptions[role] || [])];
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event.extendedProps as CalendarEvent;
    if (onEventClick) {
      onEventClick(event);
    }
  };

  // Handle date select (for creating events)
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onCreateEvent) {
      onCreateEvent();
    }
    selectInfo.view.calendar.unselect();
  };

  return (
    <Card className="w-full">
      <div className="p-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold">Kalender</h2>
            <p className="text-sm text-muted-foreground">Kelola jadwal dan event Anda</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Filter Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getEventTypeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Create Event Button */}
            {onCreateEvent && (
              <Button onClick={onCreateEvent} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Buat Event
              </Button>
            )}
          </div>
        </div>

        {/* FullCalendar */}
        <div className="fullcalendar-wrapper">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={idLocale}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
            }}
            buttonText={{
              today: 'today',
              month: 'month',
              week: 'week',
              day: 'day',
              list: 'list'
            }}
            events={fullCalendarEvents}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            editable={false}
            dayMaxEvents={3}
            height="auto"
            firstDay={1}
            slotMinTime="07:00:00"
            slotMaxTime="20:00:00"
            allDaySlot={true}
            nowIndicator={true}
            weekends={true}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotLabelFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            eventDisplay="block"
            displayEventTime={true}
            displayEventEnd={false}
            selectMirror={true}
            unselectAuto={true}
            eventClassNames="shadow-sm"
            dayCellClassNames="hover:bg-accent/50 transition-colors"
          />
        </div>
      </div>

      {/* Minimal Custom CSS for FullCalendar */}
      <style>{`
        .fullcalendar-wrapper .fc {
          font-family: inherit;
        }

        .fullcalendar-wrapper .fc-button {
          text-transform: capitalize;
          background-color: white !important;
          color: #f97316 !important;
          border: 1px solid #f97316 !important;
          padding: 0.4rem 0.8rem !important;
          font-size: 0.875rem !important;
        }

        .fullcalendar-wrapper .fc-button:hover {
          background-color: #fff7ed !important;
          color: #f97316 !important;
          border-color: #f97316 !important;
        }

        .fullcalendar-wrapper .fc-button:focus {
          box-shadow: 0 0 0 0.15rem rgba(249, 115, 22, 0.2) !important;
        }

        .fullcalendar-wrapper .fc-button-active {
          background-color: #f97316 !important;
          color: white !important;
          border-color: #f97316 !important;
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
          background-color: white !important;
          color: #f97316 !important;
          border-color: #f97316 !important;
        }

        .fullcalendar-wrapper .fc-event {
          cursor: pointer;
        }

        .dark .fullcalendar-wrapper .fc-button {
          background-color: hsl(var(--background)) !important;
          color: #f97316 !important;
          border: 1px solid #f97316 !important;
        }

        .dark .fullcalendar-wrapper .fc-button:hover {
          background-color: hsl(var(--accent)) !important;
        }

        .dark .fullcalendar-wrapper .fc-button-active {
          background-color: #f97316 !important;
          color: white !important;
        }
      `}</style>
    </Card>
  );
}
