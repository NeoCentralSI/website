import React, { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, AlertCircle, XCircle, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useRole } from '@/hooks/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loading, Spinner } from '@/components/ui/spinner';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useDefenceAssessmentForm,
  useSubmitDefenceAssessment,
  useDefenceFinalizationData,
  useFinalizeDefenceBySupervisor,
  useDownloadAssessmentResult,
} from '@/hooks/thesis-defence';
import { formatDateTimeId, toTitleCaseName } from '@/lib/text';
import type { SubmitDefenceAssessmentPayload } from '@/types/defence.types';

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

  // 1. FINALIZED STATE: Show summary matrix & transcript
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
    if (_isStudent) {
      return (
        <Card className="border-gray-200 bg-card shadow-none">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Penilaian sidang sedang berlangsung dan belum difinalisasi oleh dosen pembimbing.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {(isUserExaminer || isUserSupervisor) && <AssessmentFormSection defenceId={defenceId} />}
        {isUserSupervisor && (
          <SupervisorFinalizationSection defenceId={defenceId} isSupervisor={true} />
        )}
        {!isUserExaminer && !isUserSupervisor && (_isAdmin || _isKadep) && (
          <SupervisorFinalizationSection defenceId={defenceId} isSupervisor={false} />
        )}
      </div>
    );
  }

  // 3. Fallback for other non-finalized states
  if (_isAdmin || _isKadep || _isStudent) {
    return <AdminAssessmentInfo detail={detail} />;
  }

  return null;
}

