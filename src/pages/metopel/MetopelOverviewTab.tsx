import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { metopenTitleService } from "@/services/metopenTitle.service";
import type { StudentArchiveData, StudentArchiveScoreDetail } from "@/services/metopenTitle.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MetricAction } from "@/components/metopen/MetricAction";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loading } from "@/components/ui/spinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, ClipboardList, FileCheck2, Stamp, Users, FileText, Archive, ScrollText, Info } from "lucide-react";
import { formatDateId, formatRoleName, toTitleCaseName } from "@/lib/text";
import { formatAdvisorRouteCode, formatAdvisorRouteProcessing } from "@/lib/advisorRoute";
import { isMetopenArchiveMode, isPromotedToActiveOfficial } from "@/lib/metopelArchive";
import { resolveSupervisorDisplayName } from "@/lib/supervisorDisplayName";
import { getAdvisorRequestStatus } from "@/lib/metopen/statusBadge";
import type { AdvisorSupervisorSummary } from "@/services/advisorRequest.service";

export { isMetopenArchiveMode, isPromotedToActiveOfficial };

type AdvisorAccessState = NonNullable<ReturnType<typeof useAdvisorAccessState>["data"]>;

interface MetopelOverviewTabProps {
  /**
   * Parent boleh mengirim readOnly. Mode arsip di tab ini memakai predikat
   * resmi NeoCentral: `active_official` / thesis sudah keluar fase proposal.
   * KRS TA SIA atau booking released saja tidak mengunci modul.
   */
  readOnly?: boolean;
  advisorAccess?: AdvisorAccessState;
}

