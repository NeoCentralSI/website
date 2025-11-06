// Calendar Event Types untuk Multi-User System

export type EventType = 
  // Student Events
  | 'guidance_scheduled'     // accepted guidance
  | 'guidance_request'       // requested guidance (pending)
  | 'guidance_rejected'      // rejected guidance
  | 'thesis_deadline'
  | 'seminar_scheduled'
  | 'defense_scheduled'
  | 'submission_deadline'
  
  // Lecturer Events
  | 'student_guidance'       // accepted guidance (lecturer view)
  | 'seminar_as_examiner'
  | 'defense_as_examiner'
  
  // Admin Events
  | 'academic_year_start'
  | 'academic_year_end'
  | 'registration_period'
  | 'system_maintenance'
  
  // Common Events
  | 'meeting'
  | 'holiday'
  | 'announcement';

export type EventStatus = 'requested' | 'accepted' | 'rejected';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  status: EventStatus;
  startDate: string; // ISO 8601
  endDate?: string;  // ISO 8601
  
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
    role: 'student' | 'lecturer' | 'admin';
  }>;
  
  // Location/Link
  location?: string;
  meetingLink?: string;
  
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
