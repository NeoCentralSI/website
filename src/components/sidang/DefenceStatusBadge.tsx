import { Badge } from '@/components/ui/badge';
import type { ThesisDefenceStatus } from '@/types/defence.types';

const STATUS_META: Record<
  ThesisDefenceStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' }
> = {
  registered: { label: 'Terdaftar', variant: 'secondary' },
  verified: { label: 'Terverifikasi', variant: 'success' },
  examiner_assigned: { label: 'Penguji Ditetapkan', variant: 'outline' },
  scheduled: { label: 'Dijadwalkan', variant: 'default' },
  passed: { label: 'Lulus', variant: 'success' },
  passed_with_revision: { label: 'Lulus dengan Revisi', variant: 'default' },
  failed: { label: 'Tidak Lulus', variant: 'destructive' },
  cancelled: { label: 'Dibatalkan', variant: 'destructive' },
};

export function DefenceStatusBadge({ status }: { status: ThesisDefenceStatus }) {
  const meta = STATUS_META[status];
  return <Badge variant={meta.variant}>{meta.label}</Badge>;
}

export function getDefenceStatusFilterOptions() {
  return [
    { label: 'Semua', value: '' },
    { label: 'Terdaftar', value: 'registered' },
    { label: 'Terverifikasi', value: 'verified' },
    { label: 'Penguji Ditetapkan', value: 'examiner_assigned' },
    { label: 'Dijadwalkan', value: 'scheduled' },
    { label: 'Selesai', value: 'finished' },
  ];
}
