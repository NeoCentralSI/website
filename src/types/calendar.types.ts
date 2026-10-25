// Calendar Event Types untuk Multi-User System

export type EventType = 
  // Student Events
  | 'guidance_scheduled'     // accepted guidance
  | 'guidance_request'       // requested guidance (pending)
  | 'guidance_rejected'      // rejected guidance
  | 'thesis_deadline'
  | 'seminar_scheduled'
  | 'internship_seminar'
  | 'defense_scheduled'
  | 'submission_deadline'
  
  // Lecturer Events
  | 'student_guidance'       // accepted guidance (lecturer view)
  | 'seminar_as_examiner'
  | 'defense_as_examiner'
  | 'yudisium_event'
  
  // Admin Events
  | 'academic_year_start'
  | 'academic_year_end'
  | 'registration_period'
  | 'system_maintenance'
  
  // Common Events
  | 'meeting'
  | 'holiday'
  | 'announcement'
  
  // External Calendar Events
  | 'outlook_event';

export type EventStatus = 'requested' | 'accepted' | 'rejected';

/** The kind of a TA event, with its full label ("Bimbingan", "Seminar Hasil", "Sidang", "Yudisium"). */
export type EventKind = 'guidance' | 'seminar' | 'defence' | 'yudisium';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  type: EventType;
  /** Guidance: EventStatus; seminar/defence: the effective status (scheduled, ongoing, passed, ...). */
  status: EventStatus | string | null;
  /** Set by the server for TA events. */
  kind?: EventKind;
  kindLabel?: string;
  statusLabel?: string | null;
  /** The page of this event for the viewer's role; no "Lihat Detail" without it. */
  detailPath?: string | null;
  /** The copy in the viewer's own Outlook calendar, when it was synced. */
  outlookEventId?: string | null;
  /** No time known (e.g. an archived seminar): the whole day, `startDate` is "YYYY-MM-DD". */
  allDay?: boolean;
  startDate: string; // ISO 8601
  endDate?: string | null;  // ISO 8601
  
  // User-specific data
  userId: string;
  userRole: 'student' | 'lecturer' | 'admin';
  
  // Related entities (optional)
  relatedId?: string; // ID of related thesis, guidance, etc.
  relatedType?: 'thesis' | 'guidance' | 'seminar' | 'defense';
  
  // Participants (untuk event group)
  participants?: Array<{
    userId: string;
    name: string;
    role: 'student' | 'lecturer' | 'admin' | 'moderator';
    /** "Mahasiswa", "Pembimbing 1", "Penguji 1", ... */
    roleLabel?: string;
  }>;
  
  // Location/Link
  location?: string | null;
  meetingLink?: string | null;
  
  // Notifications
  reminderMinutes?: number; // Reminder berapa menit sebelum event
  notificationSent?: boolean;
  
  // Styling
  color?: string;
  backgroundColor?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface CalendarFilter {
  startDate: string;
  endDate: string;
  types?: EventType[];
  status?: EventStatus[];
  userId?: string;
  userRole?: 'student' | 'lecturer' | 'admin';
}

export interface CalendarResponse {
  events: CalendarEvent[];
  meta: {
    total: number;
    startDate: string;
    endDate: string;
  };
}
