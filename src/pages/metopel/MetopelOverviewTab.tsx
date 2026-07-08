import { useMutation, useQuery } from "@tanstack/react-query";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { metopenTitleService } from "@/services/metopenTitle.service";
import type { StudentArchiveData, StudentArchiveScoreDetail } from "@/services/metopenTitle.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, ClipboardList, FileCheck2, Stamp, Users, FileText, Download, Archive, ScrollText } from "lucide-react";
import { toast } from "sonner";
import { formatDateId } from "@/lib/text";
import { formatAdvisorRouteCode, formatAdvisorRouteProcessing } from "@/lib/advisorRoute";

type AdvisorAccessState = NonNullable<ReturnType<typeof useAdvisorAccessState>["data"]>;

interface MetopelOverviewTabProps {
  /**
   * BR-23 (canon §5.13): readOnly = true menandai mode arsip pasca promosi aktif TA.
   * Mode arsip wajib menampilkan substansi awal + detail rubrik + dokumen TA-04.
   */
  readOnly?: boolean;
  advisorAccess?: AdvisorAccessState;
}

type ProposalStatus = "accepted" | "submitted" | "rejected" | null;
type StudentArchiveScore = NonNullable<NonNullable<StudentArchiveData>["score"]>;
type ProposalQueueReadiness = {
  ready: boolean;
  block: string | null;
  proposalStatus: string | null;
} | null;
type SeminarEligibilitySnapshot = {
  eligible?: boolean;
  reason?: string;
  requirements?: {
    metopelPassed?: boolean;
    metopelScore?: number | null;
    proposalAccepted?: boolean;
    proposalStatus?: string | null;
  };
};

function buildProposalStatusUi(
  proposalStatus: ProposalStatus,
  queueReadiness: ProposalQueueReadiness,
  ta04IssuedAt?: string | null,
) {
  if (proposalStatus === "accepted") {
    return { label: "Beban Aktif TA", variant: "default" as const };
  }
  if (ta04IssuedAt) {
    return { label: "TA-04 Terbit, Booking", variant: "secondary" as const };
  }
  if (proposalStatus === "submitted") {
    return { label: "Legacy Review KaDep", variant: "secondary" as const };
  }
  if (proposalStatus === "rejected") {
    return { label: "Ditolak", variant: "outline" as const };
  }

  switch (queueReadiness?.block) {
    case "ta_course_not_confirmed":
      return { label: "Menunggu MK Tugas Akhir SIA", variant: "secondary" as const };
    case "scores_not_finalized":
    case "missing_scores":
      return { label: "Menunggu TA-03 Final", variant: "outline" as const };
    case "metopel_auto_zeroed":
      return { label: "Tidak Lolos Presensi Metopel", variant: "destructive" as const };
    case "proposal_final_not_submitted":
      return { label: "Menunggu Proposal Final", variant: "outline" as const };
    case null:
    case undefined:
      return queueReadiness?.ready
        ? { label: "Siap Promosi Aktif", variant: "secondary" as const }
        : { label: "Belum Siap Promosi", variant: "outline" as const };
    default:
      return { label: "Belum Siap Promosi", variant: "outline" as const };
  }
}

function getProposalQueueDescription(
  proposalStatus: ProposalStatus,
  queueReadiness: ProposalQueueReadiness,
  ta04IssuedAt?: string | null,
) {
  if (proposalStatus === "accepted") {
    return "TA-03 final dan KRS Tugas Akhir sudah terkonfirmasi. Status pembimbing sudah menjadi beban aktif TA.";
  }
  if (ta04IssuedAt) {
    return "Formulir TA-04 awal sudah terbit sebagai SK penugasan pembimbing. Anda tetap berada di fase Metopel sampai TA-03 final dan KRS Tugas Akhir terkonfirmasi dari SIA.";
  }
  if (proposalStatus === "submitted") {
    return "Judul/proposal masuk antrean legacy KaDep. Proses baru memakai TA-04 awal dan promosi otomatis.";
  }

  switch (queueReadiness?.block) {
    case "ta_course_not_confirmed":
      return "Nilai TA-03 sudah final, tetapi promosi aktif belum berjalan karena snapshot SIA belum mencatat Anda mengambil mata kuliah Tugas Akhir.";
    case "scores_not_finalized":
      return "Promosi aktif menunggu TA-03A, co-sign Pembimbing 2 bila ada, dan TA-03B difinalisasi.";
    case "missing_scores":
      return "Promosi aktif menunggu nilai TA-03A dan TA-03B tersedia.";
    case "metopel_auto_zeroed":
      return "Presensi Metopel kurang dari 75%, sehingga booking TA-04 awal akan dilepas pada siklus ini.";
    case "proposal_final_not_submitted":
      return "Submit proposal final terlebih dahulu agar TA-03A dan TA-03B dapat dinilai.";
    default:
      return "TA-04 awal diterbitkan batch oleh KaDep setelah booking pembimbing disetujui. Beban aktif berpindah otomatis setelah TA-03 final dan snapshot KRS TA.";
  }
}

