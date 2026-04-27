import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loading, Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
  useExaminerAssessmentForm,
  useSubmitExaminerAssessment,
  useSupervisorFinalizationData,
  useFinalizeSeminarBySupervisor,
} from '@/hooks/thesis-seminar';
import { useRole } from '@/hooks/shared/useRole';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';
import type {
  FinalizeSeminarPayload,
  SubmitExaminerAssessmentPayload,
  ThesisSeminarStatus,
} from '@/types/seminar.types';

const FINAL_RECOMMENDATIONS: { value: FinalizeSeminarPayload['status']; label: string; desc: string }[] = [
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa menyelesaikan seminar hasil dan lulus tanpa revisi.' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi', desc: 'Mahasiswa lulus, namun wajib menyelesaikan revisi.' },
  { value: 'failed', label: 'Gagal', desc: 'Mahasiswa harus mengulang seminar hasil.' },
];

function getMaxScoreFromDetails(
  details: Array<{ criteria: Array<{ maxScore: number }> }> = [],
): number {
  return details.reduce(
    (sum, group) => sum + group.criteria.reduce((gs, c) => gs + Number(c.maxScore || 0), 0),
    0,
  );
}

function formatScoreFraction(score: number | null, maxScore: number): string {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return `- / ${maxScore}`;
  const n = Number(score);
  return `${Number.isInteger(n) ? String(n) : n.toFixed(2)} / ${maxScore}`;
}

interface Props {
  seminarId: string;
  detail: any;
}

export function ThesisSeminarDetailAssessmentPanel({ seminarId, detail }: Props) {
  return (
    <div className="space-y-6">
      {/* 1. Form Penilaian (Dosen Penguji) */}
      <ExaminerAssessmentSection seminarId={seminarId} />
      
      <hr className="border-dashed" />

      {/* 2. Rekap Penilaian & Penetapan */}
      <SupervisorFinalizationSection
        seminarId={seminarId}
        detail={detail}
        isSupervisor={true}
      />

      {/* 3. Info Admin */}
      <AdminAssessmentInfo detail={detail} />
    </div>
  );
}

