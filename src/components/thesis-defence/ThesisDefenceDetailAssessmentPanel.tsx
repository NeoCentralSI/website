import React, { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useRole } from '@/hooks/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  useDefenceAssessmentForm,
  useSubmitDefenceAssessment,
  useDefenceFinalizationData,
  useFinalizeDefenceBySupervisor,
} from '@/hooks/thesis-defence';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';
import type { FinalizeDefencePayload } from '@/types/defence.types';

interface Props {
  defenceId: string;
  detail: any;
}

export function ThesisDefenceDetailAssessmentPanel({ defenceId, detail }: Props) {
  const { user } = useAuth();
  const { isKadep, isAdmin, isStudent } = useRole();

  const isUserExaminer = !!user?.lecturer?.id && detail?.examiners?.some((e: any) => e.lecturerId === user?.lecturer?.id);
  const isUserSupervisor = !!user?.lecturer?.id && detail?.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);
  const _isKadep = isKadep();
  const _isAdmin = isAdmin();
  const _isStudent = isStudent();

  const isFinalized = ['passed', 'passed_with_revision', 'failed'].includes(detail?.status);

  // 1. FINALIZED STATE: Show summary matrix
  if (isFinalized) {
    return (
      <div className="space-y-6">
        <SupervisorFinalizationSection defenceId={defenceId} isSupervisor={false} />
      </div>
    );
  }

  // 2. ONGOING STATE
  const isOngoing = detail?.status === 'ongoing';

  if (isOngoing) {
    return (
      <div className="space-y-6">
        {(isUserExaminer || isUserSupervisor) && <AssessmentFormSection defenceId={defenceId} />}
        {isUserSupervisor && (
          <SupervisorFinalizationSection defenceId={defenceId} isSupervisor={true} />
        )}
        {!isUserExaminer && !isUserSupervisor && (_isAdmin || _isKadep) && (
           <AdminAssessmentInfo detail={detail} />
        )}
      </div>
    );
  }

  // 3. Fallback for other states
  if (_isAdmin || _isKadep || _isStudent) {
    return <AdminAssessmentInfo detail={detail} />;
  }

  return null;
}

