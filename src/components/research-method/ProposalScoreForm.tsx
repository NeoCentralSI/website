import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { focusFirstInvalid } from '@/components/shared/RequiredField';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTimeWib, formatLecturerName, toTitleCaseName } from '@/lib/text';
import { cn } from '@/lib/utils';
import type { AssessmentCriterion, AssessorParty, OtherPartyScore, OwnScoreStatus, ScoreInput } from '@/types/research-method.types';

export const PARTY_LABEL: Record<AssessorParty, string> = { supervisor: 'Pembimbing', coordinator: 'Koordinator' };
export const PREVIEW_REASON = 'Pratinjau: nilai tidak disimpan.';

type FormCriterion = AssessmentCriterion & { score?: number | null };

/** Why a score entry is not valid, or null. An empty entry is only refused when sending. */
export function getScoreProblem(criterion: Pick<AssessmentCriterion, 'maxScore'>, value: string, required: boolean): string | null {
  const text = value.trim();
  if (text === '') return required ? 'Nilai belum diisi.' : null;
  const score = Number(text);
  if (!Number.isInteger(score)) return 'Nilai harus bilangan bulat.';
  if (score < 0 || score > criterion.maxScore) return `Nilai 0–${criterion.maxScore}.`;
  return null;
}

/** The criteria grouped by CPMK, in the order they come (the order of the master data). */
export function groupByCpmk<T extends Pick<AssessmentCriterion, 'cpmk'>>(criteria: T[]) {
  const groups: { cpmk: AssessmentCriterion['cpmk']; criteria: T[] }[] = [];
  for (const criterion of criteria) {
    const group = groups.find((g) => g.cpmk.id === criterion.cpmk.id);
    if (group) group.criteria.push(criterion);
    else groups.push({ cpmk: criterion.cpmk, criteria: [criterion] });
  }
  return groups;
}

/** The final score once both parties have sent: the other party's sent score plus this one. */
export function previewFinalScore(ownTotal: number, other: Pick<OtherPartyScore, 'submitted' | 'total'> | null | undefined, minimumScore: number) {
  if (!other?.submitted || other.total == null) return null;
  const finalScore = ownTotal + other.total;
  return { finalScore, passes: finalScore >= minimumScore };
}

const fieldId = (criterionId: string) => `nilai-${criterionId}`;
const sumOf = (values: number[]) => values.reduce((sum, value) => sum + value, 0);

const STATUS_BADGE: Record<OwnScoreStatus | 'preview', { label: string; variant: 'success' | 'warning' | 'secondary' | 'outline' }> = {
  submitted: { label: 'Terkirim (Terkunci)', variant: 'success' },
  draft: { label: 'Draf', variant: 'warning' },
  empty: { label: 'Belum diisi', variant: 'secondary' },
  preview: { label: 'Pratinjau', variant: 'outline' },
};

interface Props {
  party: AssessorParty;
  criteria: FormCriterion[];
  weight: number;
  minimumScore: number;
  /** `preview`: Sekretaris Departemen's view of the rubric (typing works, nothing is saved). */
  mode: 'edit' | 'preview';
  assessorName?: string | null;
  ownStatus?: OwnScoreStatus;
  ownSubmittedAt?: string | null;
  other?: OtherPartyScore | null;
  /** Why this assessor cannot score now (the inputs and buttons are disabled). */
  blockReason?: string | null;
  pending?: boolean;
  onSaveDraft?: (scores: ScoreInput[]) => void;
  onSubmit?: (scores: ScoreInput[]) => void;
}

/**
 * The Penilaian Proposal form of one party, in the form of the Sidang TA examiner form: criteria per
 * CPMK with their rubric as a reference and one whole-number score each, the total and the CPMK
 * totals on the right, "Simpan Draf" (as often as needed) and "Kirim Nilai" (locks the score, after
 * a confirmation with the summary). The other party's sent score is shown read-only, with the final
 * score it makes with this form. The same form previews the rubric for the Sekretaris Departemen.
 */
