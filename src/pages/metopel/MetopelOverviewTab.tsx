import { useQuery } from "@tanstack/react-query";
import { useAdvisorAccessState, useRole } from "@/hooks/shared";
import { metopenTitleService } from "@/services/metopenTitle.service";
import type { StudentArchiveData, StudentArchiveScoreDetail } from "@/services/metopenTitle.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ClipboardList, FileCheck2, Stamp, Users, FileText, Download, Archive, ScrollText } from "lucide-react";
import { getApiUrl } from "@/config/api";
import { formatDateId } from "@/lib/text";

interface MetopelOverviewTabProps {
  /**
   * BR-23 (canon §5.13): readOnly = true menandai mode arsip pasca TA-04.
   * Mode arsip wajib menampilkan substansi awal + detail rubrik + dokumen TA-04.
   */
  readOnly?: boolean;
}

type ProposalStatus = "accepted" | "submitted" | "rejected" | null;
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

export function MetopelOverviewTab({ readOnly = false }: MetopelOverviewTabProps) {
  const { isStudent } = useRole();
  const { data: advisorAccess, isLoading } = useAdvisorAccessState(isStudent());

  const { data: proposalApproval } = useQuery({
    queryKey: ["metopel-proposal-approval"],
    queryFn: async () => {
      const response = await metopenTitleService.getMyProposalApproval();
      return response.data.thesis;
    },
    enabled: !!advisorAccess?.hasOfficialSupervisor,
  });

  const { data: seminarEligibility } = useQuery({
    queryKey: ["metopel-seminar-eligibility"],
    queryFn: async () => {
      const response = await metopenTitleService.getMySeminarEligibilitySnapshot();
      return response.data as SeminarEligibilitySnapshot;
    },
    enabled: !!advisorAccess?.hasOfficialSupervisor,
  });

  // BR-23: Arsip Metopel — fetch hanya saat mode arsip aktif (TA-04 sudah disahkan).
  const { data: archive } = useQuery({
    queryKey: ["metopel-archive-detail"],
    queryFn: async () => (await metopenTitleService.getMyArchive()).data,
    enabled: readOnly && !!advisorAccess?.hasOfficialSupervisor,
  });

  if (isLoading) return <Loading />;

  const proposalStatus = (proposalApproval?.proposalStatus ?? null) as ProposalStatus;
  const proposalStatusUi = {
    label:
      proposalStatus === "accepted"
        ? "Disahkan"
        : proposalStatus === "submitted"
          ? "Menunggu Review KaDep"
          : proposalStatus === "rejected"
            ? "Ditolak"
            : "Belum Masuk Antrean",
    variant:
      proposalStatus === "accepted"
        ? "default"
        : proposalStatus === "submitted"
          ? "secondary"
          : "outline",
  } as const;

  const initialRouteCode =
    advisorAccess?.blockingRequest?.routeType === "escalated"
      ? "TA-02"
      : advisorAccess?.blockingRequest?.routeType === "normal"
        ? "TA-01"
        : "TA-01 / TA-02";

  const initialRouteStatus = advisorAccess?.hasOfficialSupervisor
    ? "Pembimbing sudah ditetapkan"
    : advisorAccess?.hasBlockingRequest
      ? advisorAccess.blockingRequest?.routeType === "escalated"
        ? "Jalur TA-02 sedang diproses"
        : "Jalur TA-01 sedang diproses"
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
      ? `TA-02 dipakai saat mahasiswa belum memiliki calon dosen pembimbing atau saat usulan awal diproses melalui departemen dan diputuskan oleh KaDep.${thesisTitleSummary}`
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
        : proposalStatus === "submitted" || proposalStatus === "accepted"
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
      title: "Pengesahan Judul",
      icon: Stamp,
      status: proposalStatusUi.label,
      description:
        "KaDep mengesahkan judul setelah proposal final, nilai TA-03A/TA-03B, dan konfirmasi ambil mata kuliah TA terpenuhi.",
    },
  ];

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50/70">
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
        {stepCards.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.code}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" />
                    {step.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-[11px]">
                    {step.code}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Badge variant="secondary" className="text-xs">
                  {step.status}
                </Badge>
                <p className="text-muted-foreground">{step.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {advisorAccess?.hasOfficialSupervisor && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status Pengesahan Judul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Judul saat ini</p>
                <p className="font-medium">
                  {proposalApproval?.title || advisorAccess.thesisTitle || "Judul belum tersedia"}
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

            {/* P1-13 (canon §5.10): Tombol "Sinkronkan Status" dihapus karena
                bertentangan dengan canon — antrean TA-04 KaDep auto-enqueue oleh
                sistem setelah TA-03A + TA-03B finalisasi. Mahasiswa tidak perlu
                lapor manual. UI cukup info pasif. */}
            <p className="text-xs text-muted-foreground">
              Antrean pengesahan TA-04 ke KaDep dikelola otomatis oleh sistem setelah penilaian TA-03A &amp; TA-03B difinalisasi (canon §5.10). Anda tidak perlu melakukan sinkronisasi manual.
            </p>
          </CardContent>
        </Card>
      )}

      {/* BR-23 (canon §5.13): Arsip Metopel pasca TA-04 — read-only single source of truth.
          4 kategori: substansi awal TA-01/02, detail rubrik TA-03A & TA-03B, dokumen SK TA-04. */}
      {readOnly && archive && <ArchiveSection archive={archive} />}
    </div>
  );
}

