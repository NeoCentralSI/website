import { getApiUrl } from '../config/api';
import type { CalendarEvent, CalendarFilter, CalendarResponse } from '@/types/calendar.types';

/**
 * Calendar Service
 * Handles all calendar-related API calls with role-based filtering
 */

// Get events for current user (role-based)
export const getMyCalendarEventsAPI = async (filter: {
  startDate: string;
  endDate: string;
  types?: string[];
  status?: string[];
}): Promise<CalendarResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', filter.startDate);
  queryParams.append('endDate', filter.endDate);
  // Backend expects comma-separated string, not multiple params
  if (filter.types?.length) {
    queryParams.append('types', filter.types.join(','));
  }
  if (filter.status?.length) {
    queryParams.append('status', filter.status.join(','));
  }

  const url = getApiUrl(`/calendar/my-events?${queryParams}`);
  console.log('[Calendar Service] Fetching URL:', url);
  console.log('[Calendar Service] Query params:', queryParams.toString());
  console.log('[Calendar Service] Filter:', filter);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  console.log('[Calendar Service] Response status:', response.status);
  console.log('[Calendar Service] Response ok:', response.ok);

  if (!response.ok) {
    const errorData = await response.json();
    console.error('[Calendar Service] Error response:', errorData);
    throw new Error(errorData.message || 'Gagal memuat events');
  }

  const data = await response.json();
  console.log('[Calendar Service] Response data:', data);
  return data;
};

// Get upcoming events (next 7 days)
export const getUpcomingEventsAPI = async (days: number = 7): Promise<{ events: CalendarEvent[] }> => {
  const response = await fetch(getApiUrl(`/calendar/upcoming?days=${days}`), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat upcoming events');
  }

  return response.json();
};

// Create custom event (manual event by user)
export const createCalendarEventAPI = async (data: {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  meetingLink?: string;
  reminderMinutes?: number;
}): Promise<{ event: CalendarEvent }> => {
  const response = await fetch(getApiUrl('/calendar/events'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal membuat event');
  }

  return response.json();
};

// Update event
export const updateCalendarEventAPI = async (
  eventId: string,
  data: Partial<{
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    meetingLink: string;
    reminderMinutes: number;
    status: string;
  }>
): Promise<{ event: CalendarEvent }> => {
  const response = await fetch(getApiUrl(`/calendar/events/${eventId}`), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal mengupdate event');
  }

  return response.json();
};

// Delete event
export const deleteCalendarEventAPI = async (eventId: string): Promise<void> => {
  const response = await fetch(getApiUrl(`/calendar/events/${eventId}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal menghapus event');
  }
};

// Get event statistics (for dashboard widget)
export const getEventStatisticsAPI = async (): Promise<{
  todayEvents: number;
  upcomingEvents: number;
  completedThisMonth: number;
  pendingActions: number;
}> => {
  const response = await fetch(getApiUrl('/calendar/statistics'), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Gagal memuat statistik');
  }

  return response.json();
};