export function MetopelOverviewTab({ readOnly = false, advisorAccess: advisorAccessFromParent }: MetopelOverviewTabProps) {
  const { isStudent } = useRole();
  const {
    data: queriedAdvisorAccess,
    isLoading,
  } = useAdvisorAccessState(isStudent() && !advisorAccessFromParent);
  const advisorAccess = advisorAccessFromParent ?? queriedAdvisorAccess;
  const hasLifecycleContext = Boolean(
    advisorAccess?.hasOfficialSupervisor ||
    advisorAccess?.thesisId ||
    readOnly,
  );

  const { data: proposalApproval } = useQuery({
    queryKey: ["metopel-proposal-approval"],
    queryFn: async () => {
      const response = await metopenTitleService.getMyProposalApproval();
      return response.data.thesis;
    },
    enabled: hasLifecycleContext,
  });

  const { data: seminarEligibility } = useQuery({
    queryKey: ["metopel-seminar-eligibility"],
    queryFn: async () => {
      const response = await metopenTitleService.getMySeminarEligibilitySnapshot();
      return response.data as SeminarEligibilitySnapshot;
    },
    enabled: !!advisorAccess?.hasOfficialSupervisor || readOnly,
  });

  // Riwayat TA-03 untuk masa transisi setelah dinilai, sebelum TA-04/arsip aktif.
  const { data: assessmentHistory } = useQuery({
    queryKey: ["metopel-assessment-history"],
    queryFn: async () => (await metopenTitleService.getMyAssessmentHistory()).data,
    enabled: !readOnly && !!advisorAccess?.hasOfficialSupervisor,
  });

  // BR-23: Arsip Metopel — fetch hanya saat mode arsip aktif (TA-04 sudah disahkan).
  const { data: archive } = useQuery({
    queryKey: ["metopel-archive-detail"],
    queryFn: async () => (await metopenTitleService.getMyArchive()).data,
    enabled: readOnly && hasLifecycleContext,
  });

  const downloadTa04Mutation = useMutation({
    mutationFn: () => metopenTitleService.downloadMyTitleApprovalDocument(),
    onSuccess: () => toast.success("Formulir TA-04 berhasil diunduh."),
    onError: (err: Error) => toast.error(err.message || "Gagal mengunduh Formulir TA-04."),
  });

  if (!advisorAccessFromParent && isLoading) return <Loading />;

  const proposalStatus = (proposalApproval?.proposalStatus ?? null) as ProposalStatus;
  const queueReadiness = proposalApproval?.queueReadiness ?? null;
  const ta04IssuedAt = proposalApproval?.ta04AssignmentIssuedAt ?? null;
  const proposalStatusUi = buildProposalStatusUi(proposalStatus, queueReadiness, ta04IssuedAt);
  const proposalQueueDescription = getProposalQueueDescription(proposalStatus, queueReadiness, ta04IssuedAt);

  // Canon §5.2 (audit F-6.1): escalated = TA-01 (Path C), bukan TA-02. Pakai helper terpusat.
  const initialRouteCode = formatAdvisorRouteCode(advisorAccess?.blockingRequest?.routeType);

  const initialRouteStatus = advisorAccess?.hasOfficialSupervisor
    ? "Pembimbing sudah ditetapkan"
    : advisorAccess?.hasBlockingRequest
      ? formatAdvisorRouteProcessing(advisorAccess.blockingRequest?.routeType)
      : "Pilih jalur yang sesuai";

  const thesisTitleSummary = advisorAccess?.thesisTitle
    ? ` Judul awal tercatat: ${advisorAccess.thesisTitle}.`
    : " Judul awal belum tercatat di SIMPTA.";
  const metopenAccessSummary =
    advisorAccess?.eligibleMetopen === true
      ? "Akses Metopen aktif dari sinkronisasi SIA."
      : advisorAccess?.eligibleMetopen === false
        ? "Akses pengajuan Metopen belum terbuka dari sinkronisasi SIA."
        : null;
  const seminarRequirements = seminarEligibility?.requirements;

  const initialRouteDescription =
    advisorAccess?.blockingRequest?.routeType === "escalated"
      ? `Escalated TA-01 dipakai saat mahasiswa tetap kokoh memilih dosen yang kuota normalnya penuh; KaDep memutuskan setelah dosen memberi proyeksi lulus.${thesisTitleSummary}`
      : advisorAccess?.blockingRequest?.routeType === "dept"
        ? `TA-02 dipakai saat mahasiswa belum memiliki calon dosen pembimbing — departemen meninjau usulan dan menetapkan dosen pembimbing.${thesisTitleSummary}`
        : advisorAccess?.blockingRequest?.routeType === "normal"
          ? `TA-01 dipakai saat mahasiswa sudah memiliki calon dosen pembimbing yang bersedia dan mengajukan awal judul melalui SIMPTA.${thesisTitleSummary}`
          : `TA-01 dipakai saat mahasiswa sudah memiliki calon dosen pembimbing yang bersedia. TA-02 dipakai saat mahasiswa belum memiliki calon dosen pembimbing atau saat usulan perlu diproses melalui departemen.${thesisTitleSummary}`;

  const stepCards = [
    {
      code: initialRouteCode,
      title: "Pengajuan Awal Pembimbing dan Judul",
      icon: Users,
      status: initialRouteStatus,
      description: initialRouteDescription,
    },
    {
      code: "Proposal Final",
      title: "Submit Proposal Final",
      icon: FileCheck2,
      status: !advisorAccess?.hasOfficialSupervisor
        ? "Menunggu pembimbing resmi"
        : proposalStatus === "submitted" || proposalStatus === "accepted" || Boolean(ta04IssuedAt)
          ? "Proposal final masuk alur KaDep"
          : "Submit versi proposal final",
      description:
        "Setelah pembimbing resmi ditetapkan, mahasiswa mengunggah versi proposal dan menetapkan satu versi sebagai proposal final aktif.",
    },
    {
      code: "TA-03A / TA-03B",
      title: "Penilaian Proposal Lengkap",
      icon: ClipboardList,
      // Audit Fase 0: hindari label "lulus/tidak lulus" karena canon §5.7 hanya
      // bicara skor agregat (75+25). UI cukup tampilkan skor dan status finalisasi.
      status: seminarRequirements?.metopelScore != null
        ? `Skor akhir ${seminarRequirements.metopelScore}/100`
        : advisorAccess?.hasOfficialSupervisor
          ? "Menunggu penilaian proposal"
          : "Menunggu pembimbing resmi",
      description:
        seminarEligibility?.reason ??
        "TA-03A diisi Pembimbing 1 (master) + co-sign Pembimbing 2 (jika ada). TA-03B diisi Koordinator Metopen. Berjalan paralel; nilai immutable pasca submit.",
    },
    {
      code: "TA-04",
      title: "TA-04 Awal & Promosi Aktif",
      icon: Stamp,
      status: proposalStatusUi.label,
      description: proposalQueueDescription,
    },
  ];

  const getStepStatus = (index: number): 'completed' | 'current' | 'upcoming' => {
    const hasAdvisor = !!advisorAccess?.hasOfficialSupervisor;
    const hasScore = seminarEligibility?.requirements?.metopelScore != null;
    const isApproved = proposalStatus === 'accepted';

    if (isApproved) return 'completed';
    if (ta04IssuedAt) return index <= 2 ? 'completed' : 'current';
    if (hasScore) return index <= 2 ? 'completed' : 'current';
    if (proposalStatus === 'submitted') return index <= 1 ? 'completed' : index === 2 ? 'current' : 'upcoming';
    if (hasAdvisor) return index === 0 ? 'completed' : index === 1 ? 'current' : 'upcoming';
    if (advisorAccess?.hasBlockingRequest) return index === 0 ? 'current' : 'upcoming';
    return index === 0 ? 'current' : 'upcoming';
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium text-blue-900">Status Tahap Awal Tugas Akhir</p>
          <p className="text-blue-800">
            {advisorAccess?.reason ??
              "Pantau pembimbing, judul awal, penilaian proposal, dan pengesahan judul sebelum lanjut ke fase Tugas Akhir penuh."}
          </p>
          {metopenAccessSummary && <p className="text-xs text-blue-700">{metopenAccessSummary}</p>}
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {stepCards.map((step, index) => {
          const Icon = step.icon;
          const status = getStepStatus(index);
          const cardClass =
            status === 'completed'
              ? 'border-emerald-200 bg-emerald-50/30'
              : status === 'current'
                ? 'border-primary/50 ring-1 ring-primary/20'
                : '';
          return (
            <Card key={step.code} className={cardClass}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {status === 'completed' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    {step.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    {step.code}
                  </Badge>
                </div>
                <Badge variant="secondary" className="text-xs w-fit mt-1">
                  {step.status}
                </Badge>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasLifecycleContext && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status TA-04 Awal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Judul saat ini</p>
                <p className="font-medium">
                  {proposalApproval?.title || advisorAccess?.thesisTitle || "Judul belum tersedia"}
                </p>
              </div>
              <Badge variant={proposalStatusUi.variant} className="text-xs">
                {proposalStatusUi.label}
              </Badge>
            </div>

            {proposalApproval?.proposalReviewNotes && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <strong>Catatan reviewer:</strong> {proposalApproval.proposalReviewNotes}
              </div>
            )}

            {proposalApproval?.titleApprovalDocument && (
              <div className="flex flex-col gap-2 rounded-md border bg-background px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Formulir TA-04 awal</p>
                  <p className="truncate text-sm font-medium">{proposalApproval.titleApprovalDocument.fileName}</p>
                  {proposalApproval.ta04AssignmentIssuedAt && (
                    <p className="text-xs text-muted-foreground">
                      Diterbitkan {formatDateId(proposalApproval.ta04AssignmentIssuedAt)}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTa04Mutation.mutate()}
                  disabled={downloadTa04Mutation.isPending}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  {downloadTa04Mutation.isPending ? "Mengunduh..." : "Unduh PDF"}
                </Button>
              </div>
            )}

            {/* P1-13 (canon §5.10): Tombol "Sinkronkan Status" dihapus karena
                lifecycle TA-04/promosi aktif berjalan otomatis dari SIA sync dan
                nilai TA-03 final. Mahasiswa tidak perlu lapor manual. */}
            <p className="text-xs text-muted-foreground">
              {proposalQueueDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {!readOnly && assessmentHistory?.score && (
        <AssessmentHistorySection history={assessmentHistory} />
      )}

      {/* BR-23 (canon §5.13): Arsip Metopel pasca promosi aktif — read-only single source of truth.
          4 kategori: substansi awal TA-01/02, detail rubrik TA-03A & TA-03B, Formulir TA-04. */}
      {readOnly && archive && <ArchiveSection archive={archive} />}
    </div>
  );
}

/**
 * BR-23: Surface arsip Metopel pasca promosi aktif TA. Read-only.
 */
function ArchiveSection({ archive }: { archive: NonNullable<StudentArchiveData> }) {
  const { advisorRequests, score, titleApproval } = archive;
  const ta04Document = titleApproval?.document;

  // FR-ARC-05: Unduh Formulir TA-04 via endpoint stream terautentikasi (bukan <a href>
  // ke /uploads/documents yang tidak disajikan statis + tidak melampirkan token).
  const downloadSkMutation = useMutation({
    mutationFn: () => metopenTitleService.downloadMyTitleApprovalDocument(),
    onSuccess: () => toast.success("Formulir TA-04 berhasil diunduh."),
    onError: (err: Error) => toast.error(err.message || "Gagal mengunduh Formulir TA-04."),
  });

  const { ta03aDetails, ta03bDetails } = splitScoreDetails(score);

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-emerald-700" />
          <div>
            <CardTitle className="text-base">Arsip Penilaian Proposal &amp; Dokumen TA-04</CardTitle>
            <CardDescription>
              Sesuai canon §5.13, SIMPTA dirancang sebagai Single Source of Truth — Anda berhak melihat substansi pengajuan awal, feedback rubrik detail, dan mengunduh Formulir TA-04 setelah batch periode difinalisasi.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" className="space-y-2">
          {/* (1) Substansi pengajuan awal TA-01/TA-02 */}
          <AccordionItem value="advisor-requests" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <ScrollText className="h-4 w-4" /> 1. Substansi Pengajuan Awal TA-01 / TA-02
                <Badge variant="outline" className="text-[10px]">
                  {advisorRequests.length} histori
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-3">
              {advisorRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground">Tidak ada histori pengajuan tercatat.</p>
              ) : (
                advisorRequests.map((req) => (
                  <div key={req.id} className="rounded-md border bg-muted/30 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {req.requestType === 'ta_02' ? 'TA-02 Jalur Dept' : 'TA-01'} · {formatDateId(req.createdAt)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">{req.status}</Badge>
                    </div>
                    <p><strong>Judul:</strong> {req.proposedTitle || '-'}</p>
                    {req.lecturer?.user?.fullName && (
                      <p><strong>Dosen tujuan:</strong> {req.lecturer.user.fullName}</p>
                    )}
                    {req.topic?.name && <p><strong>Topik:</strong> {req.topic.name}</p>}
                    {req.backgroundSummary && (
                      <p><strong>Latar belakang:</strong> {req.backgroundSummary}</p>
                    )}
                    {req.problemStatement && (
                      <p><strong>Tujuan / permasalahan:</strong> {req.problemStatement}</p>
                    )}
                    {req.proposedSolution && (
                      <p><strong>Rencana solusi:</strong> {req.proposedSolution}</p>
                    )}
                    {req.researchObject && (
                      <p><strong>Objek penelitian:</strong> {req.researchObject}</p>
                    )}
                    {req.justificationText && (
                      <p><strong>Justifikasi:</strong> {req.justificationText}</p>
                    )}
                  </div>
                ))
              )}
            </AccordionContent>
          </AccordionItem>

          {/* (2) Detail rubrik TA-03A */}
          <AccordionItem value="ta03a" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> 2. Feedback Rubrik TA-03A (Pembimbing)
                <Badge variant="outline" className="text-[10px]">
                  {score?.supervisorScore != null ? `${score.supervisorScore}/75` : '-'}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {score?.supervisorName && (
                <p className="text-xs">
                  <strong>Pembimbing 1 (master):</strong> {score.supervisorName}
                </p>
              )}
              {score?.coSignerName && (
                <p className="text-xs">
                  <strong>Pembimbing 2 (co-sign):</strong> {score.coSignerName}
                  {score.coSignedAt ? ` · ${formatDateId(score.coSignedAt)}` : ''}
                </p>
              )}
              {score?.coSignNote && (
                <p className="text-xs text-muted-foreground">Catatan co-sign: {score.coSignNote}</p>
              )}
              {ta03aDetails.length === 0 ? (
                <p className="text-xs text-muted-foreground">Detail rubrik TA-03A belum tersedia.</p>
              ) : (
                <div className="space-y-2">
                  {ta03aDetails.map((d) => (
                    <div key={`${d.researchMethodScoreId}-${d.assessmentCriteriaId}`} className="rounded-md border bg-muted/30 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{d.criteria?.metopenCpmk?.code ? `${d.criteria.metopenCpmk.code} — ` : ''}{d.criteria?.name ?? 'Kriteria'}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {d.score}/{d.criteria?.maxScore ?? '?'}
                        </Badge>
                      </div>
                      {d.assessmentRubric?.description && (
                        <p className="mt-1 text-muted-foreground">Descriptor: {d.assessmentRubric.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* (3) Detail rubrik TA-03B */}
          <AccordionItem value="ta03b" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" /> 3. Feedback Rubrik TA-03B (Koordinator Metopen)
                <Badge variant="outline" className="text-[10px]">
                  {score?.lecturerScore != null ? `${score.lecturerScore}/25` : '-'}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {score?.lecturerAssessorName && (
                <p className="text-xs"><strong>Koordinator:</strong> {score.lecturerAssessorName}</p>
              )}
              {ta03bDetails.length === 0 ? (
                <p className="text-xs text-muted-foreground">Detail rubrik TA-03B belum tersedia.</p>
              ) : (
                <div className="space-y-2">
                  {ta03bDetails.map((d) => (
                    <div key={`${d.researchMethodScoreId}-${d.assessmentCriteriaId}`} className="rounded-md border bg-muted/30 p-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{d.criteria?.metopenCpmk?.code ? `${d.criteria.metopenCpmk.code} — ` : ''}{d.criteria?.name ?? 'Kriteria'}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {d.score}/{d.criteria?.maxScore ?? '?'}
                        </Badge>
                      </div>
                      {d.assessmentRubric?.description && (
                        <p className="mt-1 text-muted-foreground">Descriptor: {d.assessmentRubric.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* (4) Formulir TA-04 PDF */}
          <AccordionItem value="ta04-doc" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> 4. Formulir Penugasan Dosen Pembimbing (TA-04)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {ta04Document ? (
                <>
                  <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{ta04Document.fileName}</p>
                      {titleApproval.reviewedAt && (
                        <p className="text-muted-foreground">Diterbitkan {formatDateId(titleApproval.reviewedAt)}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadSkMutation.mutate()}
                      disabled={downloadSkMutation.isPending}
                    >
                      <Download className="mr-1 h-3.5 w-3.5" />
                      {downloadSkMutation.isPending ? "Mengunduh..." : "Unduh PDF"}
                    </Button>
                  </div>
                  {titleApproval.documentKind === 'batch' && (
                    <p className="text-xs rounded-md border border-emerald-200 bg-emerald-50/60 p-2 text-emerald-800">
                      Dokumen ini adalah <strong>Formulir TA-04 resmi</strong> per periode (sesuai panduan TA-04: tabel seluruh mahasiswa semester ini).
                    </p>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Formulir TA-04 belum tersedia. Dokumen dapat diunduh setelah KaDep memfinalisasi batch periode mahasiswa yang mengambil mata kuliah Tugas Akhir.</p>
              )}
              {titleApproval.reviewNotes && (
                <p className="text-xs text-muted-foreground">
                  <strong>Catatan KaDep:</strong> {titleApproval.reviewNotes}
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

/**
 * Riwayat TA-03 sebelum arsip aktif: read-only agar mahasiswa melihat hasil
 * penilaian begitu skor tercatat, tanpa menunggu promosi beban aktif.
 */
function AssessmentHistorySection({ history }: { history: NonNullable<StudentArchiveData> }) {
  const score = history.score;
  if (!score) return null;

  const { ta03aDetails, ta03bDetails } = splitScoreDetails(score);
  const finalScore =
    score.finalScore ??
    (score.supervisorScore != null && score.lecturerScore != null
      ? score.supervisorScore + score.lecturerScore
      : null);

  return (
    <Card className="border-violet-200 bg-violet-50/50">
      <CardHeader>
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-5 w-5 text-violet-700" />
          <div className="space-y-1">
            <CardTitle className="text-base">Riwayat Penilaian Proposal TA-03</CardTitle>
            <CardDescription>
              Nilai TA-03A/TA-03B sudah tersimpan. Detail ini read-only dan menjadi bagian arsip Metopel setelah promosi beban aktif TA.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <ScoreSummaryBox label="TA-03A Pembimbing" value={score.supervisorScore} max={75} tone="blue" />
          <ScoreSummaryBox label="TA-03B Koordinator" value={score.lecturerScore} max={25} tone="violet" />
          <ScoreSummaryBox label="Total Final" value={finalScore} max={100} tone="emerald" />
        </div>

        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Pembimbing 1 / master penilai</p>
            <p className="mt-1 font-medium">{score.supervisorName || "-"}</p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Koordinator Metopen</p>
            <p className="mt-1 font-medium">{score.lecturerAssessorName || "-"}</p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Co-sign Pembimbing 2</p>
            {score.coSignedAt ? (
              <p className="mt-1">
                <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
                {score.coSignerName || "Tercatat"} pada {formatDateId(score.coSignedAt)}
              </p>
            ) : (
              <p className="mt-1 text-muted-foreground">Belum ada / tidak diperlukan</p>
            )}
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Status Nilai</p>
            <p className="mt-1 font-medium">{score.isFinalized ? "Final dan terkunci" : "Dalam proses finalisasi"}</p>
          </div>
        </div>

        <Accordion type="multiple" defaultValue={["ta03a", "ta03b"]} className="space-y-2">
          <RubricHistoryItem
            value="ta03a"
            title="Feedback Rubrik TA-03A (Pembimbing)"
            scoreLabel={score.supervisorScore != null ? `${score.supervisorScore}/75` : "-"}
            details={ta03aDetails}
            emptyText="Detail rubrik TA-03A belum tersedia."
          />
          <RubricHistoryItem
            value="ta03b"
            title="Feedback Rubrik TA-03B (Koordinator Metopen)"
            scoreLabel={score.lecturerScore != null ? `${score.lecturerScore}/25` : "-"}
            details={ta03bDetails}
            emptyText="Detail rubrik TA-03B belum tersedia."
          />
        </Accordion>
      </CardContent>
    </Card>
  );
}

function splitScoreDetails(score: StudentArchiveScore | null | undefined) {
  const ta03aIdSet = new Set(score?.ta03aDetailIds ?? []);
  const ta03aDetails: StudentArchiveScoreDetail[] = [];
  const ta03bDetails: StudentArchiveScoreDetail[] = [];

  (score?.details ?? []).forEach((detail) => {
    const compoundId = `${detail.researchMethodScoreId}_${detail.assessmentCriteriaId}`;
    if (ta03aIdSet.has(compoundId)) {
      ta03aDetails.push(detail);
    } else {
      ta03bDetails.push(detail);
    }
  });

  return { ta03aDetails, ta03bDetails };
}

function ScoreSummaryBox({
  label,
  value,
  max,
  tone,
}: {
  label: string;
  value: number | null;
  max: number;
  tone: "blue" | "violet" | "emerald";
}) {
  const toneClass = {
    blue: "border-blue-200 bg-blue-50/60",
    violet: "border-violet-200 bg-violet-50/60",
    emerald: "border-emerald-200 bg-emerald-50/60",
  }[tone];

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClass}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums">
        {value ?? "-"} <span className="text-xs text-muted-foreground">/ {max}</span>
      </p>
    </div>
  );
}

function RubricHistoryItem({
  value,
  title,
  scoreLabel,
  details,
  emptyText,
}: {
  value: string;
  title: string;
  scoreLabel: string;
  details: StudentArchiveScoreDetail[];
  emptyText: string;
}) {
  return (
    <AccordionItem value={value} className="rounded-lg border bg-background">
      <AccordionTrigger className="px-4 text-sm">
        <span className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4" /> {title}
          <Badge variant="outline" className="text-[10px]">
            {scoreLabel}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        {details.length === 0 ? (
          <p className="text-xs text-muted-foreground">{emptyText}</p>
        ) : (
          <div className="space-y-2">
            {details.map((detail) => (
              <div
                key={`${detail.researchMethodScoreId}-${detail.assessmentCriteriaId}`}
                className="rounded-md border bg-muted/30 p-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {detail.criteria?.metopenCpmk?.code ? `${detail.criteria.metopenCpmk.code} - ` : ""}
                    {detail.criteria?.name ?? "Kriteria"}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {detail.score}/{detail.criteria?.maxScore ?? "?"}
                  </Badge>
                </div>
                {detail.assessmentRubric?.description && (
                  <p className="mt-1 text-muted-foreground">
                    Descriptor: {detail.assessmentRubric.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
