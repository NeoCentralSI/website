import { LecturerDefenceDetailLayout } from '@/components/sidang/LecturerDefenceDetailLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loading, Spinner } from '@/components/ui/spinner';
import {
  useDefenceFinalizationData,
  useFinalizeDefenceBySupervisor,
} from '@/hooks/defence';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';
import { CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { FinalizeDefencePayload } from '@/types/defence.types';

function mapScoreToGrade(score: number | null): string {
  if (score === null || Number.isNaN(Number(score))) return '-';
  const numericScore = Number(score);
  if (numericScore >= 80 && numericScore <= 100) return 'A';
  if (numericScore >= 76) return 'A-';
  if (numericScore >= 70) return 'B+';
  if (numericScore >= 65) return 'B';
  if (numericScore >= 55) return 'C+';
  if (numericScore >= 50) return 'C';
  if (numericScore >= 45) return 'D';
  return 'E';
}

function getMaxScoreFromDetails(
  details: Array<{ criteria: Array<{ maxScore: number }> }> = []
): number {
  return details.reduce(
    (sum, group) => sum + group.criteria.reduce((groupSum, criterion) => groupSum + Number(criterion.maxScore || 0), 0),
    0,
  );
}

function formatScoreFraction(score: number | null, maxScore: number): string {
  if (score === null || score === undefined || Number.isNaN(Number(score))) return `- / ${maxScore}`;
  const numeric = Number(score);
  const display = Number.isInteger(numeric) ? String(numeric) : numeric.toFixed(2);
  return `${display} / ${maxScore}`;
}

const FINAL_RECOMMENDATIONS: {
  value: FinalizeDefencePayload['status'];
  label: string;
  desc: string;
}[] = [
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa lulus sidang tanpa revisi.' },
  {
    value: 'passed_with_revision',
    label: 'Lulus dengan Revisi',
    desc: 'Mahasiswa lulus sidang dengan kewajiban menyelesaikan revisi.',
  },
  { value: 'failed', label: 'Gagal', desc: 'Mahasiswa belum lulus dan harus mengulang sidang.' },
];

export default function LecturerDefenceDetailMinutes() {
  const { defenceId } = useParams<{ defenceId: string }>();
  const { data, isLoading } = useDefenceFinalizationData(defenceId);
  const finalizeMutation = useFinalizeDefenceBySupervisor();
  const [finalRecommendation, setFinalRecommendation] = useState<FinalizeDefencePayload['status'] | ''>('');
  const [expandedExaminers, setExpandedExaminers] = useState<Record<string, boolean>>({});
  const [isSupervisorExpanded, setIsSupervisorExpanded] = useState(false);

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

  const toggleExaminer = (id: string) => {
    setExpandedExaminers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <LecturerDefenceDetailLayout>
      {(detail) => {
        const canAccess =
          ['ongoing', 'passed', 'passed_with_revision', 'failed'].includes(detail.status) &&
          detail.viewerRole === 'supervisor';

        if (!canAccess) {
          return (
            <Card>
              <CardHeader>
                <CardTitle>Berita Acara Belum Tersedia</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Tab berita acara hanya dapat diakses oleh dosen pembimbing yang terlibat pada sidang ini.
              </CardContent>
            </Card>
          );
        }

        if (isLoading || !data) {
          return (
            <div className="flex h-40 items-center justify-center">
              <Loading size="lg" text="Memuat berita acara sidang..." />
            </div>
          );
        }

        const isFinalized = !!data.defence.resultFinalizedAt;
        const canFinalize =
          data.supervisor.canFinalize &&
          data.recommendationUnlocked &&
          !!finalRecommendation &&
          !isFinalized;

        const finalScore = data.defence.finalScore ?? data.defence.computedFinalScore;
        const finalGrade = data.defence.grade || mapScoreToGrade(finalScore);
        const examinerMaxScore = getMaxScoreFromDetails(data.examiners?.[0]?.assessmentDetails || []) || 100;
        const supervisorMaxScore = getMaxScoreFromDetails(data.supervisorAssessment.assessmentDetails || []) || 100;
        const finalMaxScore = examinerMaxScore + supervisorMaxScore;

        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Penilaian Penguji & Penetapan Hasil</h2>

            {isFinalized && (
              <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                Hasil sidang sudah ditetapkan pada {formatDateTimeId(data.defence.resultFinalizedAt)}.
              </div>
            )}

            {data.examiners.map((examiner) => {
              const isExpanded = expandedExaminers[examiner.id] ?? false;
              const hasDetails = (examiner.assessmentDetails ?? []).length > 0;
              const currentExaminerMaxScore = getMaxScoreFromDetails(examiner.assessmentDetails || []);

              return (
                <Card key={examiner.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        Penilaian Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName)}
                      </p>
                      <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                        {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Skor:</span>
                      <span className="font-semibold text-base">{formatScoreFraction(examiner.assessmentScore, currentExaminerMaxScore || examinerMaxScore)}</span>
                    </div>

                    {examiner.assessmentSubmittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Disubmit: {formatDateTimeId(examiner.assessmentSubmittedAt)}
                      </p>
                    )}

                    {hasDetails && (
                      <Collapsible open={isExpanded} onOpenChange={() => toggleExaminer(examiner.id)}>
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
                            {examiner.assessmentDetails.map((group) => (
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
                                    {group.criteria.map((criterion) => (
                                      <tr key={criterion.id} className="border-b last:border-0">
                                        <td className="px-3 py-1.5">{criterion.name}</td>
                                        <td className="px-3 py-1.5 text-right font-medium">
                                          {criterion.score} / {criterion.maxScore}
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

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    Penilaian Pembimbing — {toTitleCaseName(data.supervisor.name || data.supervisor.roleName)}
                  </p>
                  <Badge variant={data.supervisorAssessmentSubmitted ? 'success' : 'warning'}>
                    {data.supervisorAssessmentSubmitted ? 'Sudah Submit' : 'Belum Submit'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Skor:</span>
                  <span className="font-semibold text-base">{formatScoreFraction(data.supervisorAssessment.assessmentScore, supervisorMaxScore)}</span>
                </div>

                {data.supervisorAssessment.assessmentSubmittedAt && (
                  <p className="text-xs text-muted-foreground">
                    Disubmit: {formatDateTimeId(data.supervisorAssessment.assessmentSubmittedAt)}
                  </p>
                )}

                {data.supervisorAssessment.assessmentDetails.length > 0 && (
                  <Collapsible open={isSupervisorExpanded} onOpenChange={setIsSupervisorExpanded}>
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-primary hover:underline focus:outline-none"
                      >
                        {isSupervisorExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        {isSupervisorExpanded ? 'Sembunyikan detail penilaian' : 'Lihat detail penilaian per kriteria'}
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-2 space-y-3">
                        {data.supervisorAssessment.assessmentDetails.map((group) => (
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
                                {group.criteria.map((criterion) => (
                                  <tr key={criterion.id} className="border-b last:border-0">
                                    <td className="px-3 py-1.5">{criterion.name}</td>
                                    <td className="px-3 py-1.5 text-right font-medium">
                                      {criterion.score} / {criterion.maxScore}
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

                {data.supervisorAssessment.assessmentSubmittedAt && (
                  <div className="rounded-md border bg-muted/20 px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">Catatan Pembimbing</p>
                    <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                      {data.supervisorAssessment.supervisorNotes?.trim() || 'Tidak ada catatan.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-muted/20">
              <CardContent className="pt-4 flex items-center justify-between">
                <span className="font-medium">Skor Akhir</span>
                <span className="text-2xl font-bold">
                  {finalScore !== null && finalScore !== undefined
                    ? `${formatScoreFraction(finalScore, finalMaxScore)} (${finalGrade})`
                    : `- / ${finalMaxScore}`}
                </span>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Keputusan Akhir</h3>

              {!data.recommendationUnlocked && (
                <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Penetapan hasil akan terbuka setelah seluruh penguji dan pembimbing menyelesaikan penilaian.
                </div>
              )}

              {isFinalized ? (
                <div className="space-y-3">
                  {FINAL_RECOMMENDATIONS.map((option) => {
                    const isSelected = data.defence.status === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`flex items-start gap-3 rounded-lg border p-3 ${isSelected ? 'border-green-300 bg-green-50' : 'opacity-50'}`}
                      >
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />}
                        <div>
                          <p className={`font-medium text-sm ${isSelected ? 'text-green-700' : ''}`}>{option.label}</p>
                          <p className={`text-xs ${isSelected ? 'text-green-600' : 'text-muted-foreground'}`}>{option.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <>
                  <RadioGroup
                    value={finalRecommendation}
                    onValueChange={(value) => setFinalRecommendation(value as FinalizeDefencePayload['status'])}
                    className="space-y-2"
                    disabled={!data.recommendationUnlocked}
                  >
                    {FINAL_RECOMMENDATIONS.map((option) => (
                      <Label
                        key={option.value}
                        htmlFor={`defence-final-${option.value}`}
                        className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                      >
                        <RadioGroupItem value={option.value} id={`defence-final-${option.value}`} className="mt-1" />
                        <div>
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.desc}</p>
                        </div>
                      </Label>
                    ))}
                  </RadioGroup>

                  <div className="flex justify-end">
                    <Button onClick={handleFinalize} disabled={!canFinalize || finalizeMutation.isPending}>
                      {finalizeMutation.isPending ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Memproses...
                        </>
                      ) : (
                        'Tetapkan Hasil Sidang'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      }}
    </LecturerDefenceDetailLayout>
  );
}
