import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    getStudentSupervisors,
    getMyThesisDetail,
    getStudentThesisHistory,
    getProposalSubmissionStatus,
} from "@/services/studentGuidance.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LocalTabsNav, type LocalTabItem } from "@/components/ui/tabs-nav";

import {
    BookOpen,
    GraduationCap,
    Target,
    Clock,
    CheckCircle2,
    Plus,
    FileText,
    CreditCard,
    Mail,
    Copy,
    Check,
    History,
    AlertCircle,
    Archive,
    Send,
    Stamp,
} from "lucide-react";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { Loading } from "@/components/ui/spinner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { useEffect, useState } from "react";
import { RequestSupervisor2Dialog } from "@/components/bimbingan/RequestSupervisor2Dialog";
import { getPendingSupervisor2Request } from "@/services/studentGuidance.service";
import { PendingRequestCard } from "@/components/bimbingan/PendingRequestCard";
import { toast } from "sonner";
import { metopenTitleService } from "@/services/metopenTitle.service";

type ThesisSupervisorItem = {
    id: string;
    role?: string | null;
    name?: string | null;
    identityNumber?: string | null;
    nip?: string | null;
    email?: string | null;
};

type ThesisHistoryItem = {
    id: string;
    title: string;
    topic?: string | null;
    academicYear?: string | null;
    createdAt: string;
    status: string;
    rating?: string | null;
    supervisors?: Array<{ id: string; name: string }>;
    stats: {
        guidances: number;
        completedMilestones: number | string;
    };
};
import { PendingApprovalCard } from "@/components/thesis/PendingApprovalCard";
import { ProposalVersionHistory } from "@/components/thesis/ProposalVersionHistory";

function getProposalStatusLabel(status: string | null | undefined) {
    if (status === "accepted") return "TA-04 disahkan";
    if (status === "submitted") return "Menunggu review KaDep";
    if (status === "rejected") return "Ditolak KaDep";
    return "Belum masuk antrean TA-04";
}