/**
 * BR-23: Surface arsip Metopel pasca TA-04. Read-only.
 */
function ArchiveSection({ archive }: { archive: NonNullable<StudentArchiveData> }) {
  const { advisorRequests, score, titleApproval } = archive;
  const ta04Document = titleApproval?.document;

  const buildDocUrl = (filePath: string) => {
    if (!filePath) return "#";
    let url = filePath.startsWith('/') ? getApiUrl(filePath) : getApiUrl(`/${filePath}`);
    const token = localStorage.getItem('accessToken');
    if (token && filePath.includes('thesis/')) {
      url += (url.includes('?') ? '&' : '?') + `token=${token}`;
    }
    return url;
  };

  // Pisahkan detail rubrik berdasarkan ID hint dari backend.
  const ta03aIdSet = new Set(score?.ta03aDetailIds ?? []);
  const ta03aDetails: StudentArchiveScoreDetail[] = [];
  const ta03bDetails: StudentArchiveScoreDetail[] = [];
  (score?.details ?? []).forEach((d) => {
    const compoundId = `${d.researchMethodScoreId}_${d.assessmentCriteriaId}`;
    if (ta03aIdSet.has(compoundId)) {
      ta03aDetails.push(d);
    } else {
      ta03bDetails.push(d);
    }
  });

  return (
    <Card className="border-emerald-200 bg-emerald-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-emerald-700" />
          <div>
            <CardTitle className="text-base">Arsip Penilaian Proposal &amp; Dokumen TA-04</CardTitle>
            <CardDescription>
              Sesuai canon §5.13, SIMPTA dirancang sebagai Single Source of Truth — Anda berhak melihat substansi pengajuan awal, feedback rubrik detail, dan unduh dokumen SK TA-04 kapan pun.
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
                        <p className="font-medium">{d.criteria?.cpmk?.code ? `${d.criteria.cpmk.code} — ` : ''}{d.criteria?.name ?? 'Kriteria'}</p>
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
                        <p className="font-medium">{d.criteria?.cpmk?.code ? `${d.criteria.cpmk.code} — ` : ''}{d.criteria?.name ?? 'Kriteria'}</p>
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

          {/* (4) Dokumen SK TA-04 PDF */}
          <AccordionItem value="ta04-doc" className="rounded-lg border bg-background">
            <AccordionTrigger className="px-4 text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> 4. Dokumen SK Penugasan Pembimbing (TA-04)
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3 space-y-2">
              {ta04Document ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{ta04Document.fileName}</p>
                    {titleApproval.reviewedAt && (
                      <p className="text-muted-foreground">Diterbitkan {formatDateId(titleApproval.reviewedAt)}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <a href={buildDocUrl(ta04Document.filePath)} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-1 h-3.5 w-3.5" /> Unduh PDF
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">SK TA-04 belum tersedia. Dokumen akan terbit otomatis setelah KaDep menyahkan judul.</p>
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
