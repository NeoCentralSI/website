import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  User,
  XCircle,
} from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { SeminarStatusBadge } from '@/components/seminar/SeminarStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loading, Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useExaminerAssessmentForm,
  useFinalizeSeminarBySupervisor,
  useLecturerSeminarDetail,
  useSeminarRevisionBoard,
  useSubmitExaminerAssessment,
  useSupervisorFinalizationData,
} from '@/hooks/seminar/useLecturerSeminar';
import { formatDateId, formatDateOnlyId, formatDateTimeId, formatRoleName, toTitleCaseName } from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import type {
  DocumentSubmitStatus,
  FinalizeSeminarPayload,
  SubmitExaminerAssessmentPayload,
  ThesisSeminarStatus,
} from '@/types/seminar.types';
import LecturerSeminarDetailPage from './LecturerSeminarDetail';

function extractSeminarTime(timeIso?: string | null): string {
  if (!timeIso) return '--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

function getDocStatusDisplay(status: DocumentSubmitStatus) {
  switch (status) {
    case 'approved':
      return { icon: CheckCircle, label: 'Disetujui', badge: 'success' as const };
    case 'declined':
      return { icon: XCircle, label: 'Ditolak', badge: 'destructive' as const };
    case 'submitted':
    default:
      return { icon: Clock, label: 'Menunggu', badge: 'warning' as const };
  }
}

const FINAL_RECOMMENDATIONS: { value: FinalizeSeminarPayload['status']; label: string; desc: string }[] = [
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa menyelesaikan seminar hasil dan lulus tanpa revisi.' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi', desc: 'Mahasiswa lulus, namun wajib menyelesaikan revisi.' },
  { value: 'failed', label: 'Gagal', desc: 'Mahasiswa harus mengulang seminar hasil.' },
];

