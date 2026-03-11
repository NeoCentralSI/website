import { Badge } from '@/components/ui/badge';

export type ThesisWorkflowStatus =
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

const STATUS_MAP: Record<ThesisWorkflowStatus, StatusConfig> = {
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

interface ThesisWorkflowStatusBadgeProps {
  status: ThesisWorkflowStatus;
}

export function ThesisWorkflowStatusBadge({ status }: ThesisWorkflowStatusBadgeProps) {
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

export function getThesisWorkflowStatusLabel(status: ThesisWorkflowStatus): string {
  return STATUS_MAP[status]?.label || status;
}

export function getThesisWorkflowStatusFilterOptions(options?: { includeOngoing?: boolean }) {
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
