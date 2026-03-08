import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loading, Spinner } from '@/components/ui/spinner';
import { LocalTabsNav } from '@/components/ui/tabs-nav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DefenceStatusBadge } from '@/components/sidang/DefenceStatusBadge';
import {
  useStudentDefenceAssessment,
  useStudentDefenceDetail,
  useStudentDefenceHistory,
  useStudentDefenceOverview,
  useStudentDefenceRevisions,
  useCreateDefenceRevision,
  useSaveDefenceRevisionAction,
  useSubmitDefenceRevisionAction,
  useCancelDefenceRevisionSubmit,
  useDefenceDocumentTypes,
} from '@/hooks/defence';
import {
  formatDateOnlyId,
  formatDateShortId,
  formatDateTimeId,
  formatRoleName,
  toTitleCaseName,
} from '@/lib/text';
import { openProtectedFile } from '@/lib/protected-file';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  ListChecks,
  Plus,
  Send,
} from 'lucide-react';

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

function formatDefenceTime(timeIso?: string | null): string {
  if (!timeIso) return '--';
  const d = new Date(timeIso);
  return `${String(d.getUTCHours()).padStart(2, '0')}.${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

const FINAL_RECOMMENDATIONS = [
  { value: 'passed', label: 'Lulus', desc: 'Mahasiswa lulus sidang tanpa revisi.' },
  { value: 'passed_with_revision', label: 'Lulus dengan Revisi', desc: 'Mahasiswa lulus sidang dengan kewajiban menyelesaikan revisi.' },
  { value: 'failed', label: 'Gagal', desc: 'Mahasiswa belum lulus dan harus mengulang sidang.' },
] as const;

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

export default function StudentDefenceDetail() {
  const { defenceId } = useParams<{ defenceId: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const { data: detail, isLoading } = useStudentDefenceDetail(defenceId);
  const { data: history = [] } = useStudentDefenceHistory();
  const { data: overview } = useStudentDefenceOverview();
  const { data: docTypes = [] } = useDefenceDocumentTypes();
  const { data: assessment, isLoading: assessmentLoading } = useStudentDefenceAssessment(defenceId);
  const { data: revisions = [], isLoading: revisionsLoading } = useStudentDefenceRevisions(defenceId);

  const createRevision = useCreateDefenceRevision(defenceId);
  const saveRevisionAction = useSaveDefenceRevisionAction(defenceId);
  const submitRevisionAction = useSubmitDefenceRevisionAction(defenceId);
  const cancelRevisionSubmit = useCancelDefenceRevisionSubmit(defenceId);

  const [activeTab, setActiveTab] = useState('identitas');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedExaminerId, setSelectedExaminerId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingRevisionId, setEditingRevisionId] = useState<string | null>(null);
  const [revisionActionText, setRevisionActionText] = useState('');
  const [expandedExaminers, setExpandedExaminers] = useState<Record<string, boolean>>({});
  const [isSupervisorExpanded, setIsSupervisorExpanded] = useState(false);

  const breadcrumbs = useMemo(
    () => [
      { label: 'Tugas Akhir', href: '/tugas-akhir' },
      { label: 'Sidang', href: '/tugas-akhir/sidang/student' },
      { label: 'Detail' },
    ],
    []
  );

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Detail Sidang');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail sidang..." />
      </div>
    );
  }

  const fallbackHistory = history.find((item) => item.id === defenceId);

  if (!detail && !fallbackHistory) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground">Data sidang tidak ditemukan.</div>
      </div>
    );
  }

  const effectiveStatus = detail?.status ?? fallbackHistory?.status ?? 'registered';
  const showBeritaAcara = !!(detail?.resultFinalizedAt ?? fallbackHistory?.resultFinalizedAt);
  const showRevisi = effectiveStatus === 'passed_with_revision';
  const supervisors = detail?.thesis.thesisSupervisors ?? [];
  const examiners = detail?.examiners ?? fallbackHistory?.examiners ?? [];
  const docsFromDetail = detail?.documents ?? [];
  const docsFromOverview = overview?.defence?.id === defenceId ? (overview?.defence?.documents ?? []) : [];

  const documentRows = docTypes.map((docType) => {
    const detailDoc = docsFromDetail.find((doc) => doc.documentTypeId === docType.id);
    const fallbackDoc = docsFromOverview.find((doc) => doc.documentTypeId === docType.id);
    const doc = detailDoc || fallbackDoc;

    return {
      documentTypeId: docType.id,
      documentTypeName: docType.name,
      fileName: doc?.fileName || null,
      filePath: doc?.filePath || null,
      status: doc?.status || null,
      submittedAt: doc?.submittedAt || null,
    };
  });

  const unknownDocumentRows = docsFromDetail
    .filter((doc) => !docTypes.some((docType) => docType.id === doc.documentTypeId))
    .map((doc) => ({
      documentTypeId: doc.documentTypeId,
      documentTypeName: doc.documentTypeName || 'Dokumen Sidang',
      fileName: doc.fileName || null,
      filePath: doc.filePath || null,
      status: doc.status,
      submittedAt: doc.submittedAt,
    }));

  const allDocumentRows = [...documentRows, ...unknownDocumentRows];

  const tabs = [
    { label: 'Identitas', value: 'identitas' },
    ...(showBeritaAcara ? [{ label: 'Berita Acara', value: 'berita-acara' }] : []),
    ...(showRevisi ? [{ label: 'Revisi', value: 'revisi' }] : []),
  ];

  const handleCreateRevision = () => {
    if (!detail) return;
    if (!selectedExaminerId || !newDescription.trim()) return;
    createRevision.mutate(
      {
        defenceExaminerId: selectedExaminerId,
        description: newDescription.trim(),
      },
      {
        onSuccess: () => {
          setShowAddForm(false);
          setSelectedExaminerId('');
          setNewDescription('');
        },
      }
    );
  };

  const handleSubmitRevisionAction = (revisionId: string) => {
    if (!revisionActionText.trim()) return;
    submitRevisionAction.mutate(
      {
        revisionId,
        payload: { revisionAction: revisionActionText.trim() },
      },
      {
        onSuccess: () => {
          setEditingRevisionId(null);
          setRevisionActionText('');
        },
      }
    );
  };

  const handleDownloadDocument = async (filePath: string, fileName?: string | null) => {
    try {
      await openProtectedFile(filePath, fileName || undefined);
    } catch (error) {
      toast.error((error as Error).message || 'Gagal membuka dokumen');
    }
  };

  const toggleExaminer = (id: string) => {
    setExpandedExaminers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/tugas-akhir/sidang/student')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Detail Sidang</h1>
            <p className="text-gray-500">{detail?.thesis.title ?? overview?.thesisTitle ?? 'Sidang Tugas Akhir'}</p>
          </div>
          <DefenceStatusBadge status={effectiveStatus} />
        </div>
      </div>

      <LocalTabsNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'identitas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informasi Tugas Akhir
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground shrink-0">Judul:</span>
                  <span className="text-right max-w-[65%]">
                    {detail?.thesis.title ?? overview?.thesisTitle ?? '-'}
                  </span>
                </div>

                {supervisors.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Dosen Pembimbing:</span>
                    {supervisors.map((sup, idx) => (
                      <div key={idx} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">{formatRoleName(sup.role.name)}</span>
                        <span className="text-right">{toTitleCaseName(sup.lecturer.user.fullName)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Informasi Sidang
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal:</span>
                  <span>
                    {(detail?.date ?? fallbackHistory?.date)
                      ? formatDateOnlyId((detail?.date ?? fallbackHistory?.date) as string)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Waktu:</span>
                  <span>
                    {formatDefenceTime(detail?.startTime ?? fallbackHistory?.startTime)} - {formatDefenceTime(detail?.endTime ?? fallbackHistory?.endTime)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ruangan:</span>
                  <span>{detail?.room?.name ?? fallbackHistory?.room?.name ?? '-'}</span>
                </div>

                {examiners.length > 0 && (
                  <div className="space-y-1 pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Dosen Penguji:</span>
                    {examiners.map((examiner) => (
                      <div key={examiner.id} className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Penguji {examiner.order}</span>
                        <span className="text-right">{toTitleCaseName(examiner.lecturerName || '-')}</span>
                      </div>
                    ))}
                  </div>
                )}

                {(detail?.meetingLink ?? fallbackHistory?.meetingLink) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground shrink-0">Link:</span>
                    <a
                      href={(detail?.meetingLink ?? fallbackHistory?.meetingLink) as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      {(detail?.meetingLink ?? fallbackHistory?.meetingLink) as string}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Dokumen Sidang
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allDocumentRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">Belum ada dokumen sidang.</div>
              ) : (
                <div className="space-y-2">
                  {allDocumentRows.map((doc) => (
                    <div
                      key={doc.documentTypeId}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{doc.documentTypeName}</div>
                          {doc.submittedAt ? (
                            <div className="text-xs text-muted-foreground truncate">
                              {doc.fileName || 'File'} • {formatDateShortId(doc.submittedAt)}
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Belum diunggah</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {doc.status && (
                          <Badge
                            variant={
                              doc.status === 'approved'
                                ? 'success'
                                : doc.status === 'declined'
                                  ? 'destructive'
                                  : 'warning'
                            }
                          >
                            {doc.status === 'approved'
                              ? 'Disetujui'
                              : doc.status === 'declined'
                                ? 'Ditolak'
                                : 'Menunggu'}
                          </Badge>
                        )}

                        {doc.filePath && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDownloadDocument(doc.filePath as string, doc.fileName)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'berita-acara' && showBeritaAcara && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Penilaian Penguji & Penetapan Hasil</h2>

          {!!assessment?.defence.resultFinalizedAt && (
            <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              Hasil sidang sudah ditetapkan pada {formatDateTimeId(assessment.defence.resultFinalizedAt)}.
            </div>
          )}

          {assessmentLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loading size="lg" text="Memuat berita acara..." />
            </div>
          ) : (
            <>
                {(assessment?.examiners ?? []).map((examiner) => {
                  const isExpanded = expandedExaminers[examiner.id] ?? false;
                  const hasDetails = (examiner.assessmentDetails ?? []).length > 0;
                  const examinerMaxScore = getMaxScoreFromDetails(examiner.assessmentDetails || []) || 100;

                  return (
                    <Card key={examiner.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">
                            Penilaian Penguji {examiner.order} — {toTitleCaseName(examiner.lecturerName || '-')}
                          </p>
                          <Badge variant={examiner.assessmentSubmittedAt ? 'success' : 'warning'}>
                            {examiner.assessmentSubmittedAt ? 'Sudah Submit' : 'Belum Submit'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total Skor:</span>
                          <span className="font-semibold text-base">{formatScoreFraction(examiner.assessmentScore, examinerMaxScore)}</span>
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
                    {(() => {
                      const supervisorMaxScore = getMaxScoreFromDetails(assessment?.supervisorAssessment.assessmentDetails || []) || 100;
                      const hasSupervisorSubmission =
                        !!assessment?.supervisorAssessment.assessmentSubmittedAt ||
                        assessment?.supervisorAssessment.assessmentScore !== null ||
                        (assessment?.supervisorAssessment.assessmentDetails?.length ?? 0) > 0 ||
                        !!assessment?.supervisorAssessment.supervisorNotes?.trim();

                      return (
                        <>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        Penilaian Pembimbing — {toTitleCaseName(assessment?.supervisorAssessment.name || '-')}
                      </p>
                      <Badge variant={hasSupervisorSubmission ? 'success' : 'warning'}>
                        {hasSupervisorSubmission ? 'Sudah Submit' : 'Belum Submit'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Skor:</span>
                      <span className="font-semibold text-base">
                        {formatScoreFraction(
                          assessment?.supervisorAssessment.assessmentScore ??
                            (assessment?.supervisorAssessment.assessmentDetails ?? []).reduce(
                              (sum, group) =>
                                sum + group.criteria.reduce((groupSum, criterion) => groupSum + Number(criterion.score || 0), 0),
                              0,
                            ),
                          supervisorMaxScore,
                        )}
                      </span>
                    </div>

                    {hasSupervisorSubmission && (
                      <p className="text-xs text-muted-foreground">
                        Disubmit: {formatDateTimeId(assessment?.supervisorAssessment.assessmentSubmittedAt || assessment?.defence.resultFinalizedAt || null)}
                      </p>
                    )}

                    {(assessment?.supervisorAssessment.assessmentDetails?.length ?? 0) > 0 && (
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
                            {(assessment?.supervisorAssessment.assessmentDetails ?? []).map((group) => (
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

                    {hasSupervisorSubmission && (
                      <div className="rounded-md border bg-muted/20 px-3 py-2">
                        <p className="text-xs font-medium text-muted-foreground">Catatan Pembimbing</p>
                        <p className="mt-1 text-sm whitespace-pre-wrap break-words">
                          {assessment?.supervisorAssessment.supervisorNotes?.trim() || 'Tidak ada catatan.'}
                        </p>
                      </div>
                    )}
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                <Card className="bg-muted/20">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <span className="font-medium">Skor Akhir</span>
                    {(() => {
                      const examinerMaxScore = getMaxScoreFromDetails(assessment?.examiners?.[0]?.assessmentDetails || []) || 100;
                      const supervisorMaxScore = getMaxScoreFromDetails(assessment?.supervisorAssessment.assessmentDetails || []) || 100;
                      const finalMaxScore = examinerMaxScore + supervisorMaxScore;
                      const finalScore = assessment?.defence.finalScore ?? null;
                      const finalGrade = assessment?.defence.grade || mapScoreToGrade(finalScore);

                      return (
                    <span className="text-2xl font-bold">
                          {finalScore !== null && finalScore !== undefined
                            ? `${formatScoreFraction(finalScore, finalMaxScore)} (${finalGrade})`
                            : `- / ${finalMaxScore}`}
                    </span>
                      );
                    })()}
                  </CardContent>
                </Card>

                {!!assessment?.defence.resultFinalizedAt && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">Keputusan Akhir</h3>
                    {FINAL_RECOMMENDATIONS.map((item) => {
                      const isSelected = assessment.defence.status === item.value;
                      return (
                        <div
                          key={item.value}
                          className={`flex items-center gap-3 rounded-lg border p-3 ${isSelected ? 'border-green-300 bg-green-50' : 'opacity-50'}`}
                        >
                          {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                          <div>
                            <p className={`font-medium text-sm ${isSelected ? 'text-green-700' : ''}`}>{item.label}</p>
                            <p className={`text-xs ${isSelected ? 'text-green-600' : 'text-muted-foreground'}`}>{item.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
            </>
          )}
        </div>
      )}

      {activeTab === 'revisi' && showRevisi && (
        <div className="space-y-4">
          {revisionsLoading ? (
            <div className="flex h-52 items-center justify-center">
              <Loading size="lg" text="Memuat data revisi..." />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ListChecks className="h-5 w-5" />
                  Daftar Revisi
                </h2>
                <Button
                  size="sm"
                  variant={showAddForm ? 'outline' : 'default'}
                  disabled={!detail}
                  onClick={() => setShowAddForm((prev) => !prev)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Tambah Revisi
                </Button>
              </div>

              {showAddForm && (
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Penguji</Label>
                      <Select value={selectedExaminerId} onValueChange={setSelectedExaminerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih penguji" />
                        </SelectTrigger>
                        <SelectContent>
                          {(detail?.examiners ?? []).map((examiner) => (
                            <SelectItem key={examiner.id} value={examiner.id}>
                              Penguji {examiner.order}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi Revisi</Label>
                      <Textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={3}
                        placeholder="Tuliskan item revisi yang harus dikerjakan..."
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowAddForm(false);
                          setSelectedExaminerId('');
                          setNewDescription('');
                        }}
                      >
                        Batal
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCreateRevision}
                        disabled={!selectedExaminerId || !newDescription.trim() || createRevision.isPending}
                      >
                        {createRevision.isPending ? (
                          <>
                            <Spinner className="mr-2 h-4 w-4" />
                            Menyimpan...
                          </>
                        ) : (
                          'Simpan'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {revisions.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-sm text-muted-foreground">
                    Belum ada item revisi.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {revisions.map((revision, idx) => (
                    <Card key={revision.id}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">#{idx + 1}</span>
                            <Badge variant="outline">Penguji {revision.examinerOrder ?? '-'}</Badge>
                            <span className="text-xs text-muted-foreground">
                              ({toTitleCaseName(revision.examinerName || '-')})
                            </span>
                          </div>
                          <Badge variant={revision.isFinished ? 'success' : revision.studentSubmittedAt ? 'warning' : 'secondary'}>
                            {revision.isFinished
                              ? 'Diverifikasi'
                              : revision.studentSubmittedAt
                                ? 'Menunggu Verifikasi'
                                : 'Belum Diisi'}
                          </Badge>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Deskripsi:</p>
                          <p className="text-sm whitespace-pre-wrap">{revision.description}</p>
                        </div>

                        {revision.isFinished ? (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Perbaikan:</p>
                            <p className="text-sm whitespace-pre-wrap">{revision.revisionAction || '-'}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Diverifikasi pada {formatDateTimeId(revision.supervisorApprovedAt || null)}
                            </p>
                          </div>
                        ) : editingRevisionId === revision.id ? (
                          <div className="space-y-2">
                            <Label className="text-xs">Perbaikan Yang Dilakukan</Label>
                            <Textarea
                              value={revisionActionText}
                              onChange={(e) => setRevisionActionText(e.target.value)}
                              rows={3}
                              placeholder="Jelaskan perbaikan yang Anda lakukan..."
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingRevisionId(null);
                                  setRevisionActionText('');
                                }}
                              >
                                Batal
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!revisionActionText.trim() || saveRevisionAction.isPending}
                                onClick={() =>
                                  saveRevisionAction.mutate({
                                    revisionId: revision.id,
                                    payload: { revisionAction: revisionActionText.trim() },
                                  })
                                }
                              >
                                {saveRevisionAction.isPending ? (
                                  <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menyimpan...
                                  </>
                                ) : (
                                  'Simpan Draft'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                disabled={!revisionActionText.trim() || submitRevisionAction.isPending}
                                onClick={() => handleSubmitRevisionAction(revision.id)}
                              >
                                {submitRevisionAction.isPending ? (
                                  <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Mengirim...
                                  </>
                                ) : (
                                  <>
                                    <Send className="h-4 w-4 mr-1" />
                                    Submit
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : revision.studentSubmittedAt ? (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground mb-1">Perbaikan:</p>
                            <p className="text-sm whitespace-pre-wrap">{revision.revisionAction || '-'}</p>
                            <p className="text-xs text-muted-foreground">
                              Disubmit: {formatDateTimeId(revision.studentSubmittedAt)}
                            </p>
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={cancelRevisionSubmit.isPending}
                                onClick={() => cancelRevisionSubmit.mutate(revision.id)}
                              >
                                {cancelRevisionSubmit.isPending ? (
                                  <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Membatalkan...
                                  </>
                                ) : (
                                  'Batal Submit'
                                )}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRevisionId(revision.id);
                              setRevisionActionText(revision.revisionAction || '');
                            }}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Isi Perbaikan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