function AdminAssessmentInfo({ detail }: { detail: any }) {
  const finalized = ['passed', 'passed_with_revision', 'failed'].includes(detail.status);
  if (finalized) return null;
  return (
    <Card className="bg-muted/10 border-dashed">
      <CardContent className="pt-4 text-center">
        <p className="text-muted-foreground text-sm">
          Menunggu pelaksanaan sidang dan penilaian dari seluruh penguji serta pembimbing.
        </p>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 1: Assessment Form (FOR EXAMINERS & SUPERVISORS)
// ──────────────────────────────────────────────────────────────

function AssessmentFormSection({ defenceId }: { defenceId: string }) {
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

  if (isLoading || !form) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat form penilaian..." />
      </div>
    );
  }

  const isSubmitted =
    form.assessorRole === 'examiner'
      ? !!form.examiner?.assessmentSubmittedAt
      : !!form.supervisor?.assessmentSubmittedAt;

  const isLocked = form.defence.status !== 'ongoing' || isSubmitted;

  const canSubmit =
    form.defence.status === 'ongoing' &&
    !isLocked &&
    allCriteria.every((criterion) => {
      const value = scores[criterion.id];
      return Number.isFinite(value) && value >= 0 && value <= criterion.maxScore;
    });

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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Form Penilaian Anda</h2>
        <Badge variant="secondary">
          Mode {form.assessorRole === 'examiner' ? 'Penguji' : 'Pembimbing'}
        </Badge>
      </div>

      {isSubmitted && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Penilaian Anda sudah dikirim pada{' '}
          {formatDateTimeId(
            form.assessorRole === 'examiner'
              ? form.examiner?.assessmentSubmittedAt
              : form.supervisor?.assessmentSubmittedAt,
          )}
          .
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
                      onOpenChange={() => setOpenRubrics(prev => ({ ...prev, [criterion.id]: !prev[criterion.id] }))}
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
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-muted/20">
        <CardContent className="pt-4 flex items-center justify-between">
          <span className="font-medium">Total Skor Anda</span>
          <span className="text-xl font-bold">{totalScore}</span>
        </CardContent>
      </Card>

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

      {!isSubmitted && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!canSubmit || submitMutation.isPending}>
            {submitMutation.isPending ? (
              <><Spinner className="mr-2 h-4 w-4" />Mengirim...</>
            ) : (
              'Submit Penilaian'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 2: Finalization & Summary (FOR SUPERVISORS & VIEWERS)
// ──────────────────────────────────────────────────────────────

function SupervisorFinalizationSection({ defenceId, isSupervisor }: { defenceId: string; isSupervisor: boolean }) {
  const { data, isLoading } = useDefenceFinalizationData(defenceId);
  const finalizeMutation = useFinalizeDefenceBySupervisor();
  const [finalRecommendation, setFinalRecommendation] = useState<FinalizeDefencePayload['status'] | ''>('');
  const [expandedExaminers, setExpandedExaminers] = useState<Record<string, boolean>>({});
  const [isSupervisorExpanded, setIsSupervisorExpanded] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat rekap penilaian..." />
      </div>
    );
  }

  const isFinalized = !!data.defence.resultFinalizedAt;
  const canFinalize =
    isSupervisor &&
    data.supervisor.canFinalize &&
    data.recommendationUnlocked &&
    !!finalRecommendation &&
    !isFinalized;

  const finalScore = data.defence.finalScore ?? data.defence.computedFinalScore;
  const finalGrade = data.defence.grade || mapScoreToGrade(finalScore);

  const examinerMaxScore = getMaxScoreFromDetails(data.examiners?.[0]?.assessmentDetails || []) || 100;
  const supervisorMaxScore = getMaxScoreFromDetails(data.supervisorAssessment.assessmentDetails || []) || 100;
  const finalMaxScore = examinerMaxScore + supervisorMaxScore;

  const handleFinalize = async () => {
    if (!defenceId || !finalRecommendation) return;
    try {
      await finalizeMutation.mutateAsync({
        defenceId,
        payload: { status: finalRecommendation },
      });
      toast.success('Hasil sidang berhasil ditetapkan.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menetapkan hasil sidang.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rekap Penilaian & Penetapan Hasil</h2>

      {isFinalized && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Hasil sidang sudah ditetapkan pada {formatDateTimeId(data.defence.resultFinalizedAt)}.
        </div>
      )}

      {data.examiners.map((examiner) => {
        const isExpanded = expandedExaminers[examiner.id] ?? false;
        const currentExMax = getMaxScoreFromDetails(examiner.assessmentDetails || []);
        return (
          <Card key={examiner.id}>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  Penilaian Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName)}
                </p>
                <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                  {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Skor:</span>
                <span className="font-semibold">{formatScoreFraction(examiner.assessmentScore, currentExMax || examinerMaxScore)}</span>
              </div>

              {(examiner.assessmentDetails ?? []).length > 0 && (
                <Collapsible open={isExpanded} onOpenChange={(open) => setExpandedExaminers(prev => ({ ...prev, [examiner.id]: open }))}>
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      Detail Penilaian
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                     {examiner.assessmentDetails.map((group) => (
                       <div key={group.id} className="rounded border bg-muted/20 p-2 text-xs">
                         <p className="font-semibold mb-1">{group.code} — {group.description}</p>
                         <div className="space-y-1">
                           {group.criteria.map((c) => (
                             <div key={c.id} className="flex justify-between">
                               <span>{c.name}</span>
                               <span className="font-medium">{c.score} / {c.maxScore}</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {examiner.assessmentSubmittedAt && (
                <div className="rounded border bg-muted/10 p-2 italic text-xs">
                  &quot;{examiner.revisionNotes?.trim() || 'Tidak ada catatan.'}&quot;
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="pt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              Penilaian Pembimbing — {toTitleCaseName(data.supervisor.name || data.supervisor.roleName)}
            </p>
            <Badge variant={data.supervisorAssessmentSubmitted ? 'success' : 'warning'}>
              {data.supervisorAssessmentSubmitted ? 'Sudah Submit' : 'Belum Submit'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Skor:</span>
            <span className="font-semibold">{formatScoreFraction(data.supervisorAssessment.assessmentScore, supervisorMaxScore)}</span>
          </div>
          {data.supervisorAssessment.assessmentSubmittedAt && (
             <div className="rounded border bg-muted/10 p-2 italic text-xs">
               &quot;{data.supervisorAssessment.supervisorNotes?.trim() || 'Tidak ada catatan.'}&quot;
             </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 flex items-center justify-between">
          <span className="font-bold">Skor Akhir Sidang</span>
          <div className="text-right">
             <span className="text-2xl font-black">
                {finalScore !== null ? `${finalScore.toFixed(2)}` : '-'}
             </span>
             <span className="text-sm text-muted-foreground ml-1">/ {finalMaxScore}</span>
             {finalGrade !== '-' && (
               <Badge className="ml-2 bg-primary">{finalGrade}</Badge>
             )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold">Hasil Keputusan</h3>

        {!data.recommendationUnlocked && !isFinalized && (
          <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Penetapan hasil akan terbuka setelah seluruh penguji dan pembimbing menyelesaikan penilaian.
          </div>
        )}

        {isFinalized ? (
          <div className="space-y-2">
            {FINAL_RECOMMENDATIONS.map((option) => {
              const isSelected = data.defence.status === option.value;
              if (!isSelected) return null;
              return (
                <div key={option.value} className="flex items-start gap-3 rounded-lg border border-green-300 bg-green-50 p-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-700">{option.label}</p>
                    <p className="text-xs text-green-600">{option.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : isSupervisor && data.recommendationUnlocked ? (
          <div className="space-y-4">
             <RadioGroup
              value={finalRecommendation}
              onValueChange={(val) => setFinalRecommendation(val as any)}
              className="space-y-2"
            >
              {FINAL_RECOMMENDATIONS.map((option) => (
                <Label key={option.value} htmlFor={`rec-${option.value}`} className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30">
                  <RadioGroupItem value={option.value} id={`rec-${option.value}`} className="mt-1" />
                  <div>
                    <p className="font-semibold text-sm">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
            <div className="flex justify-end">
               <Button onClick={handleFinalize} disabled={!canFinalize || finalizeMutation.isPending}>
                 {finalizeMutation.isPending ? <><Spinner className="mr-2 h-4 w-4" />Memproses...</> : 'Tetapkan Hasil Sidang'}
               </Button>
            </div>
          </div>
        ) : (
           <p className="text-xs text-muted-foreground italic">Menunggu penetapan hasil oleh dosen pembimbing.</p>
        )}
      </div>
    </div>
  );
}

// Helpers
function mapScoreToGrade(score: number | null): string {
  if (score === null || Number.isNaN(Number(score))) return '-';
  const n = Number(score);
  if (n >= 80) return 'A';
  if (n >= 76) return 'A-';
  if (n >= 70) return 'B+';
  if (n >= 65) return 'B';
  if (n >= 55) return 'C+';
  if (n >= 50) return 'C';
  if (n >= 45) return 'D';
  return 'E';
}

function getMaxScoreFromDetails(details: any[] = []): number {
  return details.reduce((sum, group) => sum + group.criteria.reduce((gs: number, c: any) => gs + Number(c.maxScore || 0), 0), 0);
}

function formatScoreFraction(score: number | null, max: number): string {
  if (score === null || score === undefined) return `- / ${max}`;
  return `${Number.isInteger(score) ? score : score.toFixed(2)} / ${max}`;
}

const FINAL_RECOMMENDATIONS = [
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa lulus sidang tanpa revisi.' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi', desc: 'Mahasiswa lulus dengan kewajiban menyelesaikan revisi.' },
  { value: 'failed', label: 'Gagal', desc: 'Mahasiswa belum lulus dan harus mengulang sidang.' },
];
