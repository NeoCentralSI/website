import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAssessmentForm, useSubmitScore } from '@/hooks/research-method/useResearchMethod';
import type { AssessmentCriterion, AssessmentView, AssessorParty, ScoreInput } from '@/types/research-method.types';

type Entry = { rubricId: string; score: string };

/** Why a criterion's entry is not valid yet, or null (mirrors the server rules, R22). */
export function getEntryProblem(criterion: AssessmentCriterion, entry: Entry | undefined): string | null {
  if (!entry || entry.score.trim() === '') return 'Nilai belum diisi.';
  const score = Number(entry.score);
  if (!Number.isInteger(score)) return 'Nilai harus bilangan bulat.';
  if (score < 0 || score > criterion.maxScore) return `Nilai 0–${criterion.maxScore}.`;
  if (criterion.rubrics.length > 0) {
    const rubric = criterion.rubrics.find((r) => r.id === entry.rubricId);
    if (!rubric) return 'Pilih tingkat rubrik.';
    if (score < rubric.minScore || score > rubric.maxScore) return `Nilai harus ${rubric.minScore}–${rubric.maxScore} untuk rubrik ini.`;
  }
  return null;
}

const PARTY_TITLE: Record<AssessorParty, string> = { supervisor: 'Nilai Proposal (Pembimbing)', coordinator: 'Nilai Proposal (Koordinator)' };

interface Props {
  row: AssessmentView | null;
  party: AssessorParty;
  onOpenChange: (open: boolean) => void;
}

/**
 * Form Penilaian Proposal satu pihak (10.2): nilai per kriteria CPMK dengan tingkat rubrik.
 * Nilai terkunci setelah dikirim (R23); nilai akhir terbentuk ketika kedua pihak sudah mengirim.
 */
export function ScoreFormDialog({ row, party, onOpenChange }: Props) {
  const yearId = row?.academicYear?.id ?? null;
  const { data: form, isLoading, error } = useAssessmentForm(party, yearId, Boolean(row));
  const submit = useSubmitScore();
  const [entries, setEntries] = useState<Record<string, Entry>>({});
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (row) {
      setEntries({});
      setConfirm(false);
    }
  }, [row]);

  const problems = useMemo(
    () => (form?.criteria ?? []).map((c) => [c.id, getEntryProblem(c, entries[c.id])] as const),
    [form, entries],
  );
  const firstProblem = problems.find(([, p]) => p)?.[1] ?? null;
  const total = (form?.criteria ?? []).reduce((sum, c) => sum + (Number(entries[c.id]?.score) || 0), 0);

  const setEntry = (id: string, patch: Partial<Entry>) =>
    setEntries((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { rubricId: '', score: '' }), ...patch } }));

  const send = () => {
    if (!row?.id || !form || firstProblem) return;
    const scores: ScoreInput[] = form.criteria.map((c) => ({
      criteriaId: c.id,
      rubricId: entries[c.id]?.rubricId || null,
      score: Number(entries[c.id]?.score),
    }));
    submit.mutate({ id: row.id, party, scores }, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{PARTY_TITLE[party]}</DialogTitle>
          <DialogDescription>
            {row?.student.fullName} ({row?.student.identityNumber}) · {row?.thesis.title || 'Judul belum ditentukan'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
        ) : error || !form ? (
          <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Form penilaian tidak tersedia.'}</p>
        ) : form.criteria.length === 0 ? (
          <p className="text-sm text-muted-foreground">Kriteria penilaian periode ini belum dikonfigurasi Sekretaris Departemen.</p>
        ) : (
          <div className="space-y-4">
            {form.criteria.map((criterion) => {
              const entry = entries[criterion.id];
              const problem = problems.find(([id]) => id === criterion.id)?.[1];
              return (
                <div key={criterion.id} className="space-y-2 rounded-lg border p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium">{criterion.name}</p>
                    <span className="text-xs text-muted-foreground">{criterion.cpmk.code} · maks {criterion.maxScore}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
                    {criterion.rubrics.length > 0 ? (
                      <Select value={entry?.rubricId ?? ''} onValueChange={(value) => setEntry(criterion.id, { rubricId: value })}>
                        <SelectTrigger aria-label={`Rubrik ${criterion.name}`}>
                          <SelectValue placeholder="Pilih tingkat rubrik" />
                        </SelectTrigger>
                        <SelectContent>
                          {criterion.rubrics.map((rubric) => (
                            <SelectItem key={rubric.id} value={rubric.id}>
                              {rubric.minScore}–{rubric.maxScore}: {rubric.description}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="self-center text-xs text-muted-foreground">Tanpa rubrik</span>
                    )}
                    <div>
                      <Label htmlFor={`score-${criterion.id}`} className="sr-only">Nilai {criterion.name}</Label>
                      <Input
                        id={`score-${criterion.id}`}
                        inputMode="numeric"
                        value={entry?.score ?? ''}
                        onChange={(e) => setEntry(criterion.id, { score: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder={`0–${criterion.maxScore}`}
                      />
                    </div>
                  </div>
                  {entry && problem && <p className="text-xs text-destructive">{problem}</p>}
                </div>
              );
            })}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span>Total {total} dari bobot {form.weight}</span>
              <span className="text-muted-foreground">Nilai minimum lulus periode ini: {form.minimumScore}</span>
            </div>
            {confirm && (
              <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Nilai yang sudah dikirim terkunci dan tidak dapat diubah. Kirim sekarang?
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
          <span title={firstProblem ?? undefined}>
            <Button
              disabled={!form || form.criteria.length === 0 || Boolean(firstProblem) || submit.isPending}
              onClick={() => (confirm ? send() : setConfirm(true))}
            >
              {submit.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirm ? 'Ya, Kirim Nilai' : 'Kirim Nilai'}
            </Button>
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
