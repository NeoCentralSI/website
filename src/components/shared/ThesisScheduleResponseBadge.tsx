import { Badge } from '@/components/ui/badge';

export type ThesisScheduleResponseStatus = 'pending' | 'confirmed' | 'request_change';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info';
  className?: string;
}

const STATUS_MAP: Record<ThesisScheduleResponseStatus, StatusConfig> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    variant: 'warning',
  },
  confirmed: {
    label: 'Dikonfirmasi',
    variant: 'success',
  },
  request_change: {
    label: 'Meminta Perubahan',
    variant: 'destructive',
  },
};

interface ThesisScheduleResponseBadgeProps {
  status: ThesisScheduleResponseStatus;
  className?: string;
}

export function ThesisScheduleResponseBadge({ status, className }: ThesisScheduleResponseBadgeProps) {
  const config = STATUS_MAP[status] || {
    label: status,
    variant: 'outline' as const,
  };

  return (
    <Badge variant={config.variant} className={`${config.className || ''} ${className || ''}`.trim()}>
      {config.label}
    </Badge>
  );
}

export function getThesisScheduleResponseLabel(status: ThesisScheduleResponseStatus): string {
  return STATUS_MAP[status]?.label || status;
}
