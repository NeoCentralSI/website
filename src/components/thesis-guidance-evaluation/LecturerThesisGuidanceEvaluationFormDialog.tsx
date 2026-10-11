import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { useSubmitEvaluation } from '@/hooks/thesis-guidance-evaluation/useThesisGuidanceEvaluation';
import { formatDateShortId } from '@/lib/text';
import {
  GUIDANCE_EVALUATION_OBSERVATION_LABELS,
  GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS,
  GUIDANCE_EVALUATION_RECOMMENDATION_LABELS,
  getGuidanceEvaluationStageLabel,
  getThesisActivityLabel,
  type GuidanceEvaluationObservation,
  type GuidanceEvaluationRecommendation,
} from '@/lib/thesisLabels';
import type { ThesisGuidanceEvaluationContext } from '@/types/thesis-guidance-evaluation.types';

const OBSERVATIONS = Object.keys(GUIDANCE_EVALUATION_OBSERVATION_LABELS) as GuidanceEvaluationObservation[];
const NO_OBSERVATIONS: Record<GuidanceEvaluationObservation, boolean> = {
  noGuidance: false,
  noProgress: false,
  noResponse: false,
  noRevision: false,
};

function Basis({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

/**
 * "Isi Evaluasi": the evaluation form of Pembimbing 1. The basis is filled by the system
 * and read-only; the supervisor ticks observations, writes notes and chooses one of the
 * decisions allowed at this stage.
 */
export function LecturerThesisGuidanceEvaluationFormDialog({ open, onOpenChange, context }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: ThesisGuidanceEvaluationContext;
}) {
  const [observations, setObservations] = useState(NO_OBSERVATIONS);
  const [notes, setNotes] = useState('');
  const [recommendation, setRecommendation] = useState<GuidanceEvaluationRecommendation | ''>('');
  const submit = useSubmitEvaluation();

  useEffect(() => {
    if (open) { setObservations(NO_OBSERVATIONS); setNotes(''); setRecommendation(''); }
  }, [open]);

  const { thesis, basis, stage } = context;
  if (!thesis || !basis || !stage) return null;

  // Continuing at the one-year evaluation must be justified.
  const notesRequired = stage === 'one_year' && recommendation === 'continue';
  const problem = !recommendation
    ? 'Pilih keputusan pembimbing.'
    : notesRequired && !notes.trim()
      ? 'Keterangan wajib diisi untuk melanjutkan bimbingan pada evaluasi 1 tahun.'
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Isi Evaluasi Bimbingan</DialogTitle>
          <DialogDescription>
            {getGuidanceEvaluationStageLabel(stage)} untuk {thesis.student?.name ?? 'mahasiswa'} ({thesis.student?.identityNumber ?? '-'})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <section className="space-y-2">
            <p className="text-sm font-semibold">Dasar evaluasi</p>
            <dl className="grid gap-3 rounded-md bg-muted/50 p-3 sm:grid-cols-2">
              <Basis label="Periode evaluasi" value={getGuidanceEvaluationStageLabel(stage)} />
              <Basis label="Semester mulai bimbingan" value={basis.startSemester ?? '-'} />
              <Basis label="Mulai bimbingan" value={formatDateShortId(basis.supervisionStartedAt)} />
              <Basis label="Masa bimbingan" value={basis.elapsedLabel} />
              <Basis label="Jumlah pertemuan tercatat" value={`${basis.guidanceCount} sesi selesai`} />
              <Basis label="Aktivitas" value={getThesisActivityLabel(basis.activityLevel)} />
            </dl>
            <p className="text-xs text-muted-foreground">Diisi otomatis oleh sistem dan tidak dapat diubah.</p>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">Hasil observasi pembimbing</p>
            <p className="text-xs text-muted-foreground">Boleh lebih dari satu.</p>
            <div className="space-y-2">
              {OBSERVATIONS.map((key) => (
                <div key={key} className="flex items-start gap-2">
                  <Checkbox
                    id={`observation-${key}`}
                    checked={observations[key]}
                    onCheckedChange={(checked) => setObservations({ ...observations, [key]: !!checked })}
                  />
                  <Label htmlFor={`observation-${key}`} className="text-sm font-normal leading-snug cursor-pointer">
                    {GUIDANCE_EVALUATION_OBSERVATION_LABELS[key]}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-1">
              <Label htmlFor="evaluation-notes">Keterangan{notesRequired ? '' : ' (opsional)'}</Label>
              <Textarea id="evaluation-notes" value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-sm font-semibold">Keputusan pembimbing</p>
            <RadioGroup value={recommendation} onValueChange={(value) => setRecommendation(value as GuidanceEvaluationRecommendation)}>
              {context.allowedRecommendations.map((value) => (
                <div key={value} className="flex items-start gap-2">
                  <RadioGroupItem id={`recommendation-${value}`} value={value} className="mt-1" />
                  <Label htmlFor={`recommendation-${value}`} className="cursor-pointer font-normal leading-snug">
                    <span className="block text-sm font-medium">{GUIDANCE_EVALUATION_RECOMMENDATION_LABELS[value]}</span>
                    <span className="block text-xs text-muted-foreground">{GUIDANCE_EVALUATION_RECOMMENDATION_EFFECTS[value]}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </section>

          {problem && <p className="text-xs text-muted-foreground">Belum dapat dikirim: {problem}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submit.isPending}>Batal</Button>
          <Button
            disabled={!!problem || submit.isPending}
            onClick={() => {
              if (!recommendation) return;
              submit.mutate(
                { thesisId: thesis.id, stage, recommendation, observations, notes: notes.trim() || null },
                { onSuccess: () => onOpenChange(false) },
              );
            }}
          >
            {submit.isPending && <Spinner className="mr-2 h-4 w-4" />}
            Kirim Evaluasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