function AdminAssessmentInfo({ detail }: { detail: any }) {
  const finalized = ['passed', 'passed_with_revision', 'failed'].includes(detail.status);
  if (finalized) return null;
  return (
    <Card className="bg-muted/10 border-dashed">
      <CardContent className="pt-4 text-center">
        <p className="text-muted-foreground text-sm">
          Menunggu penilaian dari seluruh penguji dan penetapan hasil oleh dosen pembimbing.
        </p>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 1: Examiner Assessment Form (FOR DOSEN PENGUJI)
// ──────────────────────────────────────────────────────────────

function ExaminerAssessmentSection({ seminarId }: { seminarId: string }) {
  const { data: form, isLoading } = useExaminerAssessmentForm(seminarId);
  const submitMutation = useSubmitExaminerAssessment();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [revisionNotes, setRevisionNotes] = useState('');
  const [openRubrics, setOpenRubrics] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!form) return;
    const initial: Record<string, number> = {};
    form.criteriaGroups.forEach((group) => {
      group.criteria.forEach((c) => {
        initial[c.id] = c.score ?? 0;
      });
    });
    setScores(initial);
    setRevisionNotes(form.examiner.revisionNotes || '');
  }, [form]);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat form penilaian..." />
      </div>
    );
  }

  if (!form) {
    return (
      <Card className="bg-muted/10 border-dashed">
        <CardContent className="pt-4 text-center">
          <p className="text-muted-foreground text-sm">Form penilaian penguji tidak tersedia.</p>
        </CardContent>
      </Card>
    );
  }

  const isSubmitted = !!form.examiner.assessmentSubmittedAt;
  const allCriteria = form.criteriaGroups.flatMap((g) => g.criteria);
  const totalScore = Object.values(scores).reduce((sum, v) => sum + Number(v || 0), 0);

  const canSubmit =
    !isSubmitted &&
    allCriteria.every((c) => {
      const v = scores[c.id];
      return Number.isFinite(v) && v >= 0 && v <= c.maxScore;
    });

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payload: SubmitExaminerAssessmentPayload = {
      scores: allCriteria.map((c) => ({
        assessmentCriteriaId: c.id,
        score: Number(scores[c.id] ?? 0),
      })),
      revisionNotes: revisionNotes || undefined,
    };
    try {
      await submitMutation.mutateAsync({ seminarId, payload });
      toast.success('Penilaian berhasil dikirim.');
    } catch {
      toast.error('Gagal mengirim penilaian. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        Input Penilaian Anda
      </h2>

      {isSubmitted && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Penilaian sudah dikirim pada {formatDateTimeId(form.examiner.assessmentSubmittedAt!)}.
        </div>
      )}

      {form.criteriaGroups.map((group) => (
        <Card key={group.id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              {group.code} — {group.description}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.criteria.map((criterion) => {
              const isOptionB = group.criteria.length === 1 && !String(criterion.name ?? '').trim();
              return (
                <div key={criterion.id} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2 items-start">
                    <div>
                      {!isOptionB ? (
                        <Label className="text-sm font-medium">{criterion.name}</Label>
                      ) : (
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
                        disabled={isSubmitted}
                        onChange={(e) => {
                          const value = Number(e.target.value || 0);
                          setScores((prev) => ({ ...prev, [criterion.id]: value }));
                        }}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">/ {criterion.maxScore}</span>
                    </div>
                  </div>

                  {criterion.rubrics.length > 0 && (
                    <Collapsible
                      open={openRubrics[criterion.id] ?? false}
                      onOpenChange={() =>
                        setOpenRubrics((prev) => ({ ...prev, [criterion.id]: !prev[criterion.id] }))
                      }
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
                                    {rubric.minScore} – {rubric.maxScore}
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
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Card className="bg-muted/20">
        <CardContent className="pt-4 flex items-center justify-between">
          <span className="font-medium">Total Skor</span>
          <span className="text-xl font-bold">{totalScore}</span>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="revisionNotes">Catatan Penguji</Label>
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
            id="revisionNotes"
            rows={4}
            placeholder="Tuliskan catatan atau arahan revisi untuk mahasiswa (opsional)..."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
          />
        )}
      </div>

      {!isSubmitted && (
        <div className="flex justify-end">
          <Button onClick={() => void handleSubmit()} disabled={!canSubmit || submitMutation.isPending}>
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
}

// ──────────────────────────────────────────────────────────────
// Section 2: Rekap Penilaian & Finalisasi
// ──────────────────────────────────────────────────────────────

function SupervisorFinalizationSection({ seminarId, detail, isSupervisor }: { seminarId: string; detail: any; isSupervisor: boolean }) {
  const { data, isLoading } = useSupervisorFinalizationData(seminarId);
  const finalizeMutation = useFinalizeSeminarBySupervisor();

  const [finalRecommendation, setFinalRecommendation] = useState<ThesisSeminarStatus | ''>('');
  const [expandedExaminers, setExpandedExaminers] = useState<Record<string, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat data rekap..." />
      </div>
    );
  }

  // Fallback if data is not available (e.g. before assessment phase)
  if (!data) return null;

  const isFinalized = !!data.seminar.resultFinalizedAt;
  const displayGrade = data.averageGrade || data.seminar.grade;
  const totalMaxScore = getMaxScoreFromDetails(data.examiners?.[0]?.assessmentDetails || []) || 100;
  const totalScoreText = formatScoreFraction(data.averageScore, totalMaxScore);
  const canFinalize = isSupervisor && !!data.recommendationUnlocked && !!finalRecommendation && !isFinalized;

  const handleFinalize = async () => {
    if (!canFinalize) return;
    try {
      await finalizeMutation.mutateAsync({
        seminarId,
        payload: { status: finalRecommendation as FinalizeSeminarPayload['status'] },
      });
      toast.success('Hasil seminar berhasil ditetapkan.');
    } catch {
      toast.error('Gagal menetapkan hasil. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Rekap Penilaian Penguji & Hasil Akhir</h2>

      {isFinalized && (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Hasil seminar sudah ditetapkan pada {formatDateTimeId(data.seminar.resultFinalizedAt!)}.
        </div>
      )}

      {data.examiners.map((examiner) => {
        const isExpanded = expandedExaminers[examiner.id] ?? false;
        const hasDetails = (examiner.assessmentDetails ?? []).length > 0;
        const examinerMaxScore = getMaxScoreFromDetails(examiner.assessmentDetails || []);
        return (
          <Card key={examiner.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName)}
                </p>
                <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                  {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Skor:</span>
                <span className="font-semibold text-base">
                  {formatScoreFraction(examiner.assessmentScore, examinerMaxScore || 100)}
                </span>
              </div>
              {examiner.assessmentSubmittedAt && (
                <p className="text-xs text-muted-foreground">
                  Disubmit: {formatDateTimeId(examiner.assessmentSubmittedAt)}
                </p>
              )}
              {hasDetails && (
                <Collapsible
                  open={isExpanded}
                  onOpenChange={() =>
                    setExpandedExaminers((prev) => ({ ...prev, [examiner.id]: !prev[examiner.id] }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
                    >
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {isExpanded ? 'Sembunyikan detail penilaian' : 'Lihat detail penilaian per kriteria'}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="mt-2 space-y-3">
                      {examiner.assessmentDetails!.map((group) => (
                        <div key={group.id} className="rounded-md border bg-muted/30 overflow-hidden">
                          <div className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                            {group.code} — {group.description}
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Kriteria</th>
                                <th className="px-3 py-1.5 text-right font-medium text-muted-foreground w-24">Skor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.criteria.map((c) => (
                                <tr key={c.id} className="border-b last:border-0">
                                  <td className="px-3 py-1.5">{c.name}</td>
                                  <td className="px-3 py-1.5 text-right font-medium">
                                    {c.score} / {c.maxScore}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
              {examiner.assessmentSubmittedAt && (
                <div className="rounded-md border bg-muted/20 px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">Catatan Penguji</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                    {examiner.revisionNotes?.trim() || 'Tidak ada catatan.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/20">
        <CardContent className="pt-4 flex items-center justify-between">
          <span className="font-medium">Rata-rata Skor</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{totalScoreText}</span>
            {displayGrade && <span className="text-lg font-semibold">({displayGrade})</span>}
          </div>
        </CardContent>
      </Card>

      {!data.recommendationUnlocked && !isFinalized && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Fitur rekomendasi hasil akhir terkunci sampai seluruh penguji submit penilaian.
        </div>
      )}

      {(isFinalized || (isSupervisor && data.recommendationUnlocked)) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Keputusan Akhir</h3>
          {isFinalized ? (
            <div className="space-y-2">
              {FINAL_RECOMMENDATIONS.map((item) => {
                const isSelected = detail.status === item.value;
                return (
                  <div
                    key={item.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${isSelected ? 'border-green-300 bg-green-50' : 'opacity-50'}`}
                  >
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
                    <div>
                      <p className={`font-medium text-sm ${isSelected ? 'text-green-700' : ''}`}>{item.label}</p>
                      <p className={`text-xs ${isSelected ? 'text-green-600' : 'text-muted-foreground'}`}>{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              <RadioGroup
                value={finalRecommendation}
                onValueChange={(v) => setFinalRecommendation(v as ThesisSeminarStatus)}
                disabled={!data.recommendationUnlocked}
              >
                {FINAL_RECOMMENDATIONS.map((item) => (
                  <Label
                    key={item.value}
                    htmlFor={`final-${item.value}`}
                    className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <RadioGroupItem value={item.value} id={`final-${item.value}`} className="mt-1" />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <div className="flex justify-end mt-4">
                <Button onClick={() => void handleFinalize()} disabled={!canFinalize || finalizeMutation.isPending}>
                  {finalizeMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Menetapkan...
                    </>
                  ) : (
                    'Tetapkan Hasil Seminar'
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
