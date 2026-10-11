import { ThesisGuidanceEvaluationCard } from './ThesisGuidanceEvaluationCard';

/** Supervisor's student detail: guidance evaluations of one thesis ("Isi Evaluasi" for Pembimbing 1). */
export function LecturerThesisGuidanceEvaluationCard({ thesisId, className }: { thesisId: string; className?: string }) {
  return <ThesisGuidanceEvaluationCard thesisId={thesisId} className={className} />;
}
