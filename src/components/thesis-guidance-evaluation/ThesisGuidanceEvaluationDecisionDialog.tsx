import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useDecideEvaluation } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { toTitleCaseName } from '@/lib/text';
import { GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS, getGuidanceEvaluationRecommendationLabel } from '@/lib/thesisLabels';
import type { ThesisGuidanceEvaluation } from '@/types/thesis-guidance-evaluation.types';

export type EvaluationDecisionState = { evaluation: ThesisGuidanceEvaluation; approve: boolean } | null;

/**
 * Ketua Departemen: approving applies the supervisor's recommendation; rejecting needs notes
 * and changes nothing.
 */
export function ThesisGuidanceEvaluationDecisionDialog({ state, onClose, onDone }: {
  state: EvaluationDecisionState;
  onClose: () => void;
  onDone?: () => void;
}) {
  const decide = useDecideEvaluation();
  const [notes, setNotes] = useState('');
  useEffect(() => { if (state) setNotes(''); }, [state]);

  if (!state) return null;
  const notesMissing = !state.approve && !notes.trim();

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{state.approve ? 'Setujui evaluasi?' : 'Tolak evaluasi?'}</DialogTitle>
          <DialogDescription>
            {state.approve
              ? `Keputusan pembimbing "${getGuidanceEvaluationRecommendationLabel(state.evaluation.recommendation)}" untuk ${toTitleCaseName(state.evaluation.student?.name) || 'mahasiswa'} diterapkan. ${GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[state.evaluation.recommendation]}`
              : 'Evaluasi ditolak tanpa akibat apa pun. Pembimbing dapat mengisi evaluasi baru.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="evaluation-decision-notes">{state.approve ? 'Catatan (opsional)' : 'Catatan penolakan'}</Label>
          <Textarea id="evaluation-decision-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
          {notesMissing && <p className="text-xs text-muted-foreground">Catatan penolakan wajib diisi.</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={decide.isPending}>Batal</Button>
          <Button
            variant={state.approve ? 'default' : 'destructive'}
            disabled={decide.isPending || notesMissing}
            onClick={() =>
              decide.mutate(
                { evaluationId: state.evaluation.id, approve: state.approve, notes: notes.trim() || null },
                { onSuccess: () => { onClose(); onDone?.(); } },
              )
            }
          >
            {decide.isPending && <Spinner className="mr-2 h-4 w-4" />}
            {state.approve ? 'Setujui' : 'Tolak'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
