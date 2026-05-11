import { Badge } from '@/components/ui/badge';

export type ThesisEventStatus =
  | 'registered'
  | 'verified'
  | 'examiner_assigned'
  | 'scheduled'
  | 'ongoing'
  | 'passed'
  | 'passed_with_revision'
  | 'failed'
  | 'cancelled';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info';
  className?: string;
}

const STATUS_MAP: Record<ThesisEventStatus, StatusConfig> = {
  registered: {
    label: 'Menunggu Validasi',
    variant: 'warning',
  },
  verified: {
    label: 'Menunggu Penetapan Penguji',
    variant: 'info',
  },
  examiner_assigned: {
    label: 'Menunggu Jadwal',
    variant: 'default',
    className: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-transparent',
  },
  scheduled: {
    label: 'Terjadwalkan',
    variant: 'default',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent',
  },
  ongoing: {
    label: 'Sedang Berlangsung',
    variant: 'warning',
    className: 'bg-orange-100 text-orange-700 border-orange-200 animate-pulse',
  },
  passed: {
    label: 'Lulus',
    variant: 'success',
  },
  passed_with_revision: {
    label: 'Lulus dengan Revisi',
    variant: 'success',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-transparent',
  },
  failed: {
    label: 'Tidak Lulus',
    variant: 'destructive',
  },
  cancelled: {
    label: 'Dibatalkan',
    variant: 'secondary',
  },
};

interface ThesisEventStatusBadgeProps {
  status: ThesisEventStatus;
  className?: string;
  /** Optional schedule info to automatically show "Sedang Berlangsung" if time has passed */
  scheduledDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export function ThesisEventStatusBadge({
  status,
  className,
  scheduledDate,
  startTime,
}: ThesisEventStatusBadgeProps) {
  let displayStatus = status;

  // Auto-transition scheduled to ongoing if time has passed
  if (status === 'scheduled' && scheduledDate && startTime) {
    try {
      const now = new Date();

      // Parse date: YYYY-MM-DD
      const dateStr = scheduledDate.includes('T') ? scheduledDate.split('T')[0] : scheduledDate;

      // Parse time: HH:mm
      let timeStr = '00:00';
      if (startTime.includes('T')) {
        const d = new Date(startTime);
        timeStr = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      } else {
        timeStr = startTime.slice(0, 5);
      }

      const scheduledStart = new Date(`${dateStr}T${timeStr}:00`);

      // If current time is past scheduled start, show as ongoing
      if (now >= scheduledStart) {
        displayStatus = 'ongoing';
      }
    } catch (e) {
      // Fallback to original status if parsing fails
      console.error('Error parsing schedule for badge:', e);
    }
  }

  const config = STATUS_MAP[displayStatus] || {
    label: displayStatus,
    variant: 'outline' as const,
  };

  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className || ''}`.trim()}>
      {config.label}
    </Badge>
  );
}

export function getThesisEventStatusLabel(status: ThesisEventStatus): string {
  return STATUS_MAP[status]?.label || status;
}

export function getThesisEventStatusFilterOptions(options?: { includeOngoing?: boolean }) {
  const includeOngoing = options?.includeOngoing ?? true;

  const result = [
    { label: 'Semua', value: '' },
    { label: 'Menunggu Validasi', value: 'registered' },
    { label: 'Menunggu Penetapan Penguji', value: 'verified' },
    { label: 'Menunggu Jadwal', value: 'examiner_assigned' },
    { label: 'Terjadwalkan', value: 'scheduled' },
  ];

  if (includeOngoing) {
    result.push({ label: 'Sedang Berlangsung', value: 'ongoing' });
  }

  result.push({ label: 'Selesai', value: 'finished' });
  return result;
}
