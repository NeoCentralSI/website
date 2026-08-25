import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateOnlyId } from '@/lib/text';
import { cn } from '@/lib/utils';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Terdaftar (Proses Verifikasi)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  eligible: { label: 'Eligibel', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  appointed: { label: 'Peserta Yudisium (Ditetapkan)', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  finalized: { label: 'Lulus Yudisium', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Tidak Memenuhi Persyaratan', className: 'bg-red-50 text-red-700 border-red-200' },
};

interface StudentYudisiumHistoryCardProps {
  index: number;
  item: any;
  onClick: () => void;
}

export function StudentYudisiumHistoryCard({
  index,
  item,
  onClick,
}: StudentYudisiumHistoryCardProps) {
  const statusInfo = PARTICIPANT_STATUS_MAP[item.status] || { label: item.status, className: '' };

  return (
    <div className="grid min-w-[820px] grid-cols-[48px_minmax(200px,1.5fr)_minmax(150px,1fr)_minmax(120px,0.8fr)_minmax(145px,1fr)_104px] items-center gap-4 border-b border-gray-200 px-4 py-3 last:border-b-0 hover:bg-muted/30">
      <span className="text-center text-sm text-muted-foreground">{index}</span>

      <div className="min-w-0 flex flex-col">
        <div className="truncate text-sm font-medium text-foreground">
          {item.yudisiumName}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">
          {formatDateOnlyId(item.registrationOpenDate)} – {formatDateOnlyId(item.registrationCloseDate)}
        </div>
      </div>

      <div className="truncate text-sm text-foreground">
        {formatDateOnlyId(item.eventDate)}
      </div>

      <div>
        <Badge variant="outline" className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", statusInfo.className)}>
          {statusInfo.label}
        </Badge>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={onClick}>
        <Eye className="mr-2 h-4 w-4" />
        Detail
      </Button>
    </div>
  );
}
