import { useEffect, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2, Download } from 'lucide-react';
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
  useDefenceAssessmentForm,
  useSubmitDefenceAssessment,
  useDefenceFinalizationData,
  useFinalizeDefenceBySupervisor,
  useDownloadAssessmentResult,
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
          <SupervisorFinalizationSection defenceId={defenceId} isSupervisor={false} />
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

  const isSubmitted = form.assessorRole === 'examiner'
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

  const handleSubmit = async (isDraft = false) => {
    if (!defenceId || !form) return;
    if (!isDraft && !canSubmit) return;

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
          isDraft,
        },
      });
      toast.success(isDraft ? 'Draft penilaian berhasil disimpan.' : 'Penilaian sidang berhasil dikirim.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menyimpan penilaian.');
    }
  };

  const totalMaxScore = allCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
      {/* Left Column: Form */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">Form Penilaian Sidang TA</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Mode {form.assessorRole === 'examiner' ? 'Penguji' : 'Pembimbing'}
              </Badge>
              {isSubmitted && <Badge variant="success">Sudah Terkirim</Badge>}
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {form.criteriaGroups.map((group, groupIdx) => {
              const groupMaxScore = group.criteria.reduce((sum, c) => sum + (Number(c.maxScore) || 0), 0);
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
                      return (
                        <div key={criterion.id} className="px-4 py-4 flex flex-col gap-2">
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
                                  onOpenChange={() => setOpenRubrics(prev => ({ ...prev, [criterion.id]: !prev[criterion.id] }))}
                                  className="mt-1"
                                >
                                  <CollapsibleTrigger asChild>
                                    <button
                                      type="button"
                                      className="flex items-center gap-1 text-[11px] text-primary hover:underline focus:outline-none font-medium"
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
                                    <div className="mt-2 rounded-md border bg-muted/10">
                                      <table className="w-full text-xs">
                                        <thead>
                                          <tr className="border-b bg-muted/20">
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Range Skor</th>
                                            <th className="px-3 py-1.5 text-left font-semibold text-muted-foreground">Deskripsi</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {criterion.rubrics.map((rubric) => (
                                            <tr key={rubric.id} className="border-b last:border-0">
                                              <td className="px-3 py-1.5 whitespace-nowrap font-semibold">
                                                {rubric.minScore} - {rubric.maxScore}
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
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                min={0}
                                max={criterion.maxScore}
                                value={scores[criterion.id] ?? 0}
                                disabled={isLocked}
                                className="w-20 text-right text-sm font-semibold h-8"
                                onChange={(event) => {
                                  const value = Number(event.target.value || 0);
                                  setScores((prev) => ({ ...prev, [criterion.id]: value }));
                                }}
                              />
                              <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
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
          <Label htmlFor="defenceRevisionNotes" className="font-semibold text-sm">
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
      </div>

      {/* Right Column: Sticky Summary */}
      <div className="flex flex-col gap-4">
        <Card className="bg-card flex flex-col items-center justify-center p-6 text-center shadow-sm">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Total Skor</span>
          <div className="mt-2 flex items-baseline justify-center">
            <span className="text-5xl font-black text-foreground">{totalScore}</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground mt-1">/ {totalMaxScore}</span>
          <Badge className="mt-4 font-semibold" variant={isSubmitted ? 'success' : 'secondary'}>
            {isSubmitted ? 'Sudah Submit' : 'Belum Submit'}
          </Badge>
        </Card>

        <Card className="p-4 flex flex-col gap-3 shadow-sm">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Rincian CPMK</h4>
          <div className="divide-y text-xs">
            {form.criteriaGroups.map((group) => {
              const groupScore = group.criteria.reduce((sum, c) => sum + Number(scores[c.id] || 0), 0);
              const groupMaxScore = group.criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
              return (
                <div key={group.id} className="flex justify-between py-2 font-semibold">
                  <span className="text-muted-foreground">{group.code}</span>
                  <span className="text-foreground font-bold">
                    {groupScore} <span className="text-muted-foreground font-normal">/ {groupMaxScore}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {!isSubmitted && (
          <div className="flex flex-col gap-3 w-full">
            <Button
              variant="outline"
              disabled={submitMutation.isPending}
              onClick={() => void handleSubmit(true)}
              className="w-full py-6 text-sm font-bold border-2"
            >
              {submitMutation.isPending ? (
                <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</>
              ) : (
                'Simpan Draft'
              )}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!canSubmit || submitMutation.isPending}
                  className="w-full py-6 text-sm font-bold shadow-md bg-[#f59e0b] hover:bg-[#d97706] text-white"
                >
                  {submitMutation.isPending ? (
                    <><Spinner className="mr-2 h-4 w-4" />Mengirim...</>
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
                  <AlertDialogAction onClick={() => void handleSubmit(false)}>Ya, Submit</AlertDialogAction>
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
// Section 2: Finalization & Summary (FOR SUPERVISORS & VIEWERS)
// ──────────────────────────────────────────────────────────────

function SupervisorFinalizationSection({ defenceId, isSupervisor }: { defenceId: string; isSupervisor: boolean }) {
  const { data, isLoading } = useDefenceFinalizationData(defenceId);
  const finalizeMutation = useFinalizeDefenceBySupervisor();
  const downloadAssessmentResultMutation = useDownloadAssessmentResult();
  const [needsRevision, setNeedsRevision] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Move useMemo here (before early return)
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
        <Loading size="lg" text="Memuat rekap penilaian..." />
      </div>
    );
  }

  const isFinalized = !!data.defence.resultFinalizedAt;
  const canFinalize =
    isSupervisor &&
    data.supervisor.canFinalize &&
    data.recommendationUnlocked &&
    !isFinalized;

  const examinerScores = data.examiners.map((e: any) => e.assessmentScore).filter((s: any) => s !== null) as number[];
  const averageExaminerScore = examinerScores.length > 0 ? examinerScores.reduce((a, b) => a + b, 0) / examinerScores.length : null;

  const localFinalScore = (averageExaminerScore || 0) + (data.defence.supervisorScore || 0);
  const finalScore = data.defence.finalScore ?? data.defence.computedFinalScore ?? (
    (averageExaminerScore !== null && data.defence.supervisorScore !== null) ? localFinalScore : null
  );
  const finalGrade = data.defence.grade || mapScoreToGrade(finalScore);

  const examinerMaxScore = getMaxScoreFromDetails(data.examiners?.[0]?.assessmentDetails || []) || 70; // fallback to 70
  const supervisorMaxScore = getMaxScoreFromDetails(data.supervisorAssessment?.assessmentDetails || []) || 30; // fallback to 30

  const supervisorGroups = data.supervisorAssessment?.assessmentDetails || [];

  const handleFinalize = async () => {
    if (!defenceId || finalScore === null) return;
    
    let status: FinalizeDefencePayload['status'] = 'failed';
    if (finalScore >= 50) {
      status = needsRevision ? 'passed_with_revision' : 'passed';
    }

    try {
      await finalizeMutation.mutateAsync({
        defenceId,
        payload: { 
          status, // Still send for type compatibility, but backend will recalculate
        },
      });
      toast.success('Hasil sidang berhasil ditetapkan.');
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menetapkan hasil sidang.');
    }
  };

  return (
    <div className="space-y-8">
      {isFinalized && (
        <div className="flex flex-col sm:flex-row gap-4 items-stretch">
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2 bg-muted/20 px-4 py-3 rounded-md border text-xs">
            <span className="text-muted-foreground">
              Sidang ditetapkan pada <span className="font-semibold text-foreground">{formatDateTimeId(data.defence.resultFinalizedAt)}</span>
              {data.defence.resultFinalizedBy && (
                <> oleh <span className="font-semibold text-foreground">{toTitleCaseName(data.defence.resultFinalizedBy)}</span></>
              )}
            </span>
            <div className="flex items-center gap-3">
              <Badge variant="success">
                {data.defence.status === 'passed'
                  ? 'Lulus'
                  : data.defence.status === 'passed_with_revision'
                    ? 'Lulus dengan Revisi'
                    : 'Tidak Lulus'}
              </Badge>
              <span className="text-muted-foreground">
                Skor Akhir: <span className="font-bold text-foreground text-sm">{finalScore?.toFixed(2)}</span>
              </span>
              <Badge className="bg-primary">{finalGrade}</Badge>
            </div>
          </div>

          <Button
            variant="outline"
            className="flex items-center gap-2 h-auto px-5 bg-card border-muted-foreground/20 hover:bg-muted/10 hover:text-primary transition-all text-xs"
            onClick={() => downloadAssessmentResultMutation.mutate(defenceId)}
            disabled={downloadAssessmentResultMutation.isPending}
          >
            {downloadAssessmentResultMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="font-medium">Download Hasil Penilaian</span>
          </Button>
        </div>
      )}

      {/* A. / B. Hasil Rekapitulasi Penguji */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Hasil Rekapitulasi Penilaian Sidang Tugas Akhir dari Penguji</h3>
        <div className="rounded-md border overflow-hidden bg-card">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r" rowSpan={2}>No.</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r" rowSpan={2}>Aspek Penilaian</th>
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground border-b" colSpan={data.examiners.length}>Skor</th>
              </tr>
              <tr className="bg-muted/40 border-b">
                {data.examiners.map((ex: any, i: number) => (
                  <th key={ex.id} className="px-3 py-1 text-center font-semibold text-muted-foreground border-r last:border-0 w-32">
                    <div className="flex flex-col items-center leading-tight">
                      <span>Penguji {i + 1}</span>
                      <span className="text-[10px] font-normal text-muted-foreground mt-0.5 truncate max-w-[110px]" title={ex.lecturerName}>
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
                  <tr key={group.code} className="border-b hover:bg-muted/5 transition-colors">
                    <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">{gIdx + 1}</td>
                    <td className="px-3 py-2 border-r">
                      <span className="font-semibold">{group.code}</span>
                      <span className="text-muted-foreground ml-1">(maks. {groupMaxScore})</span>
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
              <tr className="border-b font-bold bg-muted/10">
                <td colSpan={2} className="px-3 py-3 text-center border-r uppercase tracking-wider text-[10px]">Total Skor Penguji</td>
                {data.examiners.map((ex: any) => (
                  <td key={ex.id} className="px-3 py-3 text-center border-r last:border-0 font-black text-sm">
                    {formatScoreFraction(ex.assessmentScore, examinerMaxScore)}
                  </td>
                ))}
              </tr>
              <tr className="font-bold bg-primary/5">
                <td colSpan={2} className="px-3 py-3 text-center border-r uppercase tracking-wider text-[10px] text-primary">Rata-Rata Penguji (A)</td>
                <td colSpan={data.examiners.length} className="px-3 py-3 text-center text-base text-primary font-black">
                  {averageExaminerScore !== null ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>{averageExaminerScore.toFixed(2)}</span>
                      <span className="text-xs font-normal text-muted-foreground">/ {examinerMaxScore}</span>
                    </div>
                  ) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {data.examiners.map((ex: any, i: number) => {
            if (!ex.revisionNotes) return null;
            const isNoteExpanded = expandedNotes[ex.id] ?? false;
            return (
              <Collapsible
                key={ex.id}
                open={isNoteExpanded}
                onOpenChange={(open) => setExpandedNotes(prev => ({ ...prev, [ex.id]: open }))}
              >
                <Card className="bg-muted/10">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="py-2 px-3 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
                      <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                        Catatan Penguji {i + 1} ({ex.lecturerName})
                      </CardTitle>
                      {isNoteExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="py-3 px-3">
                      <p className="text-xs italic text-foreground/80 whitespace-pre-wrap leading-relaxed">
                        "{ex.revisionNotes}"
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-2 text-right">— {toTitleCaseName(ex.lecturerName)}</p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* C. Hasil Rekapitulasi Pembimbing */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Hasil Rekapitulasi Penilaian Tugas Akhir dari Pembimbing</h3>
        <div className="rounded-md border overflow-hidden bg-card">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r" rowSpan={2}>No.</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r" rowSpan={2}>Aspek Penilaian</th>
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground border-b w-40">Skor</th>
              </tr>
              <tr className="bg-muted/40 border-b">
                <th className="px-3 py-1 text-center font-semibold text-muted-foreground">Pembimbing</th>
              </tr>
            </thead>
            <tbody>
              {supervisorGroups.length > 0 ? (
                supervisorGroups.map((group: any, gIdx: number) => {
                  const groupMaxScore = group.criteria.reduce((s: number, c: any) => s + (Number(c.maxScore) || 0), 0);
                  const score = group.criteria.reduce((s: number, c: any) => s + (Number(c.score) || 0), 0);
                  return (
                    <tr key={group.code} className="border-b hover:bg-muted/5 transition-colors">
                      <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">{gIdx + 1}</td>
                      <td className="px-3 py-2 border-r">
                        <span className="font-semibold">{group.code}</span>
                        <span className="text-muted-foreground ml-1">(maks. {groupMaxScore})</span>
                      </td>
                      <td className="px-3 py-2 text-center font-bold">{formatScoreFraction(score, groupMaxScore)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr className="border-b">
                  <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground italic">Pembimbing belum mengisi penilaian</td>
                </tr>
              )}
              <tr className="font-bold bg-primary/5 border-t">
                <td colSpan={2} className="px-3 py-3 text-center border-r uppercase tracking-wider text-[10px] text-primary">Total Skor Pembimbing (B)</td>
                <td className="px-3 py-3 text-center text-base text-primary font-black">
                  {data.supervisorAssessment?.assessmentScore !== null && data.supervisorAssessment?.assessmentScore !== undefined
                    ? formatScoreFraction(data.supervisorAssessment.assessmentScore, supervisorMaxScore)
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {data.supervisorAssessment?.supervisorNotes && (
          <Collapsible
            open={expandedNotes['supervisor'] ?? false}
            onOpenChange={(open) => setExpandedNotes(prev => ({ ...prev, supervisor: open }))}
            className="w-full"
          >
            <Card className="bg-muted/10">
              <CollapsibleTrigger asChild>
                <CardHeader className="py-2 px-3 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                    Catatan Pembimbing ({data.supervisor.name})
                  </CardTitle>
                  {expandedNotes['supervisor'] ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="py-3 px-3">
                  <p className="text-xs italic text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    "{data.supervisorAssessment.supervisorNotes}"
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2 text-right">— {toTitleCaseName(data.supervisor.name)}</p>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      {/* D. Perhitungan Nilai Akhir */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">Perhitungan Nilai Akhir</h3>
        <div className="rounded-md border overflow-hidden bg-card shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12 border-r">No.</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground border-r">Penilaian</th>
                <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-40">Skor</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/5 transition-colors">
                <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">A</td>
                <td className="px-3 py-2 border-r">Hasil Rekapitulasi Penilaian Sidang Tugas Akhir dari Penguji</td>
                <td className="px-3 py-2 text-center font-bold">{averageExaminerScore !== null ? averageExaminerScore.toFixed(2) : '-'}</td>
              </tr>
              <tr className="border-b hover:bg-muted/5 transition-colors">
                <td className="px-3 py-2 text-center border-r font-medium text-muted-foreground">B</td>
                <td className="px-3 py-2 border-r">Hasil Rekapitulasi Penilaian Tugas Akhir dari Pembimbing</td>
                <td className="px-3 py-2 text-center font-bold">
                  {data.supervisorAssessment?.assessmentScore !== null && data.supervisorAssessment?.assessmentScore !== undefined
                    ? data.supervisorAssessment.assessmentScore.toFixed(2)
                    : '-'}
                </td>
              </tr>
              <tr className="font-bold bg-primary/10 border-t-2 border-primary/20">
                <td colSpan={2} className="px-3 py-4 text-center border-r text-sm font-black uppercase tracking-widest text-primary">
                  Skor Akhir (A + B)
                </td>
                <td className="px-3 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl font-black text-primary">{finalScore !== null ? finalScore.toFixed(2) : '-'}</span>
                    <Badge variant="outline" className="font-bold border-primary/30">{finalGrade}</Badge>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4 pt-6 border-t">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">Hasil Keputusan Sidang</h3>
        </div>

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
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Status Kelulusan Otomatis</h4>
                  <p className="text-xs text-muted-foreground">Berdasarkan akumulasi nilai rata-rata penguji dan pembimbing.</p>
                </div>
                <Badge variant={finalScore !== null && finalScore < 50 ? 'destructive' : 'success'} className="px-3 py-1">
                  {finalScore !== null && finalScore < 50 ? 'GAGAL (Tidak Lulus)' : 'LULUS'}
                </Badge>
              </div>

              {finalScore !== null && finalScore >= 50 && (
                <div className="flex items-center space-x-2 pt-2 border-t border-primary/10">
                  <Checkbox
                    id="needs-revision"
                    checked={needsRevision}
                    onCheckedChange={(checked) => setNeedsRevision(!!checked)}
                  />
                  <Label htmlFor="needs-revision" className="text-xs font-medium cursor-pointer">
                    Mahasiswa direkomendasikan melakukan revisi (Lulus dengan Revisi)
                  </Label>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!canFinalize || finalizeMutation.isPending}>
                    {finalizeMutation.isPending ? <><Spinner className="mr-2 h-4 w-4" />Memproses...</> : 'Tetapkan Hasil Sidang'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menetapkan hasil akhir sidang secara permanen dan tidak dapat diubah lagi.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => void handleFinalize()}>Ya, Tetapkan</AlertDialogAction>
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