export function ProposalScoreForm({
  party,
  criteria,
  weight,
  minimumScore,
  mode,
  assessorName,
  ownStatus = 'empty',
  ownSubmittedAt,
  other,
  blockReason,
  pending = false,
  onSaveDraft,
  onSubmit,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [showRequired, setShowRequired] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const submitted = ownStatus === 'submitted';
  const locked = submitted || Boolean(blockReason);
  const preview = mode === 'preview';

  useEffect(() => {
    setValues(Object.fromEntries(criteria.map((c) => [c.id, c.score == null ? '' : String(c.score)])));
    setShowRequired(false);
  }, [criteria]);

  const groups = useMemo(() => groupByCpmk(criteria), [criteria]);
  const problems = useMemo(
    () => Object.fromEntries(criteria.map((c) => [fieldId(c.id), getScoreProblem(c, values[c.id] ?? '', showRequired)])),
    [criteria, values, showRequired],
  );
  const scoreOf = (id: string) => {
    const value = Number(values[id]);
    return values[id]?.trim() && Number.isFinite(value) ? value : 0;
  };
  const total = sumOf(criteria.map((c) => scoreOf(c.id)));
  const final = previewFinalScore(total, other, minimumScore);
  const otherLabel = PARTY_LABEL[party === 'supervisor' ? 'coordinator' : 'supervisor'];
  const badge = STATUS_BADGE[preview ? 'preview' : ownStatus];
  const disabledReason = preview ? PREVIEW_REASON : blockReason ?? undefined;

  const filled = (): ScoreInput[] => criteria
    .filter((c) => (values[c.id] ?? '').trim() !== '')
    .map((c) => ({ criteriaId: c.id, score: Number(values[c.id]) }));

  const saveDraft = () => {
    const invalid = Object.fromEntries(criteria.map((c) => [fieldId(c.id), getScoreProblem(c, values[c.id] ?? '', false)]));
    if (Object.values(invalid).some(Boolean)) {
      focusFirstInvalid(criteria.map((c) => fieldId(c.id)), invalid);
      return;
    }
    onSaveDraft?.(filled());
  };

  const askSubmit = () => {
    setShowRequired(true);
    const required = Object.fromEntries(criteria.map((c) => [fieldId(c.id), getScoreProblem(c, values[c.id] ?? '', true)]));
    if (Object.values(required).some(Boolean)) {
      focusFirstInvalid(criteria.map((c) => fieldId(c.id)), required);
      return;
    }
    setConfirming(true);
  };

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="gap-0 border-gray-200 py-0 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-gray-200 py-3">
          <CardTitle className="text-base font-semibold">Form Penilaian Proposal ({PARTY_LABEL[party]})</CardTitle>
          {assessorName && (
            <span className="text-xs text-muted-foreground">
              Penilai: <span className="font-semibold text-foreground">{toTitleCaseName(assessorName)}</span>
            </span>
          )}
        </CardHeader>
        <CardContent className="divide-y p-0">
          {groups.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">Kriteria penilaian semester ini belum diatur Sekretaris Departemen.</p>
          )}
          {groups.map((group, groupIndex) => {
            const groupMax = sumOf(group.criteria.map((c) => c.maxScore));
            return (
              <div key={group.cpmk.id}>
                <div className="bg-muted/20 px-4 py-3">
                  <h3 className="text-sm font-bold text-foreground">
                    {String.fromCharCode(65 + groupIndex)} · {group.cpmk.code}{' '}
                    <span className="text-xs font-normal text-muted-foreground">(maks. {groupMax})</span>
                  </h3>
                  {group.cpmk.description && <p className="mt-0.5 text-xs text-muted-foreground">{group.cpmk.description}</p>}
                </div>
                <div className="divide-y">
                  {group.criteria.map((criterion, index) => {
                    const problem = problems[fieldId(criterion.id)];
                    return (
                      <div key={criterion.id} id={fieldId(criterion.id)} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 space-y-2">
                          <Label htmlFor={`${fieldId(criterion.id)}-input`} className="text-sm font-medium leading-relaxed">
                            ({String.fromCharCode(97 + index)}) {criterion.name}
                          </Label>
                          {criterion.rubrics.length > 0 && (
                            <table className="w-full rounded-md border border-gray-200 text-xs" aria-label={`Rubrik ${criterion.name}`}>
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                  <th className="w-28 px-3 py-1.5 text-left font-semibold text-muted-foreground">Rentang Skor</th>
                                  <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Deskripsi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {criterion.rubrics.map((rubric) => (
                                  <tr key={rubric.id} className="border-b last:border-0">
                                    <td className="whitespace-nowrap px-3 py-1.5 font-semibold">{rubric.minScore} – {rubric.maxScore}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{rubric.description}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Input
                              id={`${fieldId(criterion.id)}-input`}
                              inputMode="numeric"
                              value={values[criterion.id] ?? ''}
                              disabled={locked}
                              aria-invalid={Boolean(problem)}
                              placeholder={`0–${criterion.maxScore}`}
                              className={cn('h-8 w-20 text-right text-sm font-semibold', problem && 'border-red-500 text-red-600 focus-visible:ring-red-500')}
                              onChange={(event) => setValues((prev) => ({ ...prev, [criterion.id]: event.target.value.replace(/[^0-9]/g, '') }))}
                            />
                            <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
                          </div>
                          {problem && <span role="alert" className="text-[11px] font-medium text-red-600">{problem}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Card className="items-center gap-0 border-gray-200 p-6 text-center shadow-none">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total Skor ({PARTY_LABEL[party]})</span>
          <span className="mt-2 text-5xl font-black text-foreground" aria-label="Total skor">{total}</span>
          <span className="mt-1 text-xs font-semibold text-muted-foreground">/ {weight}</span>
          <Badge className="mt-4 font-semibold" variant={badge.variant}>{badge.label}</Badge>
          {submitted && ownSubmittedAt && <span className="mt-2 text-[11px] text-muted-foreground">Dikirim {formatDateTimeWib(ownSubmittedAt)}</span>}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Nilai minimum lulus (nilai akhir): <span className="font-semibold text-foreground">{minimumScore}</span>
          </p>
        </Card>

        <Card className="gap-3 border-gray-200 p-4 shadow-none">
          <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Rincian CPMK</h4>
          <div className="divide-y text-xs">
            {groups.map((group) => (
              <div key={group.cpmk.id} className="flex justify-between py-2 font-semibold">
                <span className="text-muted-foreground">{group.cpmk.code}</span>
                <span className="font-bold text-foreground">
                  {sumOf(group.criteria.map((c) => scoreOf(c.id)))} <span className="font-normal text-muted-foreground">/ {sumOf(group.criteria.map((c) => c.maxScore))}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>

        {!preview && other && (
          <Card className="gap-3 border-gray-200 p-4 shadow-none" aria-label={`Nilai ${otherLabel}`}>
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Nilai {otherLabel}</h4>
            {other.submitted ? (
              <>
                <p className="text-sm">
                  <span className="text-2xl font-bold text-foreground">{other.total}</span>
                  <span className="text-muted-foreground"> / {other.weight}</span>
                </p>
                {(other.name || other.submittedAt) && (
                  <p className="text-[11px] text-muted-foreground">
                    {[other.name ? formatLecturerName(other.name) : null, other.submittedAt ? formatDateTimeWib(other.submittedAt) : null].filter(Boolean).join(' · ')}
                  </p>
                )}
                <ul className="divide-y text-xs">
                  {other.criteria.map((c) => (
                    <li key={c.id} className="flex justify-between gap-2 py-1.5">
                      <span className="min-w-0 truncate text-muted-foreground" title={`${c.cpmkCode} · ${c.name}`}>{c.name}</span>
                      <span className="shrink-0 font-semibold">{c.score ?? '-'} <span className="font-normal text-muted-foreground">/ {c.maxScore}</span></span>
                    </li>
                  ))}
                </ul>
                {final && (
                  <div className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                    <p className="text-muted-foreground">Pratinjau nilai akhir</p>
                    <p className="mt-0.5 text-sm font-semibold">
                      {party === 'supervisor' ? `${total} + ${other.total}` : `${other.total} + ${total}`} = {final.finalScore}
                    </p>
                    <Badge className="mt-1" variant={final.passes ? 'success' : 'destructive'}>
                      {final.passes ? 'Mencapai nilai minimum' : 'Di bawah nilai minimum'}
                    </Badge>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">{otherLabel} belum mengirim nilai. Nilai akhir terbentuk setelah kedua pihak mengirim.</p>
            )}
          </Card>
        )}

        {!submitted && (
          <div className="flex flex-col gap-3">
            {blockReason && !preview && <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{blockReason}</p>}
            <span title={disabledReason} className="inline-flex w-full">
              <Button type="button" variant="outline" className="w-full" disabled={preview || locked || pending} onClick={saveDraft}>
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Simpan Draf
              </Button>
            </span>
            <span title={disabledReason} className="inline-flex w-full">
              <Button type="button" className="w-full" disabled={preview || locked || pending} onClick={askSubmit}>
                Kirim Nilai
              </Button>
            </span>
          </div>
        )}
      </div>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kirim Nilai {PARTY_LABEL[party]}?</AlertDialogTitle>
            <AlertDialogDescription>Nilai yang sudah dikirim terkunci dan tidak dapat diubah.</AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="space-y-1 rounded-md border p-3 text-sm" aria-label="Ringkasan nilai">
            {groups.map((group) => (
              <div key={group.cpmk.id} className="flex justify-between">
                <dt className="text-muted-foreground">{group.cpmk.code}</dt>
                <dd>{sumOf(group.criteria.map((c) => scoreOf(c.id)))} / {sumOf(group.criteria.map((c) => c.maxScore))}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t pt-1 font-semibold">
              <dt>Total {PARTY_LABEL[party]}</dt>
              <dd>{total} / {weight}</dd>
            </div>
            <div className="pt-1 text-xs text-muted-foreground">
              {final
                ? `Nilai akhir ${final.finalScore} (minimum ${minimumScore}): ${final.passes ? 'lulus, dan tugas akhir langsung masuk fase Penelitian.' : 'tidak lulus.'}`
                : `Nilai akhir terbentuk setelah ${otherLabel.toLowerCase()} mengirim nilai.`}
            </div>
          </dl>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => onSubmit?.(filled())}>Kirim Nilai</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