export default function TugasAkhirOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Breadcrumbs
    useEffect(() => {
        setBreadcrumbs([{ label: "Tugas Akhir" }]);
        setTitle("Overview Tugas Akhir");
    }, [setBreadcrumbs, setTitle]);

    // Data Fetching
    const { data: supervisorsData } = useQuery({
        queryKey: ["student-supervisors"],
        queryFn: getStudentSupervisors,
    });

    const { data: pendingRequest } = useQuery({
        queryKey: ['pending-supervisor2-request'],
        queryFn: getPendingSupervisor2Request,
    });

    const thesisId = supervisorsData?.thesisId || "";
    const hasThesis = !!thesisId;

    const { data: thesisDetail, isLoading: isLoadingThesis } = useQuery({
        queryKey: ["my-thesis-detail"],
        queryFn: getMyThesisDetail,
        enabled: hasThesis,
    });

    const { data: proposalSubmissionStatus, isLoading: isLoadingProposalStatus } = useQuery({
        queryKey: ["proposal-submission-status"],
        queryFn: getProposalSubmissionStatus,
        enabled: hasThesis,
    });

    const { data: proposalApproval, isLoading: isLoadingProposalApproval } = useQuery({
        queryKey: ["metopel-proposal-approval"],
        queryFn: async () => {
            const response = await metopenTitleService.getMyProposalApproval();
            return response.data.thesis;
        },
        enabled: hasThesis,
    });

    const { data: seminarEligibility, isLoading: isLoadingSeminarEligibility } = useQuery({
        queryKey: ["metopel-seminar-eligibility"],
        queryFn: async () => {
            const response = await metopenTitleService.getMySeminarEligibilitySnapshot();
            return response.data as { eligible?: boolean; reason?: string };
        },
        enabled: hasThesis,
    });

    // History Data
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["student-thesis-history"],
        queryFn: getStudentThesisHistory,
    });

    const hasPembimbing2 = thesisDetail?.supervisors?.some((s) =>
        (s.role || "").toLowerCase().includes("pembimbing 2") ||
        (s.role || "").toLowerCase().includes("pembimbing2")
    );

    // Determines statuses
    const isFailed = thesisDetail?.status === "Gagal";
    const isCancelled = thesisDetail?.status === "Dibatalkan";
    const isProposed = thesisDetail?.status === "Diajukan";
    // Show dashboard only if active and NOT proposed (proposed has its own view)
    const isThesisActive = thesisDetail?.status !== "Dibatalkan" && thesisDetail?.status !== "Gagal" && thesisDetail?.status !== "Diajukan";

    const copyEmail = async (id: string, email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedId(id);
            toast.success('Email berhasil disalin');
            setTimeout(() => setCopiedId(null), 2000);
        } catch {
            toast.error('Gagal menyalin email');
        }
    };

    const getRemainingTime = () => {
        const deadlineDate = thesisDetail?.deadlineDate;
        if (!deadlineDate) return "-";

        const deadline = new Date(deadlineDate);
        const now = new Date();
        const diffTime = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return `Terlewat ${Math.abs(diffDays)} Hari`;
        if (diffDays < 30) return `${diffDays} Hari`;

        const months = Math.floor(diffDays / 30);
        const days = diffDays % 30;
        return days > 0 ? `${months} Bulan ${days} Hari` : `${months} Bulan`;
    };

    if (
        isLoadingThesis ||
        isLoadingHistory ||
        (hasThesis && (
            isLoadingProposalStatus ||
            isLoadingProposalApproval ||
            isLoadingSeminarEligibility
        ))
    ) {
        return <Loading size="lg" text="Memuat data tugas akhir..." />;
    }

    if (!hasThesis && (!historyData?.theses || historyData.theses.length === 0)) {
        return (
            <div className="space-y-5 sm:space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold tracking-tight sm:text-lg">Belum Ada Tugas Akhir Aktif</CardTitle>
                        <CardDescription>
                            Mulai dari alur Metode Penelitian untuk mengajukan calon pembimbing TA-01 atau jalur departemen TA-02.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 sm:flex-row">
                        <Button onClick={() => navigate("/metopel/cari-pembimbing")}>
                            <BookOpen className="mr-2 h-4 w-4" />
                            Ajukan TA-01/TA-02
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/metopel")}>
                            <FileText className="mr-2 h-4 w-4" />
                            Lihat Overview Metopel
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const TAB_ITEMS: LocalTabItem[] = [
        { label: "Status Terkini", value: "overview" },
        { label: "Riwayat Tugas Akhir", value: "history" },
    ];

    const finalProposalVersion = proposalSubmissionStatus?.finalProposalVersion ?? null;
    const hasOfficialSupervisor = (thesisDetail?.supervisors?.length ?? 0) > 0;
    const hasUploadedVersion = !!proposalSubmissionStatus?.latestVersion;
    const hasFinalProposal = !!finalProposalVersion;
    const ta04Status = proposalApproval?.proposalStatus as "accepted" | "submitted" | "rejected" | null | undefined;
    const ta04Accepted = ta04Status === "accepted";
    const ta04Submitted = ta04Status === "submitted";

    // P1-09 + P1-18 (canon §5.5 + §5.6 + Q3): Stepper visual KUALITATIF tanpa
    // gate "minimum N sesi". Setiap step menunjukkan status: completed / active /
    // pending — bukan kuota numerik. Min 8 sesi (TA-06) baru berlaku di Seminar Hasil.
    const proposalFinalLabel = finalProposalVersion
        ? `Versi final aktif: v${finalProposalVersion.version}`
        : hasUploadedVersion
            ? "Versi proposal sudah diunggah, belum ada yang ditetapkan final"
            : "Belum ada proposal yang diunggah";
    const proposalAssessmentLabel = seminarEligibility?.eligible
        ? "Penilaian proposal lengkap"
        : seminarEligibility?.reason || "Menunggu penilaian TA-03A / TA-03B";
    const ta04StatusLabel = getProposalStatusLabel(proposalApproval?.proposalStatus);

    type StepperStatus = "completed" | "active" | "pending";
    const stepperItems: Array<{
        key: string;
        icon: typeof Send;
        title: string;
        status: string;
        state: StepperStatus;
        description: string;
    }> = [
        {
            key: "supervisor",
            icon: GraduationCap,
            title: "1. Pembimbing Resmi",
            status: hasOfficialSupervisor ? "Pembimbing sudah ditetapkan" : "Tunggu penetapan TA-01/TA-02",
            state: hasOfficialSupervisor ? "completed" : "active",
            description:
                "Mahasiswa baru diizinkan ke fase proposal setelah pembimbing resmi tercatat di thesis_participants (BR-01).",
        },
        {
            key: "upload-version",
            icon: FileText,
            title: "2. Upload Versi Proposal",
            status: hasUploadedVersion ? "Setidaknya 1 versi tersimpan" : "Belum ada versi diunggah",
            state: !hasOfficialSupervisor
                ? "pending"
                : hasUploadedVersion
                    ? "completed"
                    : "active",
            description:
                "Bimbingan dilakukan secara berkala. Tidak ada batas minimum jumlah sesi (canon §5.5) — fokus kualitas, bukan kuota.",
        },
        {
            key: "proposal-final",
            icon: Send,
            title: "3. Tetapkan Proposal Final",
            status: proposalFinalLabel,
            state: !hasUploadedVersion
                ? "pending"
                : hasFinalProposal
                    ? "completed"
                    : "active",
            description:
                "Pilih satu versi sebagai proposal final aktif. Setelah submit final, siklus penilaian TA-03A & TA-03B dibuka paralel.",
        },
        {
            key: "proposal-assessment",
            icon: CheckCircle2,
            title: "4. Penilaian TA-03A + TA-03B",
            status: proposalAssessmentLabel,
            state: !hasFinalProposal
                ? "pending"
                : seminarEligibility?.eligible
                    ? "completed"
                    : "active",
            description:
                "TA-03A oleh Pembimbing 1 (master) + Pembimbing 2 (co-sign konsensus). TA-03B oleh Koordinator Metopen. Berjalan paralel; nilai immutable pasca submit (canon §5.7).",
        },
        {
            key: "ta04",
            icon: Stamp,
            title: "5. Pengesahan TA-04 oleh KaDep",
            status: ta04StatusLabel,
            state: ta04Accepted
                ? "completed"
                : ta04Submitted
                    ? "active"
                    : !seminarEligibility?.eligible
                        ? "pending"
                        : "active",
            description:
                "KaDep mengesahkan TA-04 setelah pembimbing resmi + proposal final + TA-03A + TA-03B + SIA mengonfirmasi MK Tugas Akhir.",
        },
    ];

    return (
        <div className="space-y-5 sm:space-y-6">
            <LocalTabsNav tabs={TAB_ITEMS} activeTab={activeTab} onTabChange={setActiveTab} />

            {activeTab === "overview" && (
                <div className="space-y-6">
                    {/* If Proposed (Diajukan) -> Show Pending Card */}
                    {isProposed && (
                        <PendingApprovalCard status={thesisDetail?.status || "Diajukan"} />
                    )}

                    {/* If Failed (Gagal) -> Show warning + sediakan jalur digital re-apply (P1-03).
                        Canon §5.2 + §5.9: TA-02 jalur dept terbuka untuk mahasiswa Failed sebagai
                        re-apply digital. Eskalasi ke departemen fisik hanya bila TA-02 digital
                        ditolak juga. */}
                    {isFailed && (
                        <div className="space-y-6">
                            <Card className="w-full border-destructive/30 bg-destructive/5">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                                                <AlertCircle className="h-6 w-6 text-destructive" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl text-destructive">Tugas Akhir Gagal</CardTitle>
                                                <CardDescription>Tugas akhir Anda telah melewati batas waktu</CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="destructive">
                                            GAGAL
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                                        <p className="text-sm font-medium text-destructive">
                                            Tugas akhir Anda telah melewati deadline. Anda dapat mendaftar ulang melalui jalur TA-02 digital di bawah, atau berkoordinasi langsung dengan departemen bila perlu evaluasi khusus.
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <Button onClick={() => navigate("/metopel/cari-pembimbing")}>
                                            <BookOpen className="mr-2 h-4 w-4" />
                                            Ajukan TA-02 Baru
                                        </Button>
                                        <Button variant="outline" onClick={() => navigate("/metopel")}>
                                            <FileText className="mr-2 h-4 w-4" />
                                            Lihat Overview Metopel
                                        </Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-2">
                                        <p>Bila kasus Anda perlu diskusi langsung (mis. evaluasi akademik), Anda juga dapat:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Datang ke departemen untuk konsultasi</li>
                                            <li>Menentukan pembimbing baru bersama departemen</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* If Cancelled (Dibatalkan) -> route back to advisor request flow */}
                    {isCancelled && (
                        <div className="space-y-6">
                            <Card className="w-full border-destructive/20 bg-destructive/5">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
                                                <AlertCircle className="h-6 w-6 text-destructive" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl text-destructive">Tugas Akhir Tidak Aktif</CardTitle>
                                                <CardDescription>Status tugas akhir Anda saat ini: <strong>{thesisDetail?.status}</strong></CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="destructive">
                                            {thesisDetail?.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Tugas Akhir Anda sebelumnya telah dibatalkan. Pengajuan ulang harus dimulai dari alur TA-01/TA-02 agar draft,
                                            histori submission, dan penetapan pembimbing tetap tercatat pada jalur resmi.
                                        </p>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Button onClick={() => navigate("/metopel/cari-pembimbing")}>
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                Ajukan TA-01/TA-02
                                            </Button>
                                            <Button variant="outline" onClick={() => navigate("/metopel")}>
                                                <FileText className="mr-2 h-4 w-4" />
                                                Lihat Overview Metopel
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* P1-14 (canon §5.10): Banner sukses TA-04 disahkan dengan CTA download SK PDF.
                        Tampil hanya saat proposalStatus = "accepted" (KaDep sudah sahkan) dan thesis aktif. */}
                    {isThesisActive && ta04Accepted && (
                        <Card className="w-full border-emerald-200 bg-emerald-50/70">
                            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                        <Stamp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-emerald-900">
                                            Selamat! Judul TA Anda sudah disahkan KaDep.
                                        </p>
                                        <p className="text-sm text-emerald-800">
                                            SK Penugasan Pembimbing TA-04 sudah resmi terbit. Anda kini berada di fase Tugas Akhir penuh — akses Bimbingan Tugas Akhir, Seminar Hasil, dan Sidang sudah aktif.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                                    <Button
                                        variant="outline"
                                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                                        onClick={() => navigate('/metopel')}
                                    >
                                        <Archive className="mr-2 h-4 w-4" />
                                        Lihat Arsip Metopel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {isThesisActive && (
                        <>
                            {/* 1. INFO CARD TUGAS AKHIR */}
                            <Card className="w-full border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                                <BookOpen className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Informasi Tugas Akhir</CardTitle>
                                                <CardDescription>Detail status pengerjaan tugas akhir Anda</CardDescription>
                                            </div>
                                        </div>
                                        {thesisDetail?.status && (
                                            <Badge
                                                variant={
                                                    thesisDetail.status === "aktif" ? "default" : "secondary"
                                                }
                                            >
                                                {thesisDetail.status.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        {/* Judul & Detail Utama */}
                                        <div>
                                            <h3 className="text-lg font-semibold leading-relaxed mb-3">{thesisDetail?.title || "Judul belum diatur"}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                {/* Topic */}
                                                {thesisDetail?.topic && (
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Target className="h-4 w-4" />
                                                        <span>Topik: <span className="text-foreground font-medium">{thesisDetail.topic.name}</span></span>
                                                    </div>
                                                )}
                                                {/* Sisa Waktu */}
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Sisa Waktu: <span className="text-foreground font-medium">{getRemainingTime()} (Estimasi)</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Supervisor List */}
                                        <div className="pt-2">
                                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                                                <GraduationCap className="h-4 w-4" /> Dosen Pembimbing
                                            </span>

                                            {/* Pending Request Card */}
                                            {pendingRequest && (
                                                <div className="mb-4">
                                                    <PendingRequestCard request={pendingRequest} />
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {(() => {
                                                    const supervisors = (thesisDetail?.supervisors ?? []) as ThesisSupervisorItem[];

                                                    if (supervisors.length === 0) {
                                                        return null;
                                                    }

                                                    return supervisors
                                                        .sort((a, b) => {
                                                            const roleA = (a.role || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                                                            const roleB = (b.role || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                                                            if (roleA.includes('pembimbing1')) return -1;
                                                            if (roleB.includes('pembimbing1')) return 1;
                                                            return roleA.localeCompare(roleB);
                                                        })
                                                        .map((sup) => {
                                                            const email = sup.email ?? null;
                                                            const nip = sup.nip || sup.identityNumber;
                                                            const isCopied = copiedId === sup.id;

                                                            return (
                                                                <div key={sup.id} className="p-3 rounded-xl bg-background/50 border hover:bg-background/80 transition-colors">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20 text-primary">
                                                                            {formatRoleName(sup.role)}
                                                                        </Badge>
                                                                    </div>

                                                                    <div className="space-y-1.5">
                                                                        <p className="font-medium text-sm leading-tight text-foreground/90">{toTitleCaseName(sup.name)}</p>

                                                                        {nip && (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                                <CreditCard className="h-3 w-3 shrink-0" />
                                                                                <span>{nip}</span>
                                                                            </div>
                                                                        )}

                                                                        {email && (
                                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground group">
                                                                                <Mail className="h-3 w-3 shrink-0" />
                                                                                <span className="truncate" title={email}>{email}</span>
                                                                                <button
                                                                                    onClick={() => copyEmail(sup.id, email)}
                                                                                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                                                                                    title="Salin Email"
                                                                                >
                                                                                    {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                })()}

                                                {/* Request Pembimbing 2 Logic */}
                                                {(!hasPembimbing2 && !pendingRequest && (thesisDetail?.supervisors?.length || 0) > 0) && (
                                                    <div className="flex items-center justify-center p-3 rounded-xl border border-dashed hover:bg-background/50 transition-colors min-h-25">
                                                        <div className="text-center space-y-2 w-full">
                                                            <p className="text-xs text-muted-foreground">Belum ada Pembimbing 2?</p>
                                                            <div className="flex justify-center">
                                                                <RequestSupervisor2Dialog
                                                                    hasPembimbing2={!!hasPembimbing2}
                                                                    hasPendingRequest={!!pendingRequest}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* P0-02 (canon §5.6 + BR-10): Section "Dokumen Tugas Akhir" legacy yang
                                menampilkan `proposalDocument` / `document` / `uploadedFiles` dihapus.
                                Source of truth proposal final adalah `ProposalVersionHistory` di bawah.
                                Mahasiswa tidak boleh kebingungan antara field legacy vs canon. */}
                            {thesisId && (
                                <Card className="w-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Versi Proposal &amp; Submit Final</CardTitle>
                                                <CardDescription>
                                                    Mahasiswa boleh upload beberapa versi proposal. Pilih satu sebagai &ldquo;Final aktif&rdquo; sebelum siklus penilaian TA-03A &amp; TA-03B berjalan.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <ProposalVersionHistory thesisId={thesisId} compact />
                                    </CardContent>
                                </Card>
                            )}

                            {/* 2. QUICK ACCESS & STATS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="md:col-span-1 border-primary/10 shadow-sm">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Aksi Cepat</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/student?action=create')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <Plus className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Ajukan Bimbingan</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/student/history')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <History className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Riwayat Bimbingan</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/student/history')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Cetak Riwayat Bimbingan</span>
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Stepper Alur Proposal &rarr; TA-04</CardTitle>
                                        <CardDescription>
                                            Lima step kualitatif dari pembimbing resmi sampai pengesahan TA-04 oleh KaDep. Tidak ada gate kuantitatif &ldquo;minimum N sesi&rdquo; (canon §5.5 + Q3).
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {stepperItems.map((step) => {
                                            const Icon = step.icon;
                                            const stateClass =
                                                step.state === "completed"
                                                    ? "border-emerald-200 bg-emerald-50"
                                                    : step.state === "active"
                                                        ? "border-blue-200 bg-blue-50"
                                                        : "border-border bg-muted/20";
                                            const iconClass =
                                                step.state === "completed"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : step.state === "active"
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-muted text-muted-foreground";
                                            const badgeClass =
                                                step.state === "completed"
                                                    ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                                                    : step.state === "active"
                                                        ? "border-blue-200 bg-blue-100 text-blue-800"
                                                        : "border-border";
                                            return (
                                                <div key={step.key} className={`rounded-lg border p-4 ${stateClass}`}>
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconClass}`}>
                                                                {step.state === "completed" ? (
                                                                    <Check className="h-4 w-4" />
                                                                ) : (
                                                                    <Icon className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm font-medium">{step.title}</p>
                                                                <p className="text-xs text-muted-foreground">{step.description}</p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={`max-w-[14rem] text-right whitespace-normal ${badgeClass}`}>
                                                            {step.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-900">
                                            <p className="font-medium">Catatan transisi</p>
                                            <p className="mt-1 text-blue-800">
                                                Tugas atau milestone Metopen tidak lagi menjadi syarat operasional. Jalur aktif: submit proposal final, penilaian TA-03A &amp; TA-03B paralel, lalu TA-04 setelah SIA mengonfirmasi pengambilan mata kuliah Tugas Akhir. Bimbingan dilakukan secara berkala (kualitatif) — minimal 8 sesi (TA-06) baru berlaku di Seminar Hasil, bukan di SIMPTA.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "history" && (
                <div className="space-y-6">

                    <div className="w-full flex flex-col gap-6">
                        {(historyData?.theses as ThesisHistoryItem[] | undefined)?.map((thesis) => (
                            <Card key={thesis.id} className="w-full border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
                                <CardHeader className="pb-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                                <History className="h-6 w-6 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-xl">Riwayat Tugas Akhir</CardTitle>
                                                <CardDescription>Detail riwayat pengerjaan tugas akhir</CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <Badge
                                                variant={
                                                    thesis.status === "aktif" || thesis.status === "Selesai"
                                                        ? "default"
                                                        : "secondary"
                                                }
                                            >
                                                {thesis.status.toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDateId(thesis.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold leading-relaxed mb-3">
                                            {thesis.title}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Target className="h-4 w-4" />
                                                <span>
                                                    Topik:{" "}
                                                    <span className="text-foreground font-medium">
                                                        {thesis.topic}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Clock className="h-4 w-4" />
                                                <span>
                                                    Periode:{" "}
                                                    <span className="text-foreground font-medium">
                                                        {thesis.academicYear}
                                                    </span>
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <FileText className="h-4 w-4" />
                                                <span>
                                                    Total Bimbingan:{" "}
                                                    <span className="text-foreground font-medium">
                                                        {thesis.stats.guidances} kali
                                                    </span>
                                                </span>
                                            </div>
                                            {(thesis.status === "Gagal" || thesis.rating === "FAILED") && thesis.supervisors && thesis.supervisors.length > 0 && (
                                                <div className="flex items-start gap-2 text-muted-foreground md:col-span-2 mt-2 pt-2 border-t border-border/50">
                                                    <GraduationCap className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <span className="text-xs font-medium">Dosen Pembimbing:</span>
                                                        <div className="flex flex-wrap gap-2 text-foreground font-medium">
                                                            {thesis.supervisors.map((sup) => (
                                                                <Badge key={sup.id} variant="secondary" className="text-xs font-normal bg-primary/5 hover:bg-primary/10 transition-colors">
                                                                    {toTitleCaseName(sup.name)}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {(!historyData?.theses || historyData.theses.length === 0) && (
                            <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                <Archive className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium">Belum Ada Riwayat</h3>
                                <p className="text-muted-foreground">Anda belum memiliki riwayat tugas akhir sebelumnya.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
