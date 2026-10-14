import { Badge } from '@/components/ui/badge';
import { getSupervisorRequestStatusLabel, getSupervisorRequestStatusVariant } from '@/lib/thesisLabels';

/** Badge status Pengajuan Pembimbing (`ThesisSupervisorRequestStatus`), label dari `lib/thesisLabels`. */
export function SupervisorRequestStatusBadge({ status, className }: { status: string | null | undefined; className?: string }) {
  return (
    <Badge variant={getSupervisorRequestStatusVariant(status)} className={className}>
      {getSupervisorRequestStatusLabel(status)}
    </Badge>
  );
}
