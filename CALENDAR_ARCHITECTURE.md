# 📅 Full Calendar Implementation Guide

## Arsitektur Rekomendasi untuk Multi-User Calendar System

### 🎯 Konsep Utama

Calendar system dirancang dengan **role-based event filtering** dimana:
- **Student**: Melihat jadwal bimbingan, deadline, seminar, sidang
- **Lecturer**: Melihat permintaan bimbingan, jadwal dengan mahasiswa, tugas sebagai penguji
- **Admin**: Melihat event akademik (tahun ajaran, periode pendaftaran, maintenance)

### ✨ Fitur Utama

#### 1. **Auto-Generated Events**
Events otomatis dibuat dari:
- ✅ Bimbingan yang dijadwalkan (guidance)
- ✅ Tahun ajaran baru (academic year)
- ✅ Deadline thesis milestones
- ✅ Jadwal seminar & sidang
- ✅ Periode pendaftaran

#### 2. **Manual Events**
User dapat membuat event custom:
- Meeting pribadi
- Reminder deadline
- Event khusus lainnya

#### 3. **Smart Filtering**
- Filter by event type (role-based)
- Filter by status (scheduled, completed, cancelled)
- Filter by date range
- Search events

#### 4. **Notifications**
- Reminder sebelum event (30 menit default)
- Push notification via FCM
- Email notification (optional)

#### 5. **Multi-View**
- Month view (default)
- Week view
- Day view

### 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CALENDAR EVENT SOURCES                    │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ┌─────────┐         ┌─────────┐        ┌─────────┐
    │Guidance │         │Academic │        │ Manual  │
    │ System  │         │  Year   │        │  Event  │
    └────┬────┘         └────┬────┘        └────┬────┘
         │                   │                   │
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Calendar Service │
                   │  - Create Event  │
                   │  - Get Events    │
                   │  - Filter Events │
                   └────────┬─────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
        ┌─────────┐   ┌─────────┐   ┌─────────┐
        │ Student │   │Lecturer │   │  Admin  │
        │  View   │   │  View   │   │  View   │
        └─────────┘   └─────────┘   └─────────┘
```

### 🗄️ Database Design

#### Calendar Event Table
```
- id: Primary key
- title: Event title
- description: Event description
- type: Event type (enum based on role)
- status: Event status (scheduled, completed, etc.)
- startDate: Start datetime
- endDate: End datetime (optional)
- userId: Owner of the event
- userRole: Role of the owner
- relatedId: ID of related entity (guidance, thesis, etc.)
- relatedType: Type of related entity
- participants: Many-to-many relation
- location: Physical location
- meetingLink: Online meeting URL
- reminderMinutes: Reminder time before event
- notificationSent: Boolean flag
- color: Event color
- backgroundColor: Event background color
```

#### Event Participant Table (Many-to-Many)
```
- id: Primary key
- eventId: Foreign key to CalendarEvent
- userId: Foreign key to User
- role: Participant role
- status: Acceptance status (pending, accepted, declined)
```

### 🎨 Frontend Components

#### 1. CalendarDashboard Component
**Location**: `src/components/layout/CalendarDashboard.tsx`

**Features**:
- Month/Week/Day view switching
- Role-based event type filtering
- Event color coding by type
- Click to view event details
- Create custom events
- Navigate months/weeks

**Props**:
```typescript
interface CalendarDashboardProps {
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  compact?: boolean;
}
```

#### 2. Event Type Colors (Role-Based)

**Student Events**:
- 🔵 Guidance Scheduled: Blue (#3b82f6)
- 🟢 Guidance Completed: Green (#10b981)
- 🔴 Thesis Deadline: Red (#ef4444)
- 🟣 Seminar: Purple (#a855f7)
- 🟠 Defense: Orange (#f97316)

**Lecturer Events**:
- 🟡 Guidance Request: Yellow (#eab308)
- 🔵 Student Guidance: Blue (#3b82f6)
- 🟣 Seminar (Examiner): Purple (#a855f7)
- 🟠 Defense (Examiner): Orange (#f97316)

**Admin Events**:
- 🟣 Academic Year: Purple (#8b5cf6)
- 🟠 Registration Period: Orange (#f59e0b)
- ⚪ System Maintenance: Gray (#6b7280)

### 🔌 API Endpoints

```
GET    /calendar/my-events       - Get calendar events for current user
GET    /calendar/upcoming        - Get upcoming events (next N days)
GET    /calendar/statistics      - Get event statistics for dashboard
POST   /calendar/events          - Create custom event
PATCH  /calendar/events/:id      - Update event
DELETE /calendar/events/:id      - Delete event
```

### 🔗 Integration Points

#### 1. Guidance System
```javascript
// When guidance is approved/scheduled
async function approveGuidance(guidanceId, data) {
  // ... approve guidance logic
  
  // Auto-create calendar events for student & lecturer
  await createGuidanceCalendarEvent(guidanceId, {
    studentId: guidance.studentId,
    lecturerId: data.lecturerId,
    guidanceDate: data.guidanceDate,
    notes: data.notes
  });
}
```

#### 2. Academic Year
```javascript
// When admin creates academic year
async function createAcademicYear(data) {
  const academicYear = await prisma.academicYear.create({ data });
  
  // Broadcast to all users
  await createAcademicYearEvents(academicYear.id, academicYear);
}
```

#### 3. Thesis Milestones
```javascript
// When thesis reaches a milestone
async function updateThesisProgress(thesisId, milestone) {
  // ... update progress
  
  // Create deadline event if milestone has deadline
  if (milestone.deadline) {
    await createThesisDeadlineEvent(thesisId, milestone);
  }
}
```

### 📱 Mobile Responsiveness

#### Desktop View (>768px):
- Full calendar grid (7 columns)
- Multiple events per day visible
- Sidebar with selected date details

#### Tablet View (768px - 1024px):
- Full calendar grid
- Compact event display (2 events max per day)
- Bottom sheet for details

#### Mobile View (<768px):
- List view alternative
- Day/Week view recommended
- Swipe navigation between months

### 🔔 Notification Strategy

#### Reminder Timing:
- 30 minutes before event (default)
- 1 day before (for important events)
- Custom reminder time (user setting)

#### Notification Types:
1. **Push Notification** (FCM):
   - Real-time reminder
   - Click to open event detail

2. **In-App Notification**:
   - Bell icon badge
   - Notification center

3. **Email** (optional):
   - Daily digest of events
   - Important event reminders

### 🎯 User Experience Best Practices

#### 1. **Progressive Disclosure**
- Show summary in month view (title only)
- Show details on hover (tooltip)
- Full details on click (modal/sheet)

#### 2. **Visual Hierarchy**
- Today highlighted with border
- Selected date with ring
- Past events grayed out
- Completed events with checkmark

#### 3. **Loading States**
- Skeleton for calendar grid
- Shimmer effect for event loading
- Optimistic UI updates

#### 4. **Error Handling**
- Graceful fallback if API fails
- Retry mechanism
- Offline support (cache last events)

### 🚀 Performance Optimization

#### 1. **Data Fetching**
```typescript
// Only fetch events for visible month
const { data } = useQuery({
  queryKey: ['calendar', month, year, filters],
  queryFn: () => getMyCalendarEventsAPI({
    startDate: startOfMonth(currentDate),
    endDate: endOfMonth(currentDate),
    ...filters
  }),
  staleTime: 2 * 60 * 1000, // 2 minutes
  cacheTime: 5 * 60 * 1000, // 5 minutes
});
```

#### 2. **Memoization**
```typescript
// Memoize expensive computations
const daysInMonth = useMemo(() => 
  eachDayOfInterval({ 
    start: startOfMonth(currentDate), 
    end: endOfMonth(currentDate) 
  }),
  [currentDate]
);

