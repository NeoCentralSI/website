import { Eye } from 'lucide-react';

import { TableIconAction } from '@/components/shared/TableIconAction';
import { ThesisEventStatusBadge, type ThesisEventStatus } from '@/components/shared/ThesisEventStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateAbbrId, toTitleCaseName } from '@/lib/text';

/** A failed or cancelled Seminar Hasil or Sidang attempt. */
export interface ThesisEventHistoryRow {
  id: string;
  status: ThesisEventStatus;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { name: string } | null;
  meetingLink: string | null;
  finalScore: number | null;
  examiners: { order: number; lecturerName: string }[];
}

function formatTimeRange(startTime: string | null, endTime: string | null): string {
  if (!startTime || !endTime) return '';
  const time = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
  return `${time(startTime)} – ${time(endTime)} WIB`;
}

/** The earlier attempts of a Seminar Hasil or Sidang, in the standard table, without pagination. */
export function ThesisEventHistoryTable({ items, onDetail }: { items: ThesisEventHistoryRow[]; onDetail: (id: string) => void }) {
  return (
    <div className="overflow-x-auto border-t border-gray-200">
      <Table className="min-w-[760px] table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 56 }} className="text-center">No</TableHead>
            <TableHead>Dosen Penguji</TableHead>
            <TableHead style={{ width: 150 }}>Tanggal</TableHead>
            <TableHead style={{ width: 150 }}>Ruangan</TableHead>
            <TableHead style={{ width: 80 }}>Nilai</TableHead>
            <TableHead style={{ width: 160 }}>Status</TableHead>
            <TableHead style={{ width: 64 }} className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const timeRange = formatTimeRange(item.startTime, item.endTime);
            const place = item.room ? item.room.name : item.meetingLink ? 'Daring' : '-';
            return (
              <TableRow key={item.id}>
                <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                <TableCell className="min-w-0">
                  {item.examiners.length > 0
                    ? item.examiners.map((examiner) => (
                        <div key={examiner.order} className="truncate" title={toTitleCaseName(examiner.lecturerName)}>
                          {toTitleCaseName(examiner.lecturerName)}
                        </div>
                      ))
                    : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="whitespace-normal">
                  {item.date ? (
                    <>
                      <div>{formatDateAbbrId(item.date)}</div>
                      {timeRange && <div className="mt-0.5 text-xs text-muted-foreground">{timeRange}</div>}
                    </>
                  ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="truncate" title={place}>{place}</TableCell>
                <TableCell className="font-semibold">{item.finalScore !== null ? item.finalScore.toFixed(2) : '-'}</TableCell>
                <TableCell><ThesisEventStatusBadge status={item.status} /></TableCell>
                <TableCell className="text-center">
                  <TableIconAction icon={Eye} label="Lihat Detail" onClick={() => onDetail(item.id)} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
