# FullCalendar Migration Guide

## Overview
Kalender pada Dashboard telah dimigrasikan dari custom calendar implementation ke **FullCalendar** library untuk kemudahan penggunaan dan fitur yang lebih lengkap.

## Perubahan yang Dilakukan

### 1. Dependencies Ditambahkan
```bash
pnpm add @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

### 2. File yang Dimodifikasi

#### `src/components/layout/CalendarDashboard.tsx`
- **Sebelum**: Custom calendar dengan grid manual menggunakan date-fns
- **Sesudah**: FullCalendar dengan plugins (daygrid, timegrid, interaction, list)

**Fitur Baru:**
- ✅ Multiple view types: Month, Week, Day, List
- ✅ Time-based events dengan slot waktu (07:00 - 20:00)
- ✅ Drag-to-select untuk membuat event
- ✅ Event click handler
- ✅ Indonesian locale built-in
- ✅ Responsive layout
- ✅ Now indicator (garis waktu saat ini)
- ✅ Better event overflow handling (dayMaxEvents: 3)
- ✅ Custom styling yang terintegrasi dengan shadcn/ui theme

#### `src/index.css`
Menambahkan FullCalendar CSS imports:
```css
@import '@fullcalendar/core/main.css';
@import '@fullcalendar/daygrid/main.css';
@import '@fullcalendar/timegrid/main.css';
@import '@fullcalendar/list/main.css';
```

#### `src/pages/Dashboard.tsx`
- Tetap menggunakan CalendarDashboard component (interface sama)
- Event handling tetap sama (onEventClick, onCreateEvent)

## Fitur FullCalendar yang Tersedia

### View Types
1. **dayGridMonth** - Tampilan bulanan (default)
2. **timeGridWeek** - Tampilan mingguan dengan time slots
3. **timeGridDay** - Tampilan harian dengan time slots
4. **listWeek** - Tampilan list minggu ini

### Interaksi
- **Event Click**: Klik event untuk melihat detail
- **Date Select**: Drag untuk select tanggal (trigger create event)
- **Navigation**: Tombol prev/next/today untuk navigasi
- **Filtering**: Filter by event type (role-based)

### Kustomisasi
- **Colors**: Event colors berdasarkan type (16+ warna berbeda)
- **Time Format**: 24-hour format (HH:mm)
- **Week Start**: Senin (firstDay: 1)
- **Locale**: Bahasa Indonesia

## Custom Styling

Calendar menggunakan CSS variables dari shadcn/ui theme:
- `--fc-border-color`: Border calendar
- `--fc-button-bg-color`: Warna tombol (primary)
- `--fc-today-bg-color`: Background hari ini (accent)
- Dark mode support

## Props Interface (Tidak Berubah)

```typescript
interface CalendarDashboardProps {
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  compact?: boolean; // Deprecated, tidak digunakan lagi
}
```

## Migration Benefits

### ✅ Kelebihan
1. **Professional UI**: Library yang mature dan teruji
2. **Multiple Views**: Month, week, day, list views
3. **Time-based Events**: Support untuk event dengan waktu spesifik
4. **Better Responsive**: Mobile-friendly out of the box
5. **Accessibility**: Built-in keyboard navigation
6. **Performance**: Optimized rendering untuk banyak event
7. **Internationalization**: Locale support built-in
8. **Maintenance**: Library di-maintain oleh komunitas besar

### ⚠️ Breaking Changes
- Props `compact` tidak lagi digunakan (view types handle ini)
- Custom navigation dihapus (diganti built-in navigation)
- Selected date events list dihapus (view list sudah handle ini)

## Event Data Structure

FullCalendar events dikonversi dari CalendarEvent:

```typescript
{
  id: event.id,
  title: event.title,
  start: event.startDate,
  end: event.endDate,
  backgroundColor: getEventColor(event.type),
  borderColor: getEventColor(event.type),
  extendedProps: {
    ...event, // Original event data disimpan di extendedProps
  },
}
```

## Event Colors by Type

```typescript
const colorMap = {
  // Student events
  guidance_scheduled: '#3b82f6',      // blue-500
  guidance_completed: '#10b981',      // green-500
  thesis_deadline: '#ef4444',         // red-500
  seminar_scheduled: '#8b5cf6',       // purple-500
  defense_scheduled: '#f59e0b',       // amber-500
  submission_deadline: '#ec4899',     // pink-500
  
  // Lecturer events
  guidance_request: '#06b6d4',        // cyan-500
  student_guidance: '#14b8a6',        // teal-500
  seminar_as_examiner: '#6366f1',     // indigo-500
  defense_as_examiner: '#f97316',     // orange-500
  
  // Admin events
  academic_year_start: '#84cc16',     // lime-500
  academic_year_end: '#eab308',       // yellow-500
  registration_period: '#a855f7',     // purple-500
  
  // Common events
  meeting: '#64748b',                 // slate-500
  holiday: '#dc2626',                 // red-600
  announcement: '#059669',            // emerald-600
};
```

## Usage Example

```tsx
import { CalendarDashboard } from '@/components/layout/CalendarDashboard';

function Dashboard() {
  const handleEventClick = (event: CalendarEvent) => {
    // Show event detail dialog
  };

  const handleCreateEvent = () => {
    // Show create event dialog
  };

  return (
    <CalendarDashboard
      onEventClick={handleEventClick}
      onCreateEvent={handleCreateEvent}
    />
  );
}
```

## Responsive Behavior

- **Desktop (>= 1024px)**: Full calendar dengan semua fitur
- **Tablet (768px - 1023px)**: Calendar dengan toolbar vertikal
- **Mobile (< 768px)**: List view otomatis lebih baik untuk mobile

## Performance Tips

1. **Date Range**: Query hanya 3 bulan data (prev month + current + next month)
2. **React Query**: Cache 2 menit untuk mengurangi API calls
3. **useMemo**: Event conversion di-memoize
4. **dayMaxEvents**: Limit 3 events per day untuk performa

## Future Enhancements

Fitur yang bisa ditambahkan di masa depan:
- [ ] Event drag & drop untuk reschedule
- [ ] Event resize untuk ubah durasi
- [ ] Print calendar
- [ ] Export to iCal/Google Calendar
- [ ] Recurring events
- [ ] Event categories/tags
- [ ] Custom event templates
- [ ] Resource timeline view (untuk dosen dengan multiple students)

## Documentation

FullCalendar Documentation: https://fullcalendar.io/docs
- [View API](https://fullcalendar.io/docs/view-api)
- [Event Object](https://fullcalendar.io/docs/event-object)
- [Theming](https://fullcalendar.io/docs/theming)
- [Localization](https://fullcalendar.io/docs/locale)

## Troubleshooting

### Calendar tidak muncul
- Pastikan CSS FullCalendar sudah di-import di `index.css`
- Check console untuk error

### Event tidak muncul
- Verify event data format (start/end dates valid ISO strings)
- Check filter type settings
- Verify API response structure

### Styling tidak sesuai
- Check CSS custom properties di component
- Verify shadcn/ui theme variables
- Test di light/dark mode

## Support

Jika ada issue atau pertanyaan, silakan refer ke:
1. FullCalendar docs: https://fullcalendar.io/docs
2. GitHub issues: https://github.com/fullcalendar/fullcalendar/issues
3. Stack Overflow: Tag `fullcalendar`
