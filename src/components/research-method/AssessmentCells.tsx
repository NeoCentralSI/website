import { Badge } from '@/components/ui/badge';
import { getResearchMethodResultLabel, getResearchMethodResultVariant } from '@/lib/thesisLabels';
import type { AssessmentView } from '@/types/research-method.types';

/** Nilai satu pihak: angka bila sudah dikirim, "Belum" bila belum. */
export function PartyScoreCell({ score }: { score: number | null | undefined }) {
  return score == null ? <span className="text-muted-foreground">Belum</span> : <span className="font-medium">{score}</span>;
}

/** Nilai akhir dan hasil (label, tidak pernah enum mentah). */
export function ResultCell({ row }: { row: Pick<AssessmentView, 'isFinalized' | 'finalScore' | 'result'> }) {
  if (!row.isFinalized) return <span className="text-muted-foreground">Belum final</span>;
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="font-medium">{row.finalScore ?? '-'}</span>
      {row.result && <Badge variant={getResearchMethodResultVariant(row.result)}>{getResearchMethodResultLabel(row.result)}</Badge>}
    </span>
  );
}
