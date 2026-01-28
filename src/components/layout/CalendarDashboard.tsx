import { useState, useMemo, useRef, useEffect } from 'react';
import { Plus, Cloud, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMyCalendarEventsAPI, checkOutlookCalendarAccess, getOutlookCalendarEvents } from '@/services/calendar.service';
import type { CalendarEvent } from '@/types/calendar.types';
import { useRole } from '@/hooks/shared';
import { cn } from '@/lib/utils';

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
  className?: string;
}

export function CalendarDashboard({ onEventClick, onCreateEvent, className }: CalendarDashboardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  // Handle Resize for responsive layout
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      // Use requestAnimationFrame to throttle and ensure render cycle is complete
      requestAnimationFrame(() => {
        if (calendarRef.current) {
          calendarRef.current.getApi().updateSize();
        }
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
  const { data, error, isLoading, refetch: refetchInternal, isFetching: isFetchingInternal } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => {
      try {
        console.log('[Calendar Dashboard] ===== FETCHING INTERNAL EVENTS =====');
        console.log('[Calendar Dashboard] Role:', role);
        
        const result = await getMyCalendarEventsAPI({
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
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

  // Get Outlook calendar events (only if user has calendar access)
  const { data: outlookEvents, refetch: refetchOutlook, isFetching: isFetchingOutlook } = useQuery({
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
    enabled: outlookStatus?.hasCalendarAccess === true,
    staleTime: 2 * 60 * 1000,
  });
  
  if (error) {
    console.error('[Calendar Dashboard] Query error:', error);
  }

  // Check if any sync operation is in progress
  const isLoadingAny = isLoading || isFetchingInternal || isFetchingOutlook || isSyncing;

  // Sync function to refresh calendar data
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log('[Calendar Dashboard] Manual sync triggered');
      
      // Use refetch instead of invalidateQueries for better loading feedback
      await Promise.all([
        refetchInternal(),
        outlookStatus?.hasCalendarAccess && refetchOutlook(),
        queryClient.invalidateQueries({ queryKey: ['outlook-calendar-status'] })
      ].filter(Boolean));
      
      console.log('[Calendar Dashboard] Manual sync completed');
    } catch (error) {
      console.error('[Calendar Dashboard] Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

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
        // Enhanced matching logic for better deduplication
        
        // 1. Check if the internal event has an Outlook calendar event ID that matches
        const hasMatchingOutlookId = (internalEvent as any)?.outlookEventId === outlookEvent.id.replace('outlook-', '');
        if (hasMatchingOutlookId) {
          console.log('[Calendar Dashboard] Found exact Outlook ID match:', {
            internalEventId: internalEvent.id,
            outlookEventId: outlookEvent.id,
            title: internalEvent.title
          });
          return true;
        }
        
        // 2. Time-based matching with tolerance for timezone conversion issues
        const internalTime = new Date(internalEvent.startDate);
        const outlookTime = new Date(outlookEvent.startDate);
        const timeDifferenceMinutes = Math.abs(internalTime.getTime() - outlookTime.getTime()) / (1000 * 60);
        
        // Allow up to 12 hours difference to account for timezone conversion issues
        const timeMatch = timeDifferenceMinutes <= (12 * 60);
        
        // 3. Title matching (case insensitive, partial match)
        const internalTitle = (internalEvent.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
        const outlookTitle = (outlookEvent.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
        
        // Check if titles have common words (for "Bimbingan - Student Name" vs "Bimbingan ...")
        const titleMatch = (
          internalTitle.includes('bimbingan') && outlookTitle.includes('bimbingan') ||
          internalTitle.includes(outlookTitle) || 
          outlookTitle.includes(internalTitle) ||
          (internalTitle.split(' ').some(word => word.length > 3 && outlookTitle.includes(word)))
        );
        
        const isMatch = timeMatch && titleMatch;
        
        if (isMatch) {
          console.log('[Calendar Dashboard] Found potential duplicate:', {
            internalEvent: {
              id: internalEvent.id,
              title: internalEvent.title,
              startDate: internalEvent.startDate,
              type: internalEvent.type
            },
            outlookEvent: {
              id: outlookEvent.id,
              title: outlookEvent.title,
              startDate: outlookEvent.startDate,
              type: outlookEvent.type
            },
            timeDifferenceMinutes,
            timeMatch,
            titleMatch
          });
        }
        
        return isMatch;
      });

      if (!isDuplicate) {
        console.log('[Calendar Dashboard] Adding Outlook event (no duplicate found):', {
          id: outlookEvent.id,
          title: outlookEvent.title,
          startDate: outlookEvent.startDate
        });
        // Cast to any to bypass strict type check since we're displaying only
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        allEvents.push(outlookEvent as any);
      } else {
        console.log('[Calendar Dashboard] Skipping Outlook event (duplicate found):', {
          id: outlookEvent.id,
          title: outlookEvent.title,
          startDate: outlookEvent.startDate
        });
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
    <Card className={cn("w-full h-full flex flex-col", className)}>
      <div className="p-6 h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4 shrink-0">
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
            {/* Sync Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSync}
                    disabled={isLoadingAny}
                    size="sm"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingAny ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isLoadingAny ? 'Menyinkronkan...' : 'Sinkronkan Kalender'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
        <div 
          ref={containerRef}
          className="fullcalendar-wrapper relative flex-1 min-h-0"
        >
          {isLoadingAny && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale={idLocale}
            dayHeaderContent={(args) => {
              const day = args.date.toLocaleDateString('id-ID', { weekday: 'short' });
              return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
            }}
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
            height="100%"
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
        .fullcalendar-wrapper {
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
          --fc-list-event-hover-bg-color: var(--accent);
          font-family: inherit;
        }

        /* Toolbar Styling */
        .fullcalendar-wrapper .fc-header-toolbar {
          margin-bottom: 1.5rem !important;
          gap: 1rem;
        }

        .fullcalendar-wrapper .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: var(--foreground);
        }

        /* Button Styling */
        .fullcalendar-wrapper .fc-button {
          height: 2.25rem;
          padding: 0 1rem !important;
          font-size: 0.875rem !important;
          font-weight: 500 !important;
          text-transform: capitalize;
          border-radius: var(--radius) !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .fullcalendar-wrapper .fc-button:hover {
          background-color: var(--accent) !important;
          color: var(--accent-foreground) !important;
          border-color: var(--border) !important;
        }

        .fullcalendar-wrapper .fc-button-active {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-color: var(--primary) !important;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .fullcalendar-wrapper .fc-button:disabled {
          opacity: 0.5;
        }

        /* Button Group Styling */
        .fullcalendar-wrapper .fc-button-group .fc-button {
          border-radius: 0 !important;
        }
        
        .fullcalendar-wrapper .fc-button-group .fc-button:first-child {
          border-top-left-radius: var(--radius) !important;
          border-bottom-left-radius: var(--radius) !important;
        }
        
        .fullcalendar-wrapper .fc-button-group .fc-button:last-child {
          border-top-right-radius: var(--radius) !important;
          border-bottom-right-radius: var(--radius) !important;
        }

        /* Focus Ring */
        .fullcalendar-wrapper .fc-button:focus-visible {
          outline: 2px solid var(--ring);
          outline-offset: 2px;
          z-index: 10;
        }

        /* Grid Header */
        .fullcalendar-wrapper .fc-col-header-cell {
          background-color: var(--muted);
          padding: 0.5rem 0 !important;
        }

        .fullcalendar-wrapper .fc-col-header-cell-cushion {
          color: var(--muted-foreground);
          font-weight: 500;
          font-size: 0.875rem;
          text-transform: capitalize;
          letter-spacing: 0.025em;
        }

        /* Grid Body */
        .fullcalendar-wrapper .fc-daygrid-day-number {
          padding: 0.5rem 0.75rem !important;
          color: var(--foreground);
          font-size: 0.875rem;
          font-weight: 400;
        }

        .fullcalendar-wrapper .fc-day-today {
          background-color: transparent !important;
        }
        
        .fullcalendar-wrapper .fc-day-today .fc-daygrid-day-frame {
          background-color: var(--accent);
        }

        /* Events */
        .fullcalendar-wrapper .fc-event {
          border-radius: 4px;
          border: none;
          padding: 2px 4px;
          font-weight: 500;
          font-size: 0.75rem;
        }
      `}</style>
    </Card>
  );
}
