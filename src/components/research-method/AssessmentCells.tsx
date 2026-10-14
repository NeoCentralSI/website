import { Badge } from '@/components/ui/badge';
import { getResearchMethodResultLabel, getResearchMethodResultVariant } from '@/lib/thesisLabels';
import type { AssessmentView } from '@/types/research-method.types';

/** "93,8%" from a 0..1 share. */
export function formatAttendance(value: number | null | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${(Math.round(value * 1000) / 10).toLocaleString('id-ID')}%`;
}

export function AttendanceCell({ row }: { row: Pick<AssessmentView, 'attendance' | 'attendanceAutoZeroed'> }) {
  if (!row.attendance) return <span className="text-muted-foreground">-</span>;
  return (
    <span className={row.attendance.isEligible ? undefined : 'font-medium text-destructive'}>
      {formatAttendance(row.attendance.attendancePercentage)}
    </span>
  );
}

/** Nilai satu pihak: angka bila sudah dikirim, "Belum" bila belum. */
export function PartyScoreCell({ score }: { score: number | null | undefined }) {
  return score == null ? <span className="text-muted-foreground">Belum</span> : <span className="font-medium">{score}</span>;
}

/** Nilai akhir dan hasil (label, tidak pernah enum mentah). */
export function ResultCell({ row }: { row: Pick<AssessmentView, 'isFinalized' | 'finalScore' | 'result' | 'attendanceAutoZeroed'> }) {
  if (!row.isFinalized) return <span className="text-muted-foreground">Belum final</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="font-medium">{row.finalScore ?? '-'}</span>
      {row.result && <Badge variant={getResearchMethodResultVariant(row.result)}>{getResearchMethodResultLabel(row.result)}</Badge>}
      {row.attendanceAutoZeroed && <span className="text-xs text-muted-foreground">(presensi &lt; 75%)</span>}
    </span>
  );
}
