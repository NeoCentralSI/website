import { Badge } from '@/components/ui/badge';
import type { ThesisSeminarStatus } from '@/types/seminar.types';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info';
  className?: string;
}

const STATUS_MAP: Record<ThesisSeminarStatus, StatusConfig> = {
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
    variant: 'success',
  },
  passed: {
    label: 'Lulus',
    variant: 'secondary',
  },
  passed_with_revision: {
    label: 'Lulus Bersyarat',
    variant: 'secondary',
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

interface SeminarStatusBadgeProps {
  status: ThesisSeminarStatus;
}

export function SeminarStatusBadge({ status }: SeminarStatusBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: 'outline' as const,
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

/**
 * Get display label for a given seminar status
 */
export function getSeminarStatusLabel(status: ThesisSeminarStatus): string {
  return STATUS_MAP[status]?.label || status;
}

/**
 * Get the admin-facing display group for status filter
 */
export function getStatusFilterOptions() {
  return [
    { label: 'Semua', value: '' },
    { label: 'Menunggu Validasi', value: 'registered' },
    { label: 'Menunggu Penetapan Penguji', value: 'verified' },
    { label: 'Menunggu Jadwal', value: 'examiner_assigned' },
    { label: 'Terjadwalkan', value: 'scheduled' },
    { label: 'Selesai', value: 'finished' },
  ];
}
