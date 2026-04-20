import { LecturerDefenceDetailLayout } from '@/components/sidang/LecturerDefenceDetailLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading, Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useDefenceAssessmentForm,
  useSubmitDefenceAssessment,
} from '@/hooks/defence';
import { formatDateTimeId } from '@/lib/text';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

export default function LecturerDefenceDetailAssessment() {
  const { defenceId } = useParams<{ defenceId: string }>();
  const { data: form, isLoading } = useDefenceAssessmentForm(defenceId);
  const submitMutation = useSubmitDefenceAssessment();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [revisionNotes, setRevisionNotes] = useState('');
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!form) return;
    const initial: Record<string, number> = {};
    form.criteriaGroups.forEach((group) => {
      group.criteria.forEach((criterion) => {
        initial[criterion.id] = criterion.score ?? 0;
      });
    });
    setScores(initial);
    if (form.assessorRole === 'examiner') {
      setRevisionNotes(form.examiner?.revisionNotes || '');
    } else {
      setRevisionNotes(form.supervisor?.supervisorNotes || '');
    }
  }, [form]);

  const allCriteria = useMemo(
    () => form?.criteriaGroups.flatMap((group) => group.criteria) ?? [],
    [form],
  );
  const totalScore = useMemo(
    () => Object.values(scores).reduce((sum, value) => sum + Number(value || 0), 0),
    [scores],
  );

  const isSubmitted =
    form?.assessorRole === 'examiner'
      ? !!form?.examiner?.assessmentSubmittedAt
      : !!form?.supervisor?.assessmentSubmittedAt;

  const isLocked = !!form && (form.defence.status !== 'ongoing' || isSubmitted);

  const canSubmit =
    !!form &&
    form.defence.status === 'ongoing' &&
    !isLocked &&
    allCriteria.every((criterion) => {
      const value = scores[criterion.id];
      return Number.isFinite(value) && value >= 0 && value <= criterion.maxScore;
    });

  const toggleRubric = (criterionId: string) => {
    setOpenRubrics((prev) => ({ ...prev, [criterionId]: !prev[criterionId] }));
  };

  const handleSubmit = async () => {
    if (!defenceId || !form || !canSubmit) return;

    try {
      await submitMutation.mutateAsync({
        defenceId,
        payload: {
          scores: allCriteria.map((criterion) => ({
            assessmentCriteriaId: criterion.id,
            score: Number(scores[criterion.id] ?? 0),
          })),
          revisionNotes: form.assessorRole === 'examiner' ? revisionNotes || undefined : undefined,
          supervisorNotes: form.assessorRole === 'supervisor' ? revisionNotes || undefined : undefined,
        },
      });
      toast.success('Penilaian sidang berhasil dikirim.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal mengirim penilaian sidang.');
    }
  };

  return (
    <LecturerDefenceDetailLayout>
      {(detail) => {
        const canAccess =
          ['ongoing', 'passed', 'passed_with_revision', 'failed'].includes(detail.status) &&
          (detail.viewerRole === 'examiner' || detail.viewerRole === 'supervisor');

        if (!canAccess) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Penilaian Sidang Belum Tersedia</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tab penilaian hanya dapat diakses oleh dosen penguji atau dosen pembimbing yang terlibat pada sidang ini.
              </CardContent>
            </Card>
          );
        }

        if (isLoading || !form) {
          return (
            <div className="flex h-40 items-center justify-center">
              <Loading size="lg" text="Memuat form penilaian sidang..." />
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Penilaian Sidang</h2>
              {/* <Badge variant="secondary">
                {form.assessorRole === 'examiner' ? 'Mode Penguji' : 'Mode Pembimbing'}
              </Badge> */}
            </div>

            {isSubmitted && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Penilaian sudah dikirim pada{' '}
                {formatDateTimeId(
                  form.assessorRole === 'examiner'
                    ? form.examiner?.assessmentSubmittedAt
                    : form.supervisor?.assessmentSubmittedAt,
                )}
                .
              </div>
            )}

            {!isSubmitted && form.defence.status !== 'ongoing' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Penilaian dikunci karena sidang sudah tidak dalam status Sedang Berlangsung.
              </div>
            )}

            {form.criteriaGroups.map((group) => (
              <Card key={group.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">
                    {group.code} - {group.description}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.criteria.map((criterion) => {
                    const isOptionB = group.criteria.length === 1 && !String(criterion.name ?? '').trim();
                    return (
                    <div key={criterion.id} className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2 items-start">
                        <div>
                          {!isOptionB && (
                            <Label className="text-sm font-medium">{criterion.name}</Label>
                          )}
                          {isOptionB && (
                            <Label className="text-sm text-muted-foreground">Skor langsung pada CPMK</Label>
                          )}
                          <p className="text-xs text-muted-foreground">Maks. {criterion.maxScore} poin</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={criterion.maxScore}
                            value={scores[criterion.id] ?? 0}
                            disabled={isLocked}
                            onChange={(event) => {
                              const value = Number(event.target.value || 0);
                              setScores((prev) => ({ ...prev, [criterion.id]: value }));
                            }}
                          />
                          <span className="text-xs text-muted-foreground whitespace-nowrap">/ {criterion.maxScore}</span>
                        </div>
                      </div>

                      {criterion.rubrics.length > 0 && (
                        <Collapsible
                          open={openRubrics[criterion.id] ?? false}
                          onOpenChange={() => toggleRubric(criterion.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
                            >
                              {openRubrics[criterion.id] ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronRight className="h-3 w-3" />
                              )}
                              Lihat rubrik penilaian
                            </button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 rounded-md border bg-muted/30">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b">
                                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Range Skor</th>
                                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Deskripsi</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {criterion.rubrics.map((rubric) => (
                                    <tr key={rubric.id} className="border-b last:border-0">
                                      <td className="px-3 py-1.5 whitespace-nowrap font-medium">
                                        {rubric.minScore} - {rubric.maxScore}
                                      </td>
                                      <td className="px-3 py-1.5">{rubric.description}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )})}
                </CardContent>
              </Card>
            ))}

            <Card className="bg-muted/20">
              <CardContent className="pt-4 flex items-center justify-between">
                <span className="font-medium">Total Skor</span>
                <span className="text-xl font-bold">{totalScore}</span>
              </CardContent>
            </Card>

            {(form.assessorRole === 'examiner' || form.assessorRole === 'supervisor') && (
              <div className="space-y-2">
                <Label htmlFor="defenceRevisionNotes">
                  {form.assessorRole === 'examiner' ? 'Catatan Penguji' : 'Catatan Pembimbing'}
                </Label>
                {isSubmitted ? (
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {revisionNotes.trim() || 'Tidak ada catatan.'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Textarea
                    id="defenceRevisionNotes"
                    rows={4}
                    placeholder="Tuliskan catatan atau arahan revisi untuk mahasiswa (opsional)..."
                    value={revisionNotes}
                    disabled={isLocked}
                    onChange={(event) => setRevisionNotes(event.target.value)}
                  />
                )}
              </div>
            )}

            {!isSubmitted && (
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={!canSubmit || submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Mengirim...
                    </>
                  ) : (
                    'Submit Penilaian'
                  )}
                </Button>
              </div>
            )}
          </div>
        );
      }}
    </LecturerDefenceDetailLayout>
  );
}
