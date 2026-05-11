import { Badge } from '@/components/ui/badge';

export type ThesisExaminerAvailabilityStatus = 'pending' | 'available' | 'unavailable';

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning' | 'success' | 'info';
  className?: string;
}

const STATUS_MAP: Record<ThesisExaminerAvailabilityStatus, StatusConfig> = {
  pending: {
    label: 'Menunggu Respons',
    variant: 'warning',
  },
  available: {
    label: 'Bersedia',
    variant: 'success',
  },
  unavailable: {
    label: 'Tidak Bersedia',
    variant: 'destructive',
  },
};

interface ThesisExaminerAvailabilityStatusBadgeProps {
  status: ThesisExaminerAvailabilityStatus;
  className?: string;
}

export function ThesisExaminerAvailabilityStatusBadge({ status, className }: ThesisExaminerAvailabilityStatusBadgeProps) {
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

export function getThesisExaminerAvailabilityStatusLabel(status: ThesisExaminerAvailabilityStatus): string {
  return STATUS_MAP[status]?.label || status;
}