const getEventsForDate = useCallback((date: Date) => {
  return events.filter(e => isSameDay(new Date(e.startDate), date));
}, [events]);
```

#### 3. **Virtual Scrolling**
For list view with many events:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: events.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80,
});
```

### 📈 Analytics & Insights

Track user engagement:
- Most viewed event types
- Average events per user per week
- Event completion rate
- Most used filters

### 🧪 Testing Strategy

#### Unit Tests:
- Date utility functions
- Event filtering logic
- Color mapping functions

#### Integration Tests:
- API endpoints
- Event creation flows
- Notification triggers

#### E2E Tests:
- User creates custom event
- Guidance creates calendar events
- Filter and view events

### 📦 Implementation Checklist

**Backend**:
- [ ] Create CalendarEvent model in Prisma
- [ ] Create EventParticipant model
- [ ] Implement calendar.service.js
- [ ] Implement calendar.controller.js
- [ ] Add calendar routes
- [ ] Integrate with guidance system
- [ ] Integrate with academic year system
- [ ] Setup notification job for reminders

**Frontend**:
- [ ] Create calendar types
- [ ] Implement calendar.service.ts
- [ ] Create CalendarDashboard component
- [ ] Add to Dashboard page
- [ ] Create event detail modal
- [ ] Create event form dialog
- [ ] Add loading states
- [ ] Add error handling
- [ ] Mobile responsive testing

**Testing**:
- [ ] Backend unit tests
- [ ] Backend integration tests
- [ ] Frontend component tests
- [ ] E2E tests
- [ ] Performance testing

### 🔒 Security Considerations

1. **Authorization**: Users can only see their own events + shared events
2. **Role Isolation**: Events filtered by user role
3. **Input Validation**: Validate all date inputs
4. **XSS Prevention**: Sanitize event titles/descriptions
5. **Rate Limiting**: Limit event creation (prevent spam)

### 📝 Example Usage in Dashboard

```typescript
// In Dashboard.tsx
import { CalendarDashboard } from '@/components/layout/CalendarDashboard';

export default function Dashboard() {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createEventOpen, setCreateEventOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar takes 2 columns */}
      <div className="lg:col-span-2">
        <CalendarDashboard
          onEventClick={setSelectedEvent}
          onCreateEvent={() => setCreateEventOpen(true)}
        />
      </div>
      
      {/* Other dashboard widgets */}
      <div className="space-y-6">
        <UpcomingEventsWidget />
        <EventStatisticsWidget />
      </div>
    </div>
  );
}
```

## 🎉 Kesimpulan

Dengan arsitektur ini, Anda mendapatkan:

✅ **Separation of Concerns**: Calendar logic terpisah dari business logic lain
✅ **Role-Based Views**: Setiap user melihat event yang relevan dengan role mereka
✅ **Auto-Generation**: Events otomatis dibuat dari sistem lain (guidance, academic year)
✅ **Scalability**: Mudah menambah event type baru
✅ **Performance**: Optimized dengan caching, memoization, dan pagination
✅ **UX**: Intuitif, responsive, dan informative
✅ **Integration**: Mudah diintegrasikan dengan sistem yang ada

Implementasi ini memberikan user experience yang seamless dimana mereka dapat:
1. Melihat semua event mereka di satu tempat
2. Filter event berdasarkan tipe/status
3. Mendapat reminder sebelum event
4. Membuat event custom sendiri
5. Melihat event dari perspektif role mereka