/**
 * Penanda promosi ke TA aktif. Field ini sudah dikirim ke tab:
 * - access-state `requestStatus` (blocking request, termasuk `active_official`)
 * - proposal-approval `activePromotionState`, `activePromotedAt`, `isProposal`
 * Backend promosi (metopen.service syncBookingActivationForStudent) menulis
 * keempatnya dalam satu transaksi. Jangan pakai `proposalStatus === "accepted"` saja.
 */
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
  isPromoted = false,
) {
  if (isPromoted) {
    return { label: "Beban Aktif TA", variant: "default" as const };
  }
  if (ta04IssuedAt) {
    return { label: "TA-04 Terbit, Booking", variant: "secondary" as const };
  }
  if (proposalStatus === "submitted") {
    return { label: "Proposal Final Dikirim", variant: "secondary" as const };
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

type OverviewSupervisorCard = Pick<
  AdvisorSupervisorSummary,
  "id" | "name" | "email" | "avatarUrl" | "role" | "identityNumber" | "expertise" | "assignedAt"
>;

/**
 * Surface read-only nama P1/P2 di Overview setelah booking/TA-04.
 * Menu Cari Pembimbing sengaja hilang saat hasOfficialSupervisor, jadi Overview
 * menjadi jalur navigasi tetap untuk melihat pembimbing (KC-20260808-03).
 */
function resolveOverviewSupervisors(advisorAccess?: AdvisorAccessState): OverviewSupervisorCard[] {
  if (!advisorAccess) return [];

  if (advisorAccess.supervisors.length > 0) {
    return advisorAccess.supervisors.map((supervisor) => ({
      id: supervisor.id,
      name: resolveSupervisorDisplayName(supervisor.name, supervisor.lecturerId, advisorAccess),
      email: supervisor.email,
      avatarUrl: supervisor.avatarUrl,
      role: supervisor.role,
      identityNumber: supervisor.identityNumber ?? null,
      expertise: supervisor.expertise ?? supervisor.scienceGroup?.name ?? null,
      assignedAt: supervisor.assignedAt ?? null,
    }));
  }

  const request = advisorAccess.blockingRequest ?? advisorAccess.latestRequest;
  if (!request) return [];

  const lecturer = request.redirectTarget ?? request.lecturer;
  if (!lecturer) return [];

  const fullName = resolveSupervisorDisplayName(lecturer.user?.fullName, lecturer.id, advisorAccess);
  if (!fullName) return [];

  return [
    {
      id: lecturer.id,
      name: fullName,
      email: null,
      avatarUrl:
        lecturer.user && "avatarUrl" in lecturer.user
          ? ((lecturer.user as { avatarUrl?: string | null }).avatarUrl ?? null)
          : null,
      role: "Calon Pembimbing 1",
    },
  ];
}

function getProposalQueueDescription(
  proposalStatus: ProposalStatus,
  queueReadiness: ProposalQueueReadiness,
  ta04IssuedAt?: string | null,
  isPromoted = false,
) {
  if (isPromoted) {
    return "Pembimbing sudah menjadi beban aktif Tugas Akhir.";
  }
  if (ta04IssuedAt) {
    return "Penugasan TA-04 sudah dicatat. Menunggu TA-03 final dan konfirmasi mata kuliah Tugas Akhir dari SIA.";
  }
  if (proposalStatus === "submitted") {
    return "Proposal final sudah dikirim. Menunggu penilaian TA-03.";
  }

  switch (queueReadiness?.block) {
    case "ta_course_not_confirmed":
      return "Nilai TA-03 sudah final. Menunggu SIA mencatat mata kuliah Tugas Akhir.";
    case "scores_not_finalized":
      return "Menunggu finalisasi nilai TA-03A dan TA-03B.";
    case "missing_scores":
      return "Menunggu nilai TA-03A dan TA-03B.";
    case "metopel_auto_zeroed":
      return "Presensi Metopel kurang dari 75%. Booking akan dilepas pada siklus ini.";
    case "proposal_final_not_submitted":
      return "Ajukan proposal final terlebih dahulu.";
    default:
      return "Menunggu finalisasi TA-04 oleh KaDep setelah booking disetujui.";
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
    advisorAccess?.requestStatus === "active_official" ||
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

  const isArchiveMode = isMetopenArchiveMode({
    isMetopenArchive: advisorAccess?.isMetopenArchive,
    hasTakenMetopen: advisorAccess?.hasTakenMetopen,
    takingThesisCourse: advisorAccess?.takingThesisCourse,
    metopenReadOnly: advisorAccess?.metopenReadOnly,
    requestStatus: advisorAccess?.requestStatus,
    latestRequestStatus: advisorAccess?.latestRequest?.status,
    activePromotionState: proposalApproval?.activePromotionState,
    activePromotedAt: proposalApproval?.activePromotedAt,
    isProposal: proposalApproval?.isProposal,
  });

  const { data: seminarEligibility } = useQuery({
    queryKey: ["metopel-seminar-eligibility"],
    queryFn: async () => {
      const response = await metopenTitleService.getMySeminarEligibilitySnapshot();
      return response.data as SeminarEligibilitySnapshot;
    },
    enabled: !!advisorAccess?.hasOfficialSupervisor || isArchiveMode,
  });

  // Riwayat TA-03 untuk masa transisi setelah dinilai, sebelum TA-04/arsip aktif.
  const { data: assessmentHistory } = useQuery({
    queryKey: ["metopel-assessment-history"],
    queryFn: async () => (await metopenTitleService.getMyAssessmentHistory()).data,
    enabled: !isArchiveMode && !!advisorAccess?.hasOfficialSupervisor,
  });

  // BR-23: Arsip Metopel — fetch hanya saat mode arsip aktif (promosi beban aktif).
  const { data: archive } = useQuery({
    queryKey: ["metopel-archive-detail"],
    queryFn: async () => (await metopenTitleService.getMyArchive()).data,
    enabled: isArchiveMode && hasLifecycleContext,
  });

  if (!advisorAccessFromParent && isLoading) return <Loading />;

  const proposalStatus = (proposalApproval?.proposalStatus ?? null) as ProposalStatus;
  const queueReadiness = proposalApproval?.queueReadiness ?? null;
  const ta04IssuedAt = proposalApproval?.ta04AssignmentIssuedAt ?? null;
  const canUploadProposal = proposalApproval?.canUploadProposal === true;
  const canSubmitFinalProposal = proposalApproval?.canSubmitFinalProposal === true;
  const canUseInformalLog = proposalApproval?.canUseInformalLog === true;
  const guidanceGateOpen = proposalApproval?.guidanceGateOpen === true;
  const guidanceGateReason = proposalApproval?.guidanceGateReason ?? null;
  const ta03GateOpen = proposalApproval?.ta03GateOpen === true;
  const ta03GateReason = proposalApproval?.ta03GateReason ?? null;
  const activePromotionState = proposalApproval?.activePromotionState ?? null;
  const proposalStatusUi = buildProposalStatusUi(proposalStatus, queueReadiness, ta04IssuedAt, isArchiveMode);
  const proposalQueueDescription = getProposalQueueDescription(proposalStatus, queueReadiness, ta04IssuedAt, isArchiveMode);
  const workflowClarityItems = [
    advisorAccess?.hasBookedSupervisor && !guidanceGateOpen
      ? guidanceGateReason ?? "Booking disetujui. Menunggu TA-04. Draf pribadi masih dapat disimpan."
      : null,
    guidanceGateOpen && (canSubmitFinalProposal || canUseInformalLog)
      ? "TA-04 sudah terbit. Proposal final, catatan informal, dan bimbingan proposal dapat digunakan."
      : null,
  ].filter((item): item is string => Boolean(item));

  // Canon §5.2 (audit F-6.1): escalated = TA-01 (Path C), bukan TA-02. Pakai helper terpusat.
  const initialRouteCode = formatAdvisorRouteCode(advisorAccess?.blockingRequest?.routeType);

  const initialRouteStatus = isArchiveMode
    ? "Pembimbing sudah ditetapkan"
    : advisorAccess?.hasOfficialSupervisor
    ? "Pembimbing sudah ditetapkan"
    : advisorAccess?.hasBookedSupervisor
      ? "Booking disetujui, menunggu TA-04"
    : advisorAccess?.hasBlockingRequest
      ? formatAdvisorRouteProcessing(advisorAccess.blockingRequest?.routeType)
      : "Pilih jalur yang sesuai";

  const thesisTitleSummary = advisorAccess?.thesisTitle
    ? ` Judul awal: ${advisorAccess.thesisTitle}.`
    : " Judul awal belum tercatat.";
  const metopenAccessSummary =
    advisorAccess?.eligibleMetopen === true
      ? "Akses Metopen aktif dari sinkronisasi SIA."
      : advisorAccess?.eligibleMetopen === false
        ? "Akses pengajuan Metopen belum terbuka dari sinkronisasi SIA."
        : null;
  const seminarRequirements = seminarEligibility?.requirements;

  const initialRouteDescription =
    advisorAccess?.blockingRequest?.routeType === "escalated"
      ? `Pengajuan TA-01 di atas kuota. Menunggu keputusan KaDep.${thesisTitleSummary}`
      : advisorAccess?.blockingRequest?.routeType === "dept"
        ? `Pengajuan TA-02 melalui departemen.${thesisTitleSummary}`
        : advisorAccess?.blockingRequest?.routeType === "normal"
          ? `Pengajuan TA-01 ke calon pembimbing.${thesisTitleSummary}`
          : `Ajukan TA-01 ke calon pembimbing, atau TA-02 melalui departemen.${thesisTitleSummary}`;

  // Status kartu promosi tanpa short-circuit ta04IssuedAt (TA-04 adalah langkah terpisah).
  const promotionStatusUi = buildProposalStatusUi(proposalStatus, queueReadiness, null, isArchiveMode);
  const promotionQueueDescription = getProposalQueueDescription(proposalStatus, queueReadiness, null, isArchiveMode);

  const ta04GateStatus = isArchiveMode || Boolean(ta04IssuedAt)
    ? "Penugasan awal terbit"
    : advisorAccess?.hasBookedSupervisor || advisorAccess?.hasOfficialSupervisor
      ? "Menunggu finalisasi KaDep"
      : "Menunggu booking pembimbing";

  const ta04GateDescription = isArchiveMode || Boolean(ta04IssuedAt)
    ? "Penugasan TA-04 sudah dicatat. Proposal final dan penilaian dapat dilanjutkan."
    : "Menunggu finalisasi TA-04 oleh KaDep setelah booking disetujui.";

  const overviewSupervisors = resolveOverviewSupervisors(advisorAccess);

  const periodClosedBanner =
    !isArchiveMode &&
    advisorAccess?.latestRequest?.status === "released" &&
    advisorAccess?.latestRequest?.releaseReason === "metopen_period_closed";
  const showSupervisorSection =
    overviewSupervisors.length > 0 &&
    Boolean(
      advisorAccess?.hasOfficialSupervisor ||
        advisorAccess?.hasBookedSupervisor ||
        isArchiveMode,
    );
  const supervisorBadgeLabel = advisorAccess?.hasOfficialSupervisor || isArchiveMode || Boolean(ta04IssuedAt)
    ? "Aktif"
    : "Booking disetujui";

  const stepCards = [
    {
      code: initialRouteCode,
      title: "Pengajuan Awal Pembimbing dan Judul",
      icon: Users,
      status: initialRouteStatus,
      description: initialRouteDescription,
    },
    {
      code: "TA-04",
      title: "TA-04 Awal",
      icon: Stamp,
      status: ta04GateStatus,
      description: ta04GateDescription,
    },
    {
      code: "Proposal Final",
      title: "Ajukan proposal final",
      icon: FileCheck2,
      status: isArchiveMode
        ? "Proposal final tersimpan"
        : !advisorAccess?.hasBookedSupervisor
          ? "Menunggu booking pembimbing"
          : !ta04IssuedAt
            ? "Menunggu TA-04 KaDep"
            : proposalStatus === "submitted" || proposalStatus === "accepted"
              ? "Proposal final masuk alur TA-03"
              : canSubmitFinalProposal
                ? "Boleh unggah proposal final"
                : canUploadProposal
                  ? "Boleh simpan draf pribadi"
                  : "Ajukan versi proposal final",
      description:
        isArchiveMode
          ? "Proposal final tersimpan (hanya lihat)."
          : canSubmitFinalProposal
            ? "Unggah dan tetapkan versi proposal final untuk penilaian."
            : "Draf pribadi boleh disimpan. Ajukan proposal final setelah TA-04 terbit.",
    },
    {
      code: "TA-03A / TA-03B",
      title: "Penilaian Proposal Lengkap",
      icon: ClipboardList,
      // Audit Fase 0: hindari label "lulus/tidak lulus" karena canon §5.7 hanya
      // bicara skor agregat (75+25). UI cukup tampilkan skor dan status finalisasi.
      status: seminarRequirements?.metopelScore != null
        ? `Skor akhir ${seminarRequirements.metopelScore}/100`
        : ta03GateOpen
          ? "Gate TA-03 terbuka"
          : ta03GateReason
            ? ta03GateReason
            : ta04IssuedAt
              ? "Menunggu penilaian proposal"
              : "Menunggu TA-04 awal",
      description:
        seminarEligibility?.reason ??
        ta03GateReason ??
        "TA-03A diisi Pembimbing 1; Pembimbing 2 menyetujui bila ada. TA-03B diisi Koordinator Metopen. Nilai tidak dapat diubah setelah disubmit.",
    },
    {
      code: "Promosi Aktif",
      title: "Promosi Aktif Tugas Akhir",
      icon: Archive,
      status: promotionStatusUi.label,
      description: promotionQueueDescription,
    },
  ];

  // Status per predikat aktual — jangan asumsikan "index sebelum N = selesai"
  // (bug lama: ta04IssuedAt menandai proposal final & penilaian sebagai completed).
  const getStepStatus = (index: number): "completed" | "current" | "upcoming" => {
    const bookingDone = Boolean(
      advisorAccess?.hasBookedSupervisor || advisorAccess?.hasOfficialSupervisor,
    );
    const ta04Done = Boolean(ta04IssuedAt);
    const proposalDone =
      proposalStatus === "submitted" ||
      proposalStatus === "accepted" ||
      isArchiveMode ||
      Boolean(seminarRequirements?.metopelScore != null);
    const assessmentDone =
      seminarRequirements?.metopelScore != null ||
      seminarEligibility?.eligible === true ||
      isArchiveMode;
    const promotionDone = isArchiveMode;

    const doneFlags = [bookingDone, ta04Done, proposalDone, assessmentDone, promotionDone];

    if (promotionDone) return "completed";

    const firstIncomplete = doneFlags.findIndex((done) => !done);
    if (firstIncomplete === -1) return "completed";
    if (index < firstIncomplete) return "completed";
    if (index === firstIncomplete) return "current";
    return "upcoming";
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="rounded-lg border bg-muted/25 px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Info className="h-4 w-4" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">Status tahap awal Tugas Akhir</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {advisorAccess?.reason ??
                "Pantau pembimbing, judul awal, penilaian proposal, dan status penugasan TA-04 di sistem sebelum lanjut ke fase Tugas Akhir penuh."}
            </p>
            {metopenAccessSummary && <p className="text-xs text-muted-foreground">{metopenAccessSummary}</p>}
          </div>
        </div>
        {workflowClarityItems.length > 0 && (
          <div className="ml-12 mt-3 space-y-1.5 border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
            {workflowClarityItems.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
        )}
      </div>

      {periodClosedBanner && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Periode Metode Penelitian ditutup</AlertTitle>
          <AlertDescription>
            Tahun ajaran Metopel Anda sudah ditutup. Nilai TA-03 yang belum final
            dicatat 0. Ini bukan arsip Tugas Akhir; pengajuan ulang dapat dilakukan
            pada periode berikutnya selama akses Metopen masih terbuka.
          </AlertDescription>
        </Alert>
      )}

      {showSupervisorSection && (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dosen Pembimbing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {overviewSupervisors.map((supervisor) => {
                const displayName = toTitleCaseName(supervisor.name);
                const initials = displayName
                  .split(" ")
                  .map((part) => part[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("");
                return (
                  <div
                    key={supervisor.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <Avatar className="h-10 w-10 ring-1 ring-border">
                      {supervisor.avatarUrl ? <AvatarImage src={supervisor.avatarUrl} alt={displayName} /> : null}
                      <AvatarFallback>{initials || "DP"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRoleName(supervisor.role) || "Pembimbing"}
                      </p>
                      {supervisor.email ? (
                        <p className="truncate text-xs text-muted-foreground">{supervisor.email}</p>
                      ) : null}
                      {supervisor.identityNumber ? (
                        <p className="truncate text-xs text-muted-foreground">NIP {supervisor.identityNumber}</p>
                      ) : null}
                      {supervisor.expertise ? (
                        <p className="truncate text-xs text-muted-foreground">{supervisor.expertise}</p>
                      ) : null}
                      {supervisor.assignedAt ? (
                        <p className="truncate text-xs text-muted-foreground">
                          Penugasan {formatDateId(supervisor.assignedAt)}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {supervisorBadgeLabel}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/70 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Alur proses Metode Penelitian</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            {stepCards.map((step, index) => {
              const Icon = step.icon;
              const status = getStepStatus(index);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              return (
                <div key={step.code} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-3 py-4 first:pt-2 last:pb-1">
                  {index < stepCards.length - 1 && (
                    <span className="absolute bottom-0 left-[1.1rem] top-10 w-px bg-border" aria-hidden="true" />
                  )}
                  <div
                    className={
                      isCompleted
                        ? 'relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700'
                        : isCurrent
                          ? 'relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-primary/10'
                          : 'relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground'
                    }
                  >
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{step.title}</p>
                          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                            {step.code}
                          </Badge>
                        </div>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                      </div>
                      <Badge variant={isCurrent ? 'default' : 'secondary'} className="w-fit shrink-0 text-xs">
                        {step.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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

            {ta04IssuedAt && (
              <div className="rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Penugasan awal dicatat di sistem</p>
                <p className="mt-0.5">
                  Dicatat {formatDateId(ta04IssuedAt)}. Dokumen cetak dikelola departemen.
                </p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                <p className="font-medium text-foreground">Proposal &amp; catatan informal</p>
                <p className="mt-0.5 text-muted-foreground">
                  {guidanceGateOpen
                    ? "Bimbingan tercatat dan catatan informal sudah dapat digunakan."
                    : canUploadProposal
                      ? "Draf pribadi boleh disimpan. Bimbingan dan catatan informal menunggu TA-04."
                    : activePromotionState === "active_promoted"
                      ? "Sudah masuk beban aktif Tugas Akhir."
                      : "Menunggu pembimbing atau status proposal yang sesuai."}
                </p>
              </div>
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs">
                <p className="font-medium text-foreground">Gate TA-03</p>
                <p className="mt-0.5 text-muted-foreground">
                  {isArchiveMode && seminarRequirements?.metopelScore != null
                    ? `Selesai: skor TA-03 final ${seminarRequirements.metopelScore}/100 dan tersimpan sebagai arsip.`
                    : ta03GateOpen
                      ? "Terbuka: proposal final dan TA-04 awal sudah tersedia."
                      : ta03GateReason ?? "Menunggu prasyarat penilaian proposal."}
                </p>
              </div>
            </div>

            {/* P1-13 (canon §5.10): Tombol "Sinkronkan Status" dihapus karena
                lifecycle TA-04/promosi aktif berjalan otomatis dari SIA sync dan
                nilai TA-03 final. Mahasiswa tidak perlu lapor manual. */}
            <p className="text-xs text-muted-foreground">
              {proposalQueueDescription}
            </p>
          </CardContent>
        </Card>
      )}

      {!isArchiveMode && assessmentHistory?.score && (
        <AssessmentHistorySection history={assessmentHistory} />
      )}

      {/* BR-23 (canon §5.13): Arsip Metopel pasca promosi aktif — read-only.
          Substansi awal + rubrik TA-03 + status penugasan TA-04 (tanpa PDF mahasiswa). */}
      {isArchiveMode && archive && <ArchiveSection archive={archive} />}
    </div>
  );
}

/**
 * BR-23: Surface arsip Metopel pasca promosi aktif TA. Read-only.
 */
function ArchiveSection({ archive }: { archive: NonNullable<StudentArchiveData> }) {
  const { advisorRequests, score, titleApproval } = archive;
  const ta03aCap = archive.ta03aCap ?? 75;
  const ta03bCap = archive.ta03bCap ?? 25;

  const { ta03aDetails, ta03bDetails } = splitScoreDetails(score);

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-emerald-700" />
          <div>
            <CardTitle className="text-base">Arsip Penilaian Proposal &amp; Status TA-04</CardTitle>
            <CardDescription>
              Ringkasan pengajuan awal, nilai, dan status penugasan pembimbing.
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
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${getAdvisorRequestStatus(req.status, "student").className}`}
                      >
                        {getAdvisorRequestStatus(req.status, "student").label}
                      </Badge>
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
                  {score?.supervisorScore != null ? `${score.supervisorScore}/${ta03aCap}` : '-'}
                </Badge>
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {score?.supervisorName && (
                <p className="text-xs">
                  <strong>Pembimbing 1 (pengisi utama):</strong> {score.supervisorName}
                </p>
              )}
              {score?.coSignerName && (
                <p className="text-xs">
                  <strong>Pembimbing 2 (persetujuan):</strong> {score.coSignerName}
                  {score.coSignedAt ? ` · ${formatDateId(score.coSignedAt)}` : ''}
                </p>
              )}
              {score?.coSignNote && (
                <p className="text-xs text-muted-foreground">Catatan persetujuan: {score.coSignNote}</p>
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
                  {score?.lecturerScore != null ? `${score.lecturerScore}/${ta03bCap}` : '-'}
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

          {/* (4) Status penugasan TA-04 — tanpa PDF (keputusan = status sistem) */}
          <AccordionItem value="ta04-doc" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> 4. Status Penugasan Pembimbing (TA-04)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {titleApproval?.reviewedAt ? (
                <div className="rounded-md border bg-muted/30 p-3 text-xs space-y-1">
                  <p className="font-medium text-foreground">Penugasan awal sudah dicatat di sistem</p>
                  <p className="text-muted-foreground">
                    Dicatat {formatDateId(titleApproval.reviewedAt)}. Keputusan KaDep berlaku lewat status ini;
                    dokumen cetak dikelola departemen.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Status penugasan TA-04 belum tercatat. Setelah KaDep memfinalisasi batch di sistem, status akan muncul di sini.
                </p>
              )}
              {titleApproval?.reviewNotes && (
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
  const ta03aCap = history.ta03aCap ?? 75;
  const ta03bCap = history.ta03bCap ?? 25;
  const totalCap = ta03aCap + ta03bCap;
  const ta03aRef = useRef<HTMLDivElement | null>(null);
  const ta03bRef = useRef<HTMLDivElement | null>(null);
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
              Nilai sudah tersimpan (hanya lihat).
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          <MetricAction
            label="TA-03A Pembimbing"
            value={`${score.supervisorScore ?? "-"} / ${ta03aCap}`}
            tone="blue"
            actionLabel="Lihat detail rubrik"
            onClick={() => ta03aRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
          <MetricAction
            label="TA-03B Koordinator"
            value={`${score.lecturerScore ?? "-"} / ${ta03bCap}`}
            tone="violet"
            actionLabel="Lihat detail rubrik"
            onClick={() => ta03bRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
          <MetricAction
            label="Total Final"
            value={`${finalScore ?? "-"} / ${totalCap}`}
            tone="emerald"
            hint={`TA-03A (maks. ${ta03aCap}) + TA-03B (maks. ${ta03bCap})`}
            actionLabel="Lihat komponen nilai"
            onClick={() => ta03aRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
          />
        </div>

        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Pembimbing 1 / pengisi utama</p>
            <p className="mt-1 font-medium">{score.supervisorName || "-"}</p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Koordinator Metopen</p>
            <p className="mt-1 font-medium">{score.lecturerAssessorName || "-"}</p>
          </div>
          <div className="rounded-md border bg-background px-3 py-2">
            <p className="text-muted-foreground">Persetujuan Pembimbing 2</p>
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
          <div ref={ta03aRef} className="scroll-mt-6">
            <RubricHistoryItem
              value="ta03a"
              title="Feedback Rubrik TA-03A (Pembimbing)"
              scoreLabel={score.supervisorScore != null ? `${score.supervisorScore}/${ta03aCap}` : "-"}
              details={ta03aDetails}
              emptyText="Detail rubrik TA-03A belum tersedia."
            />
          </div>
          <div ref={ta03bRef} className="scroll-mt-6">
            <RubricHistoryItem
              value="ta03b"
              title="Feedback Rubrik TA-03B (Koordinator Metopen)"
              scoreLabel={score.lecturerScore != null ? `${score.lecturerScore}/${ta03bCap}` : "-"}
              details={ta03bDetails}
              emptyText="Detail rubrik TA-03B belum tersedia."
            />
          </div>
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
