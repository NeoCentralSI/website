import { useState, useMemo, useRef } from 'react';
import { Plus, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import { getMyCalendarEventsAPI, checkOutlookCalendarAccess, getOutlookCalendarEvents } from '@/services/calendar.service';
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

  // Check Outlook calendar sync status
  const { data: outlookStatus } = useQuery({
    queryKey: ['outlook-calendar-status'],
    queryFn: checkOutlookCalendarAccess,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Calculate date range for queries
  const dateRange = useMemo(() => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return { startDate, endDate };
  }, []);

  // Get internal calendar events
  const { data, error, isLoading } = useQuery({
    queryKey: ['calendar-events', filterType],
    queryFn: async () => {
      try {
        console.log('[Calendar Dashboard] ===== FETCHING INTERNAL EVENTS =====');
        console.log('[Calendar Dashboard] Role:', role);
        console.log('[Calendar Dashboard] Filter type:', filterType);
        
        const result = await getMyCalendarEventsAPI({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          types: filterType !== 'all' ? [filterType] : undefined,
        });
        
        console.log('[Calendar Dashboard] Internal events count:', result?.events?.length || 0);
        return result;
      } catch (err) {
        console.error('[Calendar Dashboard] Error fetching internal events:', err);
        throw err;
      }
    },
    staleTime: 2 * 60 * 1000,
  });

  // Get Outlook calendar events (only if user has calendar access and filter is 'all' or 'outlook')
  const { data: outlookEvents } = useQuery({
    queryKey: ['outlook-calendar-events', dateRange],
    queryFn: async () => {
      try {
        console.log('[Calendar Dashboard] ===== FETCHING OUTLOOK EVENTS =====');
        const result = await getOutlookCalendarEvents(
          dateRange.startDate.toISOString(),
          dateRange.endDate.toISOString()
        );
        console.log('[Calendar Dashboard] Outlook events count:', result?.events?.length || 0);
        return result;
      } catch (err) {
        console.error('[Calendar Dashboard] Error fetching Outlook events:', err);
        return { events: [] };
      }
    },
    enabled: outlookStatus?.hasCalendarAccess === true && (filterType === 'all' || filterType === 'outlook'),
    staleTime: 2 * 60 * 1000,
  });
  
  if (error) {
    console.error('[Calendar Dashboard] Query error:', error);
  }

  // Combine internal events with Outlook events
  const events = useMemo(() => {
    const internalEvents = data?.events || [];
    
    // Transform Outlook events to display format (partial CalendarEvent)
    const transformedOutlookEvents = (outlookEvents?.events || []).map((event) => ({
      id: `outlook-${event.id}`,
      title: event.subject,
      type: 'outlook_event' as const,
      startDate: event.start,
      endDate: event.end,
      location: event.location || undefined,
      meetingLink: event.onlineMeetingUrl || event.webLink || undefined,
      status: 'accepted' as const,
      // Required fields with default values for display purposes
      userId: '',
      userRole: 'student' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'outlook',
      metadata: {
        source: 'outlook',
        webLink: event.webLink,
        isOnlineMeeting: event.isOnlineMeeting,
      },
    }));

    // Merge and deduplicate (avoid showing same event twice if synced)
    const allEvents = [...internalEvents];
    
    // Add Outlook events that don't have matching internal events
    transformedOutlookEvents.forEach((outlookEvent) => {
      // Check if this Outlook event is already synced as an internal event
      const isDuplicate = internalEvents.some((internalEvent) => {
        // Compare by time and title (rough matching)
        const sameTime = new Date(internalEvent.startDate).getTime() === new Date(outlookEvent.startDate).getTime();
        const sameTitle = internalEvent.title?.toLowerCase().includes(outlookEvent.title?.toLowerCase()) ||
                          outlookEvent.title?.toLowerCase().includes(internalEvent.title?.toLowerCase());
        return sameTime && sameTitle;
      });

      if (!isDuplicate) {
        // Cast to any to bypass strict type check since we're displaying only
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allEvents.push(outlookEvent as any);
      }
    });

    console.log('[Calendar Dashboard] Combined events:', allEvents.length);
    return allEvents;
  }, [data?.events, outlookEvents?.events]);

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
      
      // Outlook events
      outlook_event: '#0078d4',           // Microsoft blue
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

    // Add Outlook option if user has calendar access
    if (outlookStatus?.hasCalendarAccess) {
      commonOptions.push({ value: 'outlook', label: '📅 Outlook Calendar' });
    }

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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Kalender</h2>
              {/* Outlook Sync Status */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-pointer">
                      {outlookStatus?.hasCalendarAccess ? (
                        <Badge variant="outline" className="flex items-center gap-1 text-green-600 border-green-200 bg-green-50">
                          <Cloud className="h-3 w-3" />
                          <span className="text-xs">Celendar Sync</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 text-gray-500 border-gray-200 bg-gray-50">
                          <CloudOff className="h-3 w-3" />
                          <span className="text-xs">Offline</span>
                        </Badge>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {outlookStatus?.hasCalendarAccess 
                      ? 'Jadwal bimbingan akan otomatis sync ke Outlook Calendar'
                      : 'Login dengan Microsoft untuk sync ke Outlook Calendar'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
        <div className="fullcalendar-wrapper relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
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
