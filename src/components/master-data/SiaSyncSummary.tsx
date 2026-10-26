import { Info } from 'lucide-react';

import type { SiaSyncStatus } from '@/services/sia.service';
import { formatDateTimeWib } from '@/lib/text';

const num = (value: number | string | undefined) => Number(value ?? 0) || 0;

/** The lines of a sync summary, in plain Indonesian (shared by the toast and the box). */
export function siaSyncSummaryLines(summary: Partial<SiaSyncStatus>): string[] {
  const lines = [
    `${num(summary.fetched)} mahasiswa dibaca dari SIA${summary.period ? ` (semester ${summary.period})` : ''}`,
    `${num(summary.notFound)} tidak ditemukan di NeoCentral`,
    `${num(summary.statusChanged)} status mahasiswa berubah`,
    `${num(summary.gpaChanged)} IPK berubah`,
  ];
  if (num(summary.periodFlagsSkipped) > 0) {
    lines.push(`Penanda semester tidak diperbarui karena semester berbeda (${summary.periodMismatch || 'periode SIA berbeda'})`);
  } else {
    lines.push(`${num(summary.periodFlagsCreated) + num(summary.periodFlagsUpdated)} penanda semester diperbarui`);
  }
  if (num(summary.periodFlagsKeptAdmin) > 0) lines.push(`${num(summary.periodFlagsKeptAdmin)} penanda isian Admin dipertahankan`);
  if (num(summary.failedStudents) > 0) lines.push(`${num(summary.failedStudents)} mahasiswa gagal diproses`);
  return lines;
}

/** "Sinkronisasi terakhir" on Data Mahasiswa: when it ran and what it changed. */
export function SiaSyncSummary({ status }: { status?: SiaSyncStatus | null }) {
  if (!status?.lastRun) return null;
  return (
    <div role="note" className="rounded-lg border border-gray-200 bg-muted/40 p-3 text-sm">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="font-medium">Sinkronisasi SIA terakhir: {formatDateTimeWib(status.lastRun)}</p>
          {status.error ? (
            <p className="text-destructive">Gagal: {status.error}</p>
          ) : (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
              {siaSyncSummaryLines(status).map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
