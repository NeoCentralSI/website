import { Eye } from 'lucide-react';

import { TableIconAction } from '@/components/shared/TableIconAction';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateAbbrId, formatDateRangeShort } from '@/lib/text';
import { cn } from '@/lib/utils';

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: { label: 'Terdaftar (Proses Verifikasi)', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  eligible: { label: 'Eligibel', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  appointed: { label: 'Peserta Yudisium (Ditetapkan)', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  finalized: { label: 'Lulus Yudisium', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Tidak Memenuhi Persyaratan', className: 'bg-red-50 text-red-700 border-red-200' },
};

interface YudisiumHistoryRow {
  id: string;
  yudisiumId?: string | null;
  yudisiumName?: string | null;
  registrationOpenDate?: string | null;
  registrationCloseDate?: string | null;
  eventDate?: string | null;
  status?: string | null;
}

/** Registrations in earlier yudisium periods, in the standard table, without pagination. */
export function StudentYudisiumHistoryTable({ items, onDetail }: { items: YudisiumHistoryRow[]; onDetail: (id: string, yudisiumId: string) => void }) {
  return (
    <div className="overflow-x-auto border-t border-gray-200">
      <Table className="min-w-[680px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 56 }} className="text-center">No</TableHead>
            <TableHead>Periode Yudisium</TableHead>
            <TableHead style={{ width: 170 }} className="whitespace-normal">Rentang Pendaftaran</TableHead>
            <TableHead style={{ width: 120 }}>Pelaksanaan</TableHead>
            <TableHead style={{ width: 220 }}>Status</TableHead>
            <TableHead style={{ width: 64 }} className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const status = PARTICIPANT_STATUS_MAP[item.status ?? ""] || { label: item.status || "-", className: '' };
            return (
              <TableRow key={item.id}>
                <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="truncate font-medium" title={item.yudisiumName ?? undefined}>{item.yudisiumName || "-"}</TableCell>
                <TableCell className="whitespace-normal break-words">{formatDateRangeShort(item.registrationOpenDate, item.registrationCloseDate)}</TableCell>
                <TableCell className="whitespace-normal">{formatDateAbbrId(item.eventDate)}</TableCell>
                <TableCell className="whitespace-normal">
                  <Badge variant="outline" className={cn('max-w-full whitespace-normal rounded-full px-2 py-0.5 text-left text-xs font-semibold', status.className)}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => onDetail(item.id, item.yudisiumId || '')} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
