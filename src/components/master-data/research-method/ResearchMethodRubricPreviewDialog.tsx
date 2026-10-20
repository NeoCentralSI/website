import { useMemo } from "react";

import { ProposalScoreForm } from "@/components/research-method/ProposalScoreForm";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ResearchMethodAssessor, ResearchMethodCpmkWithRubrics } from "@/services/researchMethodAssessment.service";
import type { AssessmentCriterion } from "@/types/research-method.types";

const PARTY_LABEL: Record<ResearchMethodAssessor, string> = {
  supervisor: "Dosen Pembimbing",
  coordinator: "Koordinator Metode Penelitian",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cpmks: ResearchMethodCpmkWithRubrics[];
  assessor: ResearchMethodAssessor;
  /** Both parties' maximum scores; the final score is their sum. */
  supervisorTotal: number;
  coordinatorTotal: number;
  minimumPassingScore: number;
}

/** The configured criteria of one party in the shape of the score form. */
export function toFormCriteria(cpmks: ResearchMethodCpmkWithRubrics[]): AssessmentCriterion[] {
  return cpmks
    .filter((cpmk) => cpmk.assessmentCriterias.length > 0)
    .flatMap((cpmk) => cpmk.assessmentCriterias.map((criterion) => ({
      id: criterion.id,
      name: criterion.name,
      maxScore: Number(criterion.maxScore || 0),
      cpmk: { id: cpmk.id, code: cpmk.code, description: cpmk.description },
      rubrics: criterion.assessmentRubrics.map((rubric) => ({ id: rubric.id, minScore: rubric.minScore, maxScore: rubric.maxScore, description: rubric.description })),
    })));
}

/**
 * "Pratinjau Form Penilaian" of Kelola > Metode Penelitian: the score form one party fills in
 * Penilaian Proposal, the same component in preview mode (typing works, nothing is saved).
 */
export function ResearchMethodRubricPreviewDialog({ open, onOpenChange, cpmks, assessor, supervisorTotal, coordinatorTotal, minimumPassingScore }: Props) {
  const criteria = useMemo(() => toFormCriteria(cpmks), [cpmks]);
  const weight = criteria.reduce((sum, c) => sum + c.maxScore, 0);
  const label = PARTY_LABEL[assessor];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Pratinjau Form Penilaian Proposal ({label})</DialogTitle>
          <DialogDescription>
            Pembimbing {supervisorTotal} + Koordinator {coordinatorTotal} = maks. {supervisorTotal + coordinatorTotal}; lulus bila nilai akhir minimal {minimumPassingScore}.
          </DialogDescription>
        </DialogHeader>
        <ProposalScoreForm party={assessor} criteria={criteria} weight={weight} minimumScore={minimumPassingScore} mode="preview" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