export default function LecturerSeminarDetailOngoingPage() {
  const { seminarId } = useParams<{ seminarId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const { data: detail, isLoading } = useLecturerSeminarDetail(seminarId);

  const [activeTab, setActiveTab] = useState('identity');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [revisionNotes, setRevisionNotes] = useState('');
  const [finalRecommendation, setFinalRecommendation] = useState<ThesisSeminarStatus | ''>('');

  const isOngoing = detail?.status === 'ongoing';
  const showExaminerTab = !!detail?.canOpenExaminerAssessment;
  const showSupervisorTabs = !!detail?.canOpenSupervisorFinalization;

  const { data: examinerForm, isLoading: isExaminerFormLoading } = useExaminerAssessmentForm(
    seminarId && showExaminerTab ? seminarId : undefined,
  );
  const { data: finalizationData, isLoading: isFinalizationLoading } = useSupervisorFinalizationData(
    seminarId && showSupervisorTabs ? seminarId : undefined,
  );
  const { data: revisionBoard, isLoading: isRevisionLoading } = useSeminarRevisionBoard(
    seminarId && showSupervisorTabs ? seminarId : undefined,
  );

  const submitAssessmentMutation = useSubmitExaminerAssessment();
  const finalizeSeminarMutation = useFinalizeSeminarBySupervisor();

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar/lecturer/assignment' },
      { label: 'Detail' },
    ],
    [],
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Seminar Hasil');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  useEffect(() => {
    if (!examinerForm) return;
    const initial: Record<string, number> = {};
    examinerForm.criteriaGroups.forEach((group) => {
      group.criteria.forEach((criterion) => {
        initial[criterion.id] = criterion.score ?? 0;
      });
    });
    setScores(initial);
    setRevisionNotes(examinerForm.examiner.revisionNotes || '');
  }, [examinerForm]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail seminar..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Seminar tidak ditemukan.</div>
      </div>
    );
  }

  if (!isOngoing || (!showExaminerTab && !showSupervisorTabs)) {
    return <LecturerSeminarDetailPage />;
  }

  const totalExaminerScore = Object.values(scores).reduce((sum, value) => sum + Number(value || 0), 0);

  const canSubmitAssessment =
    !!examinerForm &&
    !examinerForm.examiner.assessmentSubmittedAt &&
    examinerForm.criteriaGroups.flatMap((group) => group.criteria).every((criterion) => {
      const value = scores[criterion.id];
      return Number.isFinite(value) && value >= 0 && value <= criterion.maxScore;
    });

  const canFinalize =
    !!finalizationData?.recommendationUnlocked &&
    !!finalRecommendation &&
    !finalizationData?.seminar.resultFinalizedAt;

  const handleSubmitAssessment = async () => {
    if (!seminarId || !examinerForm) return;
    const payload: SubmitExaminerAssessmentPayload = {
      scores: examinerForm.criteriaGroups
        .flatMap((group) => group.criteria)
        .map((criterion) => ({
          assessmentCriteriaId: criterion.id,
          score: Number(scores[criterion.id] ?? 0),
        })),
      revisionNotes,
    };
    await submitAssessmentMutation.mutateAsync({ seminarId, payload });
  };

  const handleFinalize = async () => {
    if (!seminarId || !finalRecommendation) return;
    await finalizeSeminarMutation.mutateAsync({
      seminarId,
      payload: { status: finalRecommendation as FinalizeSeminarPayload['status'] },
    });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{toTitleCaseName(detail.student.name)}</h1>
            <p className="text-gray-500">{detail.student.nim}</p>
          </div>
          <SeminarStatusBadge status={detail.status} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="identity">Identitas</TabsTrigger>
          <TabsTrigger value="assessment">Penilaian</TabsTrigger>
          {showSupervisorTabs && <TabsTrigger value="revision">Revisi</TabsTrigger>}
        </TabsList>

        <TabsContent value="identity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Informasi Tugas Akhir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Judul:</span>
                  <p className="font-medium mt-0.5">{detail.thesis.title}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Pembimbing:</span>
                  <div className="mt-1 space-y-1">
                    {detail.supervisors.map((s, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="text-muted-foreground text-xs min-w-[100px]">{formatRoleName(s.role)}:</span>
                        <span>{toTitleCaseName(s.name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Seminar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Daftar:</span>
                  <span>{detail.registeredAt ? formatDateTimeId(detail.registeredAt) : '-'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground shrink-0">Tanggal Seminar:</span>
                  <span className="text-right">
                    {detail.date
                      ? `${formatDateOnlyId(detail.date)}, ${extractSeminarTime(detail.startTime)} – ${extractSeminarTime(detail.endTime)}`
                      : 'Belum dijadwalkan'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ruangan:</span>
                  <span>{detail.room?.name || '-'}</span>
                </div>
                {detail.examiners.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Penguji:</span>
                    <div className="mt-1 space-y-1">
                      {detail.examiners.map((e) => (
                        <div key={e.id} className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{toTitleCaseName(e.lecturerName)}</span>
                          <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                          {e.availabilityStatus === 'available' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {detail.rejectedExaminers.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Riwayat Penolakan:</span>
                    <div className="mt-1 space-y-1">
                      {detail.rejectedExaminers.map((e) => (
                        <div key={e.id} className="flex items-center gap-2 opacity-60">
                          <XCircle className="h-3 w-3 text-red-400" />
                          <span className="text-xs line-through">{toTitleCaseName(e.lecturerName)}</span>
                          <span className="text-xs text-muted-foreground">(Penguji {e.order})</span>
                          {e.respondedAt && <span className="text-[10px] text-muted-foreground">— {formatDateTimeId(e.respondedAt)}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumen Seminar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {detail.documentTypes.map((dt) => {
                  const doc = detail.documents.find((d) => d.documentTypeId === dt.id);
                  const statusDisplay = doc ? getDocStatusDisplay(doc.status) : null;
                  const canDownload = !!doc?.filePath;
                  return (
                    <div key={dt.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{dt.name}</div>
                          {doc ? (
                            <div className="text-xs text-muted-foreground truncate">{doc.fileName || 'File'} • {formatDateId(doc.submittedAt)}</div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Belum diunggah</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {statusDisplay && <Badge variant={statusDisplay.badge}>{statusDisplay.label}</Badge>}
                        {canDownload && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              try {
                                await openProtectedFile(doc!.filePath!, doc?.fileName || undefined);
                              } catch (error) {
                                toast.error((error as Error).message || 'Gagal membuka dokumen');
                              }
                            }}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          {showExaminerTab && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Penilaian Seminar Hasil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isExaminerFormLoading || !examinerForm ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loading size="lg" text="Memuat form penilaian..." />
                  </div>
                ) : (
                  <>
                    {examinerForm.criteriaGroups.map((group) => (
                      <Card key={group.id} className="border-dashed">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">{group.code} — {group.description}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {group.criteria.map((criterion) => (
                            <div key={criterion.id} className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2 items-center">
                              <div>
                                <Label className="text-sm">{criterion.name}</Label>
                                <p className="text-xs text-muted-foreground">Maksimal {criterion.maxScore} poin</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  max={criterion.maxScore}
                                  value={scores[criterion.id] ?? 0}
                                  disabled={!!examinerForm.examiner.assessmentSubmittedAt}
                                  onChange={(e) => {
                                    const value = Number(e.target.value || 0);
                                    setScores((prev) => ({ ...prev, [criterion.id]: value }));
                                  }}
                                />
                                <span className="text-xs text-muted-foreground">/ {criterion.maxScore}</span>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-muted/20">
                      <CardContent className="pt-4 flex items-center justify-between">
                        <span className="font-medium">Total Skor</span>
                        <span className="text-xl font-bold">{totalExaminerScore}</span>
                      </CardContent>
                    </Card>

                    <div className="space-y-2">
                      <Label htmlFor="revisionNotes">Catatan Penguji</Label>
                      <Textarea
                        id="revisionNotes"
                        rows={5}
                        value={revisionNotes}
                        disabled={!!examinerForm.examiner.assessmentSubmittedAt}
                        onChange={(e) => setRevisionNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={handleSubmitAssessment} disabled={!canSubmitAssessment || submitAssessmentMutation.isPending}>
                        {submitAssessmentMutation.isPending ? (
                          <><Spinner className="mr-2 h-4 w-4" /> Mengirim...</>
                        ) : (
                          'Submit Penilaian'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {showSupervisorTabs && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Penilaian Penguji & Penetapan Hasil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isFinalizationLoading || !finalizationData ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loading size="lg" text="Memuat data penilaian..." />
                  </div>
                ) : (
                  <>
                    {finalizationData.examiners.map((examiner) => (
                      <Card key={examiner.id} className="border-dashed">
                        <CardContent className="pt-4 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName)}</p>
                            <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                              {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                            </Badge>
                          </div>
                          <p className="text-sm">Skor: <span className="font-semibold">{examiner.assessmentScore ?? '-'}</span></p>
                          <p className="text-sm text-muted-foreground">Catatan: {examiner.revisionNotes || '-'}</p>
                          {examiner.assessmentSubmittedAt && (
                            <p className="text-xs text-muted-foreground">Disubmit: {formatDateTimeId(examiner.assessmentSubmittedAt)}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    <Card className="bg-muted/20">
                      <CardContent className="pt-4 flex items-center justify-between">
                        <div>
                          <span className="font-medium">Rata-rata Nilai Penguji</span>
                          {(finalizationData.averageGrade || finalizationData.seminar.grade) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Grade: <span className="font-semibold text-foreground">{finalizationData.averageGrade || finalizationData.seminar.grade}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-2xl font-bold">{finalizationData.averageScore?.toFixed(2) ?? '-'}</span>
                      </CardContent>
                    </Card>

                    {!finalizationData.recommendationUnlocked && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        Fitur rekomendasi akhir terkunci sampai kedua penguji submit penilaian.
                      </div>
                    )}

                    <RadioGroup
                      value={finalRecommendation}
                      onValueChange={(v) => setFinalRecommendation(v as ThesisSeminarStatus)}
                      disabled={!finalizationData.recommendationUnlocked || !!finalizationData.seminar.resultFinalizedAt}
                    >
                      {FINAL_RECOMMENDATIONS.map((item) => (
                        <Label
                          key={item.value}
                          htmlFor={`final-${item.value}`}
                          className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer"
                        >
                          <RadioGroupItem value={item.value} id={`final-${item.value}`} className="mt-1" />
                          <div>
                            <p className="font-medium text-sm">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </Label>
                      ))}
                    </RadioGroup>

                    <div className="flex justify-end">
                      <Button onClick={handleFinalize} disabled={!canFinalize || finalizeSeminarMutation.isPending}>
                        {finalizeSeminarMutation.isPending ? (
                          <><Spinner className="mr-2 h-4 w-4" /> Menetapkan...</>
                        ) : (
                          'Tetapkan Hasil Seminar'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {showSupervisorTabs && (
          <TabsContent value="revision">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Daftar Revisi Seminar</CardTitle>
              </CardHeader>
              <CardContent>
                {isRevisionLoading ? (
                  <div className="flex h-40 items-center justify-center">
                    <Loading size="lg" text="Memuat daftar revisi..." />
                  </div>
                ) : !revisionBoard || revisionBoard.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Belum ada item revisi pada seminar ini.</div>
                ) : (
                  <div className="space-y-2">
                    {revisionBoard.map((item) => (
                      <Card key={item.id} className="border-dashed">
                        <CardContent className="pt-4 space-y-1 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">Penguji {item.examinerOrder ?? '-'}</p>
                            <Badge variant={item.isFinished ? 'success' : 'warning'}>
                              {item.isFinished ? 'Selesai' : 'Proses'}
                            </Badge>
                          </div>
                          <p>{item.description}</p>
                          <p className="text-muted-foreground">Aksi Mahasiswa: {item.revisionAction || '-'}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