function AdminAssessmentInfo({ detail }: { detail: any }) {
  const finalized = ['passed', 'passed_with_revision', 'failed'].includes(detail?.status);
  if (finalized) return null;
  return (
    <Card className="border-gray-200 bg-card shadow-none">
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
  const { user } = useAuth();
  const { data: form, isLoading } = useDefenceAssessmentForm(defenceId);
  const submitMutation = useSubmitDefenceAssessment();

  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
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
      setNotes(form.examiner?.revisionNotes || '');
    } else {
      setNotes(form.supervisor?.supervisorNotes || '');
    }
  }, [form]);

  const allCriteria = useMemo(
    () => form?.criteriaGroups.flatMap((group) => group.criteria) ?? [],
    [form]
  );

  const totalScore = useMemo(
    () => Object.values(scores).reduce((sum, value) => sum + (Number(value) || 0), 0),
    [scores]
  );

  if (isLoading || !form) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat form penilaian..." />
      </div>
    );
  }

  const isExaminer = form.assessorRole === 'examiner';
  const isSubmitted = isExaminer
    ? !!form.examiner?.assessmentSubmittedAt
    : !!form.supervisor?.assessmentSubmittedAt;

  const isDraft = !isSubmitted && (
    isExaminer ? form.examiner?.assessmentScore !== null : form.supervisor?.assessmentScore !== null
  );

  const isLocked = form.defence.status !== 'ongoing' || isSubmitted;

  const canSubmit =
    form.defence.status === 'ongoing' &&
    !isLocked &&
    allCriteria.length > 0 &&
    allCriteria.every((criterion) => {
      const val = scores[criterion.id] ?? 0;
      return typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= criterion.maxScore;
    });

  const canSaveDraft = form.defence.status === 'ongoing' && !isLocked;

  const handleSaveDraft = async () => {
    if (!defenceId || !form || !canSaveDraft) return;

    const scoresPayload = allCriteria.map((criterion) => ({
      assessmentCriteriaId: criterion.id,
      score: Number(scores[criterion.id] ?? 0),
    }));

    const payload: SubmitDefenceAssessmentPayload = {
      scores: scoresPayload,
      revisionNotes: isExaminer ? notes || undefined : undefined,
      supervisorNotes: !isExaminer ? notes || undefined : undefined,
      isDraft: true,
    };

    try {
      await submitMutation.mutateAsync({ defenceId, payload });
      toast.success('Draf penilaian berhasil disimpan.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menyimpan draf penilaian.');
    }
  };

  const handleSubmit = async () => {
    if (!defenceId || !form || !canSubmit) return;

    const payload: SubmitDefenceAssessmentPayload = {
      scores: allCriteria.map((criterion) => ({
        assessmentCriteriaId: criterion.id,
        score: Number(scores[criterion.id] ?? 0),
      })),
      revisionNotes: isExaminer ? notes || undefined : undefined,
      supervisorNotes: !isExaminer ? notes || undefined : undefined,
      isDraft: false,
    };

    try {
      await submitMutation.mutateAsync({ defenceId, payload });
      toast.success('Penilaian sidang berhasil dikirim.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal mengirim penilaian sidang.');
    }
  };

  const totalMaxScore = allCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
      {/* Left Column: Criteria Form */}
      <div className="flex flex-col gap-4">
        <Card className="border-gray-200 bg-card shadow-none">
          <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <CardTitle className="text-base font-semibold">
              Form Penilaian Sidang TA ({isExaminer ? 'Penguji' : 'Pembimbing'})
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Penilai: <span className="font-semibold text-foreground">{toTitleCaseName(user?.fullName || 'Dosen')}</span>
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {form.criteriaGroups.map((group, groupIdx) => {
              const groupMaxScore = group.criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
              const groupLetter = String.fromCharCode(65 + groupIdx);
              return (
                <div key={group.id} className="flex flex-col">
                  {/* Group Header */}
                  <div className="bg-muted/20 px-4 py-3">
                    <h3 className="text-sm font-bold text-foreground">
                      {groupLetter} · {group.code} <span className="text-xs font-normal text-muted-foreground">(maks. {groupMaxScore})</span>
                    </h3>
                    {group.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                    )}
                  </div>

                  {/* Criteria Items */}
                  <div className="divide-y">
                    {group.criteria.map((criterion, cIdx) => {
                      const isPlaceholder = !criterion.name || criterion.name.trim() === '-' || criterion.name.trim() === '';
                      const isOptionB = group.criteria.length === 1 && isPlaceholder;
                      const cLetter = String.fromCharCode(97 + cIdx);
                      const currentVal = scores[criterion.id] ?? 0;
                      const isInvalid = currentVal < 0 || currentVal > criterion.maxScore;

                      return (
                        <div key={criterion.id} className="px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              {!isOptionB && (
                                <Label className="text-sm font-medium leading-relaxed">
                                  ({cLetter}) {criterion.name}
                                </Label>
                              )}
                              {criterion.rubrics.length > 0 && (
                                <Collapsible
                                  open={openRubrics[criterion.id] ?? false}
                                  onOpenChange={() =>
                                    setOpenRubrics((prev) => ({ ...prev, [criterion.id]: !prev[criterion.id] }))
                                  }
                                  className="mt-1"
                                >
                                  <CollapsibleTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline focus:outline-none"
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
                                    <div className="mt-2 rounded-md border border-gray-200 bg-white">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Range Skor</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Deskripsi</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {criterion.rubrics.map((rubric) => (
                                            <tr key={rubric.id} className="border-b last:border-0">
                                              <td className="px-3 py-1.5 whitespace-nowrap font-semibold">
                                                {rubric.minScore} – {rubric.maxScore}
                                              </td>
                                              <td className="px-3 py-1.5 text-muted-foreground">{rubric.description}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={criterion.maxScore}
                                  step="any"
                                  value={scores[criterion.id] ?? 0}
                                  disabled={isLocked}
                                  className={`w-20 text-right text-sm font-semibold h-8 ${
                                    isInvalid ? 'border-red-500 text-red-600 focus-visible:ring-red-500' : ''
                                  }`}
                                  onChange={(e) => {
                                    const value = Number(e.target.value || 0);
                                    setScores((prev) => ({ ...prev, [criterion.id]: value }));
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
                              </div>
                              {isInvalid && (
                                <span className="text-[10px] text-red-600 font-medium">
                                  Nilai 0-{criterion.maxScore}
                                </span>
                              )}
                            </div>
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

        <div className="space-y-2">
          <Label htmlFor="defenceNotes" className="font-semibold text-sm">
            {isExaminer ? 'Catatan Evaluasi / Catatan Penguji' : 'Catatan Evaluasi Pembimbing'}
          </Label>
          {isSubmitted ? (
            <Card className="border-gray-200 bg-card shadow-none">
              <CardContent className="pt-4">
                <p className="text-sm whitespace-pre-wrap break-words">
                  {notes.trim() || 'Tidak ada catatan.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Textarea
              id="defenceNotes"
              rows={4}
              placeholder="Tuliskan catatan evaluasi untuk mahasiswa (opsional)..."
              value={notes}
              disabled={isLocked}
              onChange={(e) => setNotes(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Right Column: Score Summary Card & Actions */}
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col items-center justify-center border-gray-200 bg-card p-6 text-center shadow-none">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Total Skor ({isExaminer ? 'Penguji' : 'Pembimbing'})</span>
          <div className="mt-2 flex items-baseline justify-center">
            <span className="text-5xl font-black text-foreground">{Number.isInteger(totalScore) ? totalScore : totalScore.toFixed(2)}</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground mt-1">/ {totalMaxScore}</span>
          <Badge className="mt-4 font-semibold" variant={isSubmitted ? 'success' : isDraft ? 'warning' : 'secondary'}>
            {isSubmitted ? 'Sudah Submit (Terkunci)' : isDraft ? 'Draf' : 'Belum diisi'}
          </Badge>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Batas kelulusan sidang (nilai akhir): <span className="font-semibold text-foreground">{form.minimumPassingScore}</span>
          </p>
        </Card>

        <Card className="flex flex-col gap-3 border-gray-200 bg-card p-4 shadow-none">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Rincian CPMK</h4>
          <div className="divide-y text-xs">
            {form.criteriaGroups.map((group) => {
              const groupScore = group.criteria.reduce((sum, c) => {
                const val = scores[c.id];
                return sum + (typeof val === 'number' ? val : 0);
              }, 0);
              const groupMaxScore = group.criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
              return (
                <div key={group.id} className="flex justify-between py-2 font-semibold">
                  <span className="text-muted-foreground">{group.code}</span>
                  <span className="text-foreground font-bold">
                    {Number.isInteger(groupScore) ? groupScore : groupScore.toFixed(2)}{' '}
                    <span className="text-muted-foreground font-normal">/ {groupMaxScore}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {!isSubmitted && (
          <div className="flex flex-col gap-3 w-full">
            <Button
              onClick={() => void handleSaveDraft()}
              disabled={!canSaveDraft || submitMutation.isPending}
              variant="outline"
              className="w-full py-6 text-sm font-bold border-gray-200"
            >
              {submitMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Draf'
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!canSubmit || submitMutation.isPending}
                  className="w-full bg-[#f59e0b] py-6 text-sm font-bold text-white hover:bg-[#d97706]"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Mengirim...
                    </>
                  ) : (
                    'Submit Penilaian'
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan mengunci seluruh penilaian Anda. Nilai yang telah disubmit tidak dapat diubah lagi.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleSubmit()}>Ya, Submit</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Section 2: Rekapitulasi & Finalisasi Berita Acara (SUPERVISOR / VIEWERS)
// ──────────────────────────────────────────────────────────────

function SupervisorFinalizationSection({ defenceId, isSupervisor }: { defenceId: string; isSupervisor: boolean }) {
  const { data, isLoading } = useDefenceFinalizationData(defenceId);
  const finalizeMutation = useFinalizeDefenceBySupervisor();
  const downloadAssessmentResultMutation = useDownloadAssessmentResult();

  const [recommendRevision, setRecommendRevision] = useState<boolean>(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const uniqueExaminerGroups = useMemo(() => {
    if (!data?.examiners) return [];
    const groups: any[] = [];
    const seen = new Set<string>();
    for (const ex of data.examiners || []) {
      for (const group of ex.assessmentDetails || []) {
        if (!seen.has(group.code)) {
          seen.add(group.code);
          groups.push(group);
        }
      }
    }
    return groups;
  }, [data?.examiners]);

  if (isLoading || !data) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat berita acara..." />
      </div>
    );
  }

  const isFinalized = !!data.defence.resultFinalizedAt;
  const canFinalize =
    isSupervisor &&
    data.supervisor.canFinalize &&
    data.recommendationUnlocked &&
    !isFinalized;

  const averageExaminerScore = data.defence.examinerAverageScore;
  const supervisorScore = data.defence.supervisorScore;
  const finalScore = data.defence.finalScore ?? data.defence.computedFinalScore;
  const finalGrade = data.defence.grade || mapScoreToGrade(finalScore);

  const examinerMaxScore = getMaxScoreFromDetails(data.examiners?.[0]?.assessmentDetails || []) || 70;
  const supervisorMaxScore = getMaxScoreFromDetails(data.supervisorAssessment?.assessmentDetails || []) || 30;
  const supervisorGroups = data.supervisorAssessment?.assessmentDetails || [];

  const isBelowThreshold = finalScore !== null && finalScore < data.minimumPassingScore;

  const handleFinalize = async () => {
    if (!defenceId || finalScore === null || !canFinalize || finalizeMutation.isPending) return;

    try {
      await finalizeMutation.mutateAsync({
        defenceId,
        payload: {
          recommendRevision: isBelowThreshold ? false : recommendRevision,
        },
      });
      toast.success('Hasil sidang berhasil ditetapkan.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menetapkan hasil sidang.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Finalized Banner */}
      {isFinalized && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex flex-1 flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-card px-4 py-3 text-xs">
            <span className="text-muted-foreground">
              Sidang difinalisasi pada <span className="font-semibold text-foreground">{formatDateTimeId(data.defence.resultFinalizedAt)}</span>
              {data.defence.resultFinalizedBy && (
                <> oleh <span className="font-semibold text-foreground">{toTitleCaseName(data.defence.resultFinalizedBy)}</span></>
              )}
            </span>
            <div className="flex items-center gap-3">
              <Badge variant={data.defence.status === 'passed' ? 'success' : data.defence.status === 'passed_with_revision' ? 'warning' : 'destructive'}>
                {data.defence.status === 'passed'
                  ? 'Lulus'
                  : data.defence.status === 'passed_with_revision'
                    ? 'Lulus dengan Revisi'
                    : 'Tidak Lulus'}
              </Badge>
              <span className="text-muted-foreground">
                Nilai Akhir: <span className="font-bold text-foreground text-sm">{finalScore !== null ? finalScore.toFixed(2) : '-'}</span>
              </span>
              <Badge className="bg-foreground text-background font-bold">{finalGrade}</Badge>
              <span className="text-[10px] text-muted-foreground">Batas kelulusan: {data.minimumPassingScore}</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-2 h-auto px-5 bg-card border-gray-200 hover:bg-gray-50 text-xs font-semibold"
            onClick={() => downloadAssessmentResultMutation.mutate(defenceId)}
            disabled={downloadAssessmentResultMutation.isPending}
          >
            {downloadAssessmentResultMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>Download Berita Acara</span>
          </Button>
        </div>
      )}

      {/* A. Rekapitulasi Penguji */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-foreground">A. Hasil Rekapitulasi Penilaian Penguji</h3>
        <div className="rounded-md border border-gray-200 overflow-hidden bg-card">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r" rowSpan={2}>No.</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r" rowSpan={2}>Aspek Penilaian</th>
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground border-b" colSpan={data.examiners.length}>Skor Penguji</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                {data.examiners.map((ex: any, i: number) => (
                  <th key={ex.id} className="px-3 py-2 text-center font-semibold text-muted-foreground border-r last:border-0 w-36">
                    <div className="flex flex-col items-center leading-tight gap-1">
                      <span>Penguji {i + 1}</span>
                      <Badge
                        variant={ex.assessmentSubmittedAt ? 'success' : ex.isDraft ? 'warning' : 'secondary'}
                        className="text-[9px] px-1.5 py-0 h-4 font-bold uppercase"
                      >
                        {ex.assessmentSubmittedAt ? 'Sudah Submit' : ex.isDraft ? 'Draf' : 'Belum Isi'}
                      </Badge>
                      <span className="text-[10px] font-normal text-muted-foreground truncate max-w-[110px]" title={ex.lecturerName}>
                        {ex.lecturerName}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {uniqueExaminerGroups.map((group, gIdx) => {
                const groupMaxScore = group.criteria.reduce((s: number, c: any) => s + (Number(c.maxScore) || 0), 0);
                return (
                  <tr key={group.code} className="border-b border-gray-200 hover:bg-muted/5 transition-colors">
                    <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">{gIdx + 1}</td>
                    <td className="px-3 py-2 border-r">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{group.code}</span>
                        <span className="text-muted-foreground">(maks. {groupMaxScore})</span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0 hover:bg-gray-100 rounded-full">
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0 shadow-lg border-gray-200" side="right" align="start">
                            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                              <h4 className="text-xs font-bold text-foreground">Rubrik Penilaian: {group.code}</h4>
                            </div>
                            <div className="p-3 space-y-3">
                              {group.criteria.map((c: any) => (
                                <div key={c.id} className="space-y-1.5">
                                  <div className="text-[11px] font-bold border-b pb-0.5">{c.name}</div>
                                  <div className="space-y-1">
                                    {(c.rubrics || []).map((r: any) => (
                                      <div key={r.id} className="flex gap-2 text-[10px] leading-relaxed">
                                        <span className="font-bold shrink-0 min-w-[30px]">{r.minScore}–{r.maxScore}:</span>
                                        <span className="text-muted-foreground italic">{r.description}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </td>
                    {data.examiners.map((ex: any) => {
                      const exGroup = ex.assessmentDetails?.find((g: any) => g.code === group.code);
                      const score = exGroup?.criteria?.reduce((s: number, c: any) => s + (Number(c.score) || 0), 0) ?? null;
                      return (
                        <td key={ex.id} className="px-3 py-2 text-center border-r last:border-0 font-bold">
                          {formatScoreFraction(score, groupMaxScore)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-b border-gray-200 font-bold bg-gray-50/50">
                <td colSpan={2} className="px-3 py-2.5 text-center border-r uppercase tracking-wider text-[10px] text-muted-foreground">Total Skor Penguji</td>
                {data.examiners.map((ex: any) => (
                  <td key={ex.id} className="px-3 py-2.5 text-center border-r last:border-0 font-bold text-sm">
                    {formatScoreFraction(ex.assessmentScore, examinerMaxScore)}
                  </td>
                ))}
              </tr>
              <tr className="font-bold bg-muted/20 border-b border-gray-200">
                <td colSpan={2} className="px-3 py-2.5 text-center border-r uppercase tracking-wider text-[10px] text-foreground">Rata-Rata Penguji (A)</td>
                <td colSpan={data.examiners.length} className="px-3 py-2.5 text-center text-sm font-black text-foreground">
                  {averageExaminerScore !== null && averageExaminerScore !== undefined ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>{averageExaminerScore.toFixed(2)}</span>
                      <span className="text-xs font-normal text-muted-foreground">/ {examinerMaxScore}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground font-normal italic">Menunggu seluruh penguji submit...</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Examiner Revision Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {data.examiners.map((ex: any, i: number) => {
            if (!ex.revisionNotes) return null;
            const isNoteExpanded = expandedNotes[ex.id] ?? false;
            return (
              <Collapsible
                key={ex.id}
                open={isNoteExpanded}
                onOpenChange={(open) => setExpandedNotes((prev) => ({ ...prev, [ex.id]: open }))}
              >
                <Card className="border-gray-200 bg-card shadow-none">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-2 px-3 border-b border-gray-200 flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                      <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                        Catatan Penguji {i + 1} ({ex.lecturerName})
                      </CardTitle>
                      {isNoteExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="py-3 px-3">
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                        "{ex.revisionNotes}"
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* B. Rekapitulasi Pembimbing */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-foreground">B. Hasil Penilaian Pembimbing</h3>
        <div className="rounded-md border border-gray-200 overflow-hidden bg-card">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r" rowSpan={2}>No.</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r" rowSpan={2}>Aspek Penilaian</th>
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground border-b w-40">Skor</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground">Pembimbing ({data.supervisor.name})</th>
              </tr>
            </thead>
            <tbody>
              {supervisorGroups.length > 0 ? (
                supervisorGroups.map((group: any, gIdx: number) => {
                  const groupMaxScore = group.criteria.reduce((s: number, c: any) => s + (Number(c.maxScore) || 0), 0);
                  const score = group.criteria.reduce((s: number, c: any) => s + (Number(c.score) || 0), 0);
                  return (
                    <tr key={group.code} className="border-b border-gray-200 hover:bg-muted/5 transition-colors">
                      <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">{gIdx + 1}</td>
                      <td className="px-3 py-2 border-r">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{group.code}</span>
                          <span className="text-muted-foreground">(maks. {groupMaxScore})</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{formatScoreFraction(score, groupMaxScore)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b border-gray-200">
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground italic">Pembimbing belum mengisi penilaian</td>
                </tr>
              )}
              <tr className="font-bold bg-muted/20 border-t border-gray-200">
                <td colSpan={2} className="px-3 py-2.5 text-center border-r uppercase tracking-wider text-[10px] text-foreground">Total Skor Pembimbing (B)</td>
                <td className="px-3 py-2.5 text-center text-sm font-black text-foreground">
                  {supervisorScore !== null && supervisorScore !== undefined
                    ? formatScoreFraction(supervisorScore, supervisorMaxScore)
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.supervisorAssessment?.supervisorNotes && (
          <Collapsible
            open={expandedNotes['supervisor'] ?? false}
            onOpenChange={(open) => setExpandedNotes((prev) => ({ ...prev, supervisor: open }))}
            className="w-full mt-2"
          >
            <Card className="border-gray-200 bg-card shadow-none">
              <CollapsibleTrigger asChild>
                <CardHeader className="py-2 px-3 border-b border-gray-200 flex flex-row items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                  <CardTitle className="text-xs font-bold text-foreground flex items-center gap-2">
                    Catatan Pembimbing ({data.supervisor.name})
                  </CardTitle>
                  {expandedNotes['supervisor'] ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="py-3 px-3">
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    "{data.supervisorAssessment.supervisorNotes}"
                  </p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      {/* C. Perhitungan Nilai Akhir */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-foreground">C. Perhitungan Nilai Akhir</h3>
        <div className="rounded-md border border-gray-200 overflow-hidden bg-card">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r">Komponen</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r">Deskripsi Penilaian</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-40">Skor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 hover:bg-muted/5 transition-colors">
                <td className="px-3 py-2 text-center border-r font-bold text-muted-foreground">A</td>
                <td className="px-3 py-2 border-r font-medium">Rata-Rata Nilai Rekapitulasi Penguji</td>
                <td className="px-3 py-2 text-center font-bold">{averageExaminerScore !== null && averageExaminerScore !== undefined ? averageExaminerScore.toFixed(2) : '-'}</td>
              </tr>
              <tr className="border-b border-gray-200 hover:bg-muted/5 transition-colors">
                <td className="px-3 py-2 text-center border-r font-bold text-muted-foreground">B</td>
                <td className="px-3 py-2 border-r font-medium">Nilai Total Penilaian Pembimbing</td>
                <td className="px-3 py-2 text-center font-bold">
                  {supervisorScore !== null && supervisorScore !== undefined
                    ? supervisorScore.toFixed(2)
                    : '-'}
                </td>
              </tr>
              <tr className="font-bold bg-gray-50 border-t-2 border-gray-200">
                <td colSpan={2} className="px-3 py-4 text-center border-r text-sm font-black uppercase tracking-widest text-foreground">
                  Nilai Akhir Sidang (A + B)
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-foreground">{finalScore !== null && finalScore !== undefined ? finalScore.toFixed(2) : '-'}</span>
                    <Badge variant="outline" className="font-bold border-gray-300">{finalGrade}</Badge>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Section */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-base font-bold text-foreground">Hasil Keputusan Sidang TA</h3>
          <p className="rounded-md border border-gray-200 bg-card px-3 py-1.5 text-xs text-muted-foreground">
            Batas Kelulusan Minimal: <span className="font-bold text-foreground">{data.minimumPassingScore}</span>
          </p>
        </div>

        {!data.recommendationUnlocked && !isFinalized && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Penetapan hasil dikunci sampai seluruh penguji (minimal 2) dan pembimbing mengirimkan penilaian.
          </div>
        )}

        {isFinalized ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {FINAL_RECOMMENDATIONS.map((option) => {
                const isSelected = data.defence.status === option.value;
                if (!isSelected) return null;
                const isPassed = option.value === 'passed';
                const isRevision = option.value === 'passed_with_revision';

                const cardClasses = isPassed
                  ? 'border-green-200 bg-green-50/70 text-green-900'
                  : isRevision
                    ? 'border-amber-200 bg-amber-50/70 text-amber-900'
                    : 'border-red-200 bg-red-50/70 text-red-900';

                const textHeaderClasses = isPassed
                  ? 'text-green-800'
                  : isRevision
                    ? 'text-amber-800'
                    : 'text-red-800';

                const textDescClasses = isPassed
                  ? 'text-green-700'
                  : isRevision
                    ? 'text-amber-700'
                    : 'text-red-700';

                const Icon = isPassed ? CheckCircle2 : isRevision ? AlertCircle : XCircle;
                const iconColor = isPassed ? 'text-green-600' : isRevision ? 'text-amber-600' : 'text-red-600';

                return (
                  <div key={option.value} className={`flex items-start gap-3 rounded-lg border p-3.5 ${cardClasses}`}>
                    <Icon className={`h-5 w-5 ${iconColor} mt-0.5 shrink-0`} />
                    <div>
                      <p className={`font-bold ${textHeaderClasses}`}>{option.label}</p>
                      <p className={`text-xs ${textDescClasses} mt-0.5`}>{option.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isSupervisor && data.recommendationUnlocked ? (
          <div className="space-y-4">
            <Card className="border-gray-200 bg-card shadow-none p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Status Kelulusan Berdasarkan Nilai</h4>
                  <p className="text-xs text-muted-foreground">
                    Formulasi Nilai Akhir: {finalScore?.toFixed(2)} (Batas kelulusan: {data.minimumPassingScore})
                  </p>
                </div>
                <Badge variant={isBelowThreshold ? 'destructive' : 'success'} className="px-3 py-1 font-bold">
                  {isBelowThreshold ? 'TIDAK LULUS' : 'LULUS'}
                </Badge>
              </div>

              {!isBelowThreshold ? (
                <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                  <Checkbox
                    id="recommend-revision"
                    checked={recommendRevision}
                    onCheckedChange={(checked) => setRecommendRevision(!!checked)}
                  />
                  <Label htmlFor="recommend-revision" className="text-xs font-medium cursor-pointer">
                    Mahasiswa direkomendasikan menyelesaikan revisi (Lulus dengan Revisi)
                  </Label>
                </div>
              ) : (
                <div className="pt-2 border-t border-gray-200 text-xs font-medium text-red-600">
                  Nilai akhir di bawah batas kelulusan minimal ({data.minimumPassingScore}). Mahasiswa dinyatakan Tidak Lulus.
                </div>
              )}
            </Card>

            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={!canFinalize || finalizeMutation.isPending}
                    className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold px-6 py-5 text-sm"
                  >
                    {finalizeMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Menetapkan...
                      </>
                    ) : (
                      'Tetapkan Hasil Sidang'
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin menetapkan hasil sidang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      {isBelowThreshold
                        ? `Nilai akhir (${finalScore?.toFixed(2)}) berada di bawah batas minimum (${data.minimumPassingScore}). Sidang akan ditetapkan sebagai TIDAK LULUS.`
                        : `Nilai akhir (${finalScore?.toFixed(2)}) memenuhi batas kelulusan. Sidang akan ditetapkan sebagai ${
                            recommendRevision ? 'LULUS DENGAN REVISI' : 'LULUS'
                          }.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={finalizeMutation.isPending}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={finalizeMutation.isPending}
                      className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold"
                      onClick={(e) => {
                        e.preventDefault();
                        void handleFinalize();
                      }}
                    >
                      {finalizeMutation.isPending ? 'Menetapkan...' : 'Ya, Tetapkan Hasil'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
  if (score === null || score === undefined || Number.isNaN(Number(score))) return '-';
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
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa lulus sidang tugas akhir tanpa revisi.' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi', desc: 'Mahasiswa lulus sidang tugas akhir dengan kewajiban menyelesaikan revisi.' },
  { value: 'failed', label: 'Tidak Lulus', desc: 'Mahasiswa belum lulus dan dapat mendaftar kembali untuk sidang berikutnya.' },
];
