import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, GraduationCap, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useRole } from '@/hooks/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loading, Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogAction, 
  AlertDialogCancel 
} from '@/components/ui/alert-dialog';
import {
  useExaminerAssessmentForm,
  useSubmitExaminerAssessment,
  useSupervisorFinalizationData,
  useFinalizeSeminarBySupervisor,
  useDownloadBeritaAcara,
} from '@/hooks/thesis-seminar';
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
  const { user } = useAuth();
  const { isKadep, isAdmin } = useRole();
  
  const isUserExaminer = !!user?.lecturer?.id && detail?.examiners?.some((e: any) => e.lecturerId === user?.lecturer?.id);
  const isUserSupervisor = !!user?.lecturer?.id && detail?.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);
  const _isKadep = isKadep();
  const _isAdmin = isAdmin();

  const isFinalized = ['passed', 'passed_with_revision', 'failed'].includes(detail?.status);

  // 1. FINALIZED STATE: All authorized roles see the summary matrix
  if (isFinalized) {
    return (
      <div className="space-y-6">
        <SupervisorFinalizationSection
          seminarId={seminarId}
          detail={detail}
          isSupervisor={false} // Hide finalization controls
        />
      </div>
    );
  }

  // 2. ONGOING STATE
  let isOngoing = false;
  if (detail?.status === 'ongoing') {
    isOngoing = true;
  } else if (detail?.status === 'scheduled' && detail.date && detail.startTime) {
    const dateObj = new Date(detail.date);
    const timeObj = new Date(detail.startTime);
    const seminarStart = new Date(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      timeObj.getUTCHours(),
      timeObj.getUTCMinutes()
    );
    isOngoing = new Date() >= seminarStart;
  }

  if (isOngoing) {
    // Only Examiner and Supervisor can see this in Ongoing state
    if (!isUserExaminer && !isUserSupervisor) return null;

    return (
      <div className="space-y-6">
        {isUserExaminer && <ExaminerAssessmentSection seminarId={seminarId} />}
        {isUserSupervisor && (
          <SupervisorFinalizationSection
            seminarId={seminarId}
            detail={detail}
            isSupervisor={true} // Show finalization controls for supervisor
          />
        )}
      </div>
    );
  }

  // 3. Fallback for other states (should be hidden by Tab visibility logic anyway)
  // But if it's admin/kadep/etc. and it's not ongoing yet, we might want to show empty info
  if (_isAdmin || _isKadep) {
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
    if (!form || !form.examiner) return;
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

  if (!form || !form.examiner) {
    return null;
  }

  const isSubmitted = !!form.examiner.assessmentSubmittedAt;
  const isDraft = !isSubmitted && form.examiner.assessmentScore !== null;
  
  const uniqueGroups = [];
  const seenCodes = new Set();
  for (const group of form.criteriaGroups) {
    if (!seenCodes.has(group.code)) {
      seenCodes.add(group.code);
      uniqueGroups.push(group);
    }
  }

  const allCriteria = uniqueGroups.flatMap((g) => g.criteria);
  const totalScore = Object.values(scores).reduce((sum, v) => sum + Number(v || 0), 0);

  const canSubmit =
    !isSubmitted &&
    allCriteria.every((c) => {
      const v = scores[c.id];
      return Number.isFinite(v) && v >= 0 && v <= c.maxScore;
    });

  const canSaveDraft = !isSubmitted;

  const handleSaveDraft = async () => {
    if (!canSaveDraft) return;
    const payload: SubmitExaminerAssessmentPayload = {
      scores: Object.keys(scores).map((cId) => ({
        assessmentCriteriaId: cId,
        score: Number(scores[cId] ?? 0),
      })),
      revisionNotes: revisionNotes || undefined,
      isDraft: true,
    };
    try {
      await submitMutation.mutateAsync({ seminarId, payload });
      toast.success('Draf penilaian berhasil disimpan.');
    } catch {
      toast.error('Gagal menyimpan draf. Silakan coba lagi.');
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const payload: SubmitExaminerAssessmentPayload = {
      scores: allCriteria.map((c) => ({
        assessmentCriteriaId: c.id,
        score: Number(scores[c.id] ?? 0),
      })),
      revisionNotes: revisionNotes || undefined,
      isDraft: false,
    };
    try {
      await submitMutation.mutateAsync({ seminarId, payload });
      toast.success('Penilaian berhasil dikirim.');
    } catch {
      toast.error('Gagal mengirim penilaian. Silakan coba lagi.');
    }
  };

  const { user } = useAuth();
  const totalMaxScore = allCriteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-stretch">
      {/* Left Column */}
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base font-semibold">Penilaian Seminar Hasil</CardTitle>
            <span className="text-xs text-muted-foreground">
              Penguji: <span className="font-semibold text-foreground">{toTitleCaseName(user?.fullName || form.examiner.lecturerName || 'Penguji')}</span>
            </span>
          </CardHeader>
          <CardContent className="p-0 divide-y">
            {uniqueGroups.map((group, groupIdx) => {
              const groupMaxScore = group.criteria.reduce((sum, c) => sum + Number(c.maxScore || 0), 0);
              const groupLetter = String.fromCharCode(65 + groupIdx); // A, B, C...
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
                      const cLetter = String.fromCharCode(97 + cIdx); // a, b, c...
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
                            <div className="flex items-center gap-2 shrink-0">
                              <Input
                                type="number"
                                min={0}
                                max={criterion.maxScore}
                                value={scores[criterion.id] ?? 0}
                                disabled={isSubmitted}
                                className="w-20 text-right text-sm font-semibold h-8"
                                onChange={(e) => {
                                  const value = Number(e.target.value || 0);
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
          <Label htmlFor="revisionNotes" className="font-semibold text-sm">Catatan Penguji</Label>
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
              placeholder="Tuliskan catatan evaluasi untuk mahasiswa..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-4">
        <Card className="bg-card flex flex-col items-center justify-center p-6 text-center">
          <span className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Total Skor</span>
          <div className="mt-2 flex items-baseline justify-center">
            <span className="text-5xl font-black text-foreground">{totalScore}</span>
          </div>
          <span className="text-xs font-semibold text-muted-foreground mt-1">/ {totalMaxScore}</span>
          <Badge className="mt-4 font-semibold" variant={isSubmitted ? 'success' : isDraft ? 'warning' : 'secondary'}>
            {isSubmitted ? 'Sudah Submit' : isDraft ? 'Draf' : 'Belum diisi'}
          </Badge>
        </Card>

        <Card className="p-4 flex flex-col gap-3">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Rincian CPMK</h4>
          <div className="divide-y text-xs">
            {uniqueGroups.map((group) => {
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
              onClick={() => void handleSaveDraft()}
              disabled={!canSaveDraft || submitMutation.isPending}
              variant="outline"
              className="w-full py-6 text-sm font-bold shadow-sm"
            >
              {submitMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={!canSubmit || submitMutation.isPending}
                  className="w-full py-6 text-sm font-bold shadow-md bg-[#f59e0b] hover:bg-[#d97706] text-white"
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
// Section 2: Rekap Penilaian & Finalisasi
// ──────────────────────────────────────────────────────────────

function SupervisorFinalizationSection({ seminarId, detail, isSupervisor }: { seminarId: string; detail: any; isSupervisor: boolean }) {
  const { data: finalData, isLoading: isFinalLoading } = useSupervisorFinalizationData(seminarId);
  const { data: form, isLoading: isFormLoading } = useExaminerAssessmentForm(seminarId);
  const finalizeMutation = useFinalizeSeminarBySupervisor();
  const downloadBeritaAcaraMutation = useDownloadBeritaAcara();

  const [recommendRevision, setRecommendRevision] = useState<boolean>(false);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  if (isFinalLoading || isFormLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat data rekap..." />
      </div>
    );
  }

  if (!finalData || !form) return null;

  const isFinalized = !!finalData.seminar?.resultFinalizedAt;
  const totalMaxScore = form.criteriaGroups.reduce(
    (sum, group) => sum + group.criteria.reduce((gs, c) => gs + Number(c.maxScore || 0), 0),
    0
  );

  const uniqueGroups: typeof form.criteriaGroups = [];
  const seenCodes = new Set<string>();
  for (const group of form.criteriaGroups) {
    if (!seenCodes.has(group.code)) {
      seenCodes.add(group.code);
      uniqueGroups.push(group);
    }
  }

  const finalStatus: ThesisSeminarStatus = (finalData.averageScore || 0) < 55 
    ? 'failed' 
    : recommendRevision 
      ? 'passed_with_revision' 
      : 'passed';

  const canFinalize = isSupervisor && !!finalData.recommendationUnlocked && !isFinalized;

  const handleFinalize = async () => {
    if (!canFinalize) return;
    try {
      await finalizeMutation.mutateAsync({
        seminarId,
        payload: { status: finalStatus as FinalizeSeminarPayload['status'] },
      });
      toast.success('Hasil seminar berhasil ditetapkan.');
    } catch (err) {
      toast.error((err as Error).message || 'Gagal menetapkan hasil. Silakan coba lagi.');
    }
  };

  return (
    <div className="space-y-6">
      {isFinalized && finalData.seminar?.resultFinalizedAt && (
        <div className="flex gap-4 items-stretch">
          <div className="flex-1 flex items-center justify-between flex-wrap gap-2 bg-muted/20 px-4 py-3 rounded-md border text-xs">
            <span className="text-muted-foreground">
              Seminar disetujui pada <span className="font-semibold text-foreground">{formatDateTimeId(finalData.seminar?.resultFinalizedAt || '')}</span>
            </span>
            <div className="flex items-center gap-3">
              <Badge variant="success">
                {finalData.seminar?.status === 'passed' 
                  ? 'Lulus' 
                  : finalData.seminar?.status === 'passed_with_revision' 
                    ? 'Lulus dengan Revisi' 
                    : 'Tidak Lulus'}
              </Badge>
              <span className="text-muted-foreground">
                Rata-rata: <span className="font-bold text-foreground">{finalData.seminar?.finalScore?.toFixed(2)}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">Min. lulus: 55</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center gap-2 h-auto px-5 bg-card border-muted-foreground/20 hover:bg-muted/10 hover:text-primary transition-all text-xs"
            onClick={() => downloadBeritaAcaraMutation.mutate(seminarId)}
            disabled={downloadBeritaAcaraMutation.isPending}
          >
            {downloadBeritaAcaraMutation.isPending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="font-medium">Download Berita Acara</span>
          </Button>
        </div>
      )}

      <div className="rounded-md border overflow-hidden bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/40 border-b">
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-12">No</th>
              <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Aspek Penilaian</th>
              {finalData.examiners?.map((ex) => (
                <th key={ex.id} className="px-3 py-2 text-center font-semibold text-muted-foreground border-l w-36">
                  <div className="flex flex-col items-center leading-tight">
                    <span>Penguji {ex.order}</span>
                    <span className="text-[10px] font-normal text-muted-foreground mt-0.5 truncate max-w-[120px]">
                      {ex.lecturerName}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueGroups?.map((group, gIdx) => {
              const groupLetter = String.fromCharCode(65 + gIdx);
              const groupMaxScore = group.criteria?.reduce((sum, c) => sum + Number(c.maxScore || 0), 0) || 0;
              
              return (
                <React.Fragment key={group.id}>
                  <tr className="bg-muted/10 font-semibold border-b">
                    <td className="px-3 py-2 text-foreground">{groupLetter}</td>
                    <td colSpan={1 + (finalData.examiners?.length || 0)} className="px-3 py-2 text-foreground">
                      {group.code} <span className="text-muted-foreground font-normal">(maksimal nilai = {groupMaxScore})</span>
                    </td>
                  </tr>

                  {/* Group description row - now shows the aggregate scores */}
                  {group.description && (
                    <tr className="border-b hover:bg-muted/5">
                      <td className="px-3 py-2"></td>
                      <td className="px-3 py-2 text-muted-foreground leading-relaxed">
                        {group.description}
                      </td>
                      {finalData.examiners?.map((ex) => {
                        const exGroup = ex.assessmentDetails?.find((g: any) => g.code === group.code);
                        const groupScore = exGroup?.criteria?.reduce((sum: number, c: any) => sum + (c.score || 0), 0) ?? null;
                        
                        return (
                          <td key={ex.id} className="px-3 py-2 text-center border-l font-bold">
                            {groupScore !== null ? (
                              <span>{groupScore}<span className="text-muted-foreground font-normal">/{groupMaxScore}</span></span>
                            ) : (
                              <span className="text-muted-foreground">-/{groupMaxScore}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Render sub-criteria only if there are multiple criteria */}
                  {group.criteria?.length > 1 && group.criteria?.map((criterion, cIdx) => {
                    const cLetter = String.fromCharCode(97 + cIdx);
                    
                    return (
                      <tr key={criterion.id} className="border-b last:border-b-0 hover:bg-muted/5">
                        <td className="px-3 py-2 text-muted-foreground">({cLetter})</td>
                        <td className="px-3 py-2">{criterion.name}</td>
                        {finalData.examiners?.map((ex) => {
                          const exGroup = ex.assessmentDetails?.find((g: any) => g.code === group.code);
                          const exCriterion = exGroup?.criteria?.find((c: any) => c.id === criterion.id);
                          const score = exCriterion ? exCriterion.score : null;
                          
                          return (
                            <td key={ex.id} className="px-3 py-2 text-center border-l font-semibold">
                              {score !== null ? (
                                <span>{score}<span className="text-muted-foreground font-normal">/{criterion.maxScore}</span></span>
                              ) : (
                                <span className="text-muted-foreground">-/{criterion.maxScore}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
            
            <tr className="font-bold bg-muted/30 border-t-2 border-b">
              <td></td>
              <td className="px-3 py-2 text-foreground">Total</td>
              {finalData.examiners?.map((ex) => (
                <td key={ex.id} className="px-3 py-2 text-center border-l font-bold">
                  {ex.assessmentScore !== null ? (
                    <span>{ex.assessmentScore}<span className="text-muted-foreground font-normal">/{totalMaxScore}</span></span>
                  ) : (
                    <span className="text-muted-foreground">-/{totalMaxScore}</span>
                  )}
                </td>
              ))}
            </tr>

            <tr className="font-bold bg-muted/20">
              <td></td>
              <td className="px-3 py-2 text-foreground">Rata-rata</td>
              <td colSpan={finalData.examiners?.length || 0} className="px-3 py-2 text-right border-l text-sm text-green-700">
                {finalData.averageScore !== null ? (
                  <div className="flex items-center justify-end gap-2">
                    <span>{finalData.averageScore?.toFixed(2)}<span className="text-muted-foreground font-normal">/{totalMaxScore}</span></span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${(finalData.averageScore || 0) >= 55 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {(finalData.averageScore || 0) >= 55 ? '✓ Lulus' : '✕ Tidak Lulus'}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-/{totalMaxScore}</span>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {(() => {
        const numExaminers = finalData.examiners?.length || 0;
        const gridColsClass = 
          numExaminers === 1 
            ? 'grid-cols-1' 
            : numExaminers === 2 
              ? 'grid-cols-1 md:grid-cols-2' 
              : numExaminers === 3 
                ? 'grid-cols-1 md:grid-cols-3' 
                : 'grid-cols-1 md:grid-cols-2';
        
        return (
          <div className={`grid ${gridColsClass} gap-4`}>
            {finalData.examiners.map((ex) => {
              const isNoteExpanded = expandedNotes[ex.id] ?? false;
              return (
                <Collapsible
                  key={ex.id}
                  open={isNoteExpanded}
                  onOpenChange={(open) => setExpandedNotes(prev => ({ ...prev, [ex.id]: open }))}
                >
                  <Card className="bg-muted/10">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between cursor-pointer hover:bg-muted/20 transition-colors">
                        <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                          Catatan — Penguji {ex.order} ({ex.lecturerName})
                        </CardTitle>
                        {isNoteExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="py-4 px-5 text-sm text-foreground/90 whitespace-pre-wrap break-words leading-relaxed">
                        {ex.revisionNotes?.trim() || 'Tidak ada catatan.'}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>
        );
      })()}

      {!finalData.recommendationUnlocked && !isFinalized && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Fitur rekomendasi hasil akhir terkunci sampai seluruh penguji submit penilaian.
        </div>
      )}

      {!isFinalized && isSupervisor && finalData.recommendationUnlocked && (
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-semibold text-foreground">Keputusan Seminar</h3>
          <div className="flex flex-col items-end gap-3">
            {(finalData.averageScore || 0) >= 55 ? (
              <div className="flex items-center space-x-2 self-start">
                <Checkbox 
                  id="recommend-revision" 
                  checked={recommendRevision}
                  onCheckedChange={(checked) => setRecommendRevision(!!checked)}
                />
                <Label
                  htmlFor="recommend-revision"
                  className="text-xs font-medium leading-none cursor-pointer text-foreground select-none"
                >
                  Rekomendasikan Revisi
                </Label>
              </div>
            ) : (
              <div className="text-xs text-red-600 self-start font-medium">
                Rata-rata nilai di bawah 55. Mahasiswa dinyatakan Tidak Lulus.
              </div>
            )}
            
            <div className="flex justify-end mt-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={!canFinalize || finalizeMutation.isPending}
                    className="font-semibold"
                  >
                    {finalizeMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Menetapkan...
                      </>
                    ) : (
                      'Tetapkan Hasil Seminar'
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menetapkan hasil akhir seminar secara permanen dan tidak dapat diubah lagi.
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
        </div>
      )}
    </div>
  );
}
