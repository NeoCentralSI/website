import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStudentSupervisors, getMyThesisDetail, getStudentThesisHistory } from "@/services/studentGuidance.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
    BookOpen,
    GraduationCap,
    Target,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Plus,
    FileText,
    CreditCard,
    Mail,
    Copy,
    Check,
    History,
    AlertCircle,
    Archive,
    ShieldAlert,
    Download,
} from "lucide-react";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { useMilestones, useDefenceReadinessStatus } from "@/hooks/milestone";
import { DefenceReadinessStatusCard } from "@/components/milestone";
import { Loading } from "@/components/ui/spinner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { StudentThesisChangeRequestCard } from "@/components/thesis-change-request/StudentThesisChangeRequestCard";
import { toast } from "sonner";
import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { getGuidanceActionBlockReason } from "@/lib/thesisLabels";
import { RequirementsNotMet } from "@/components/shared/RequirementsNotMet";
import { SeminarReadinessStatusCard } from "@/components/milestone/student/SeminarReadinessStatusCard";

const STATUS_LABELS: Record<string, string> = {
    not_started: "Belum Dimulai",
    in_progress: "Sedang Dikerjakan",
    pending_review: "Menunggu Review",
    revision_needed: "Revisi",
    completed: "Selesai",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    not_started: "outline",
    in_progress: "secondary",
    pending_review: "secondary",
    revision_needed: "destructive",
    completed: "default",
};

export default function TugasAkhirOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();
    const [copiedId, setCopiedId] = useState<string | null>(null);

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

    const thesisId = supervisorsData?.thesisId || "";
    const hasThesis = !!thesisId;

    const { data: thesisDetail, isLoading: isLoadingThesis, isError: isThesisDetailError } = useQuery({
        queryKey: ["my-thesis-detail"],
        queryFn: getMyThesisDetail,
        enabled: hasThesis,
    });

    // History Data
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["student-thesis-history"],
        queryFn: getStudentThesisHistory,
    });

    const { data: milestonesData, isLoading: isLoadingMilestones } = useMilestones(thesisId);
    const milestones = milestonesData?.milestones ?? [];

    const { data: defenceStatus } = useDefenceReadinessStatus(thesisId);
    const isSeminarCompleted = defenceStatus?.requirementsMet === true;

    // Determines statuses
    // K15: "Dibatalkan" and "Diajukan" no longer exist; a stopped thesis is `failed`, and the
    // detail endpoint only returns TA-phase theses (proposal-phase students get 404).
    const isFailed = thesisDetail?.status === "failed";
    const isThesisActive = thesisDetail?.status !== "failed";
    // K14: the quick action stays visible but disabled with a reason unless status is `research`.
    const guidanceBlockReason = thesisDetail ? getGuidanceActionBlockReason(thesisDetail.status) : null;



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

    if (isLoadingThesis || isLoadingMilestones || isLoadingHistory) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loading size="lg" text="Memuat data tugas akhir..." />
            </div>
        );
    }

    if ((!hasThesis || isThesisDetailError) && (!historyData?.theses || historyData.theses.length === 0)) {
        return (
            <RequirementsNotMet
                title="Syarat Mata Kuliah Belum Terpenuhi"
                description="Anda belum memenuhi persyaratan untuk mengambil mata kuliah Tugas Akhir."
                requirements={[
                    {
                        label: "Mengambil mata kuliah Tugas Akhir",
                        met: false,
                        description: "Anda harus tercatat mengambil mata kuliah Tugas Akhir (proposal disetujui).",
                    },
                ]}
                homeUrl="/dashboard"
            />
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Tugas Akhir</h1>
                <p className="text-muted-foreground">Status terkini dan riwayat tugas akhir Anda</p>
            </div>

            <Tabs defaultValue={hasThesis ? "overview" : "history"} className="space-y-6 w-full">
                <TabsList>
                    <TabsTrigger value="overview" disabled={!isThesisActive && !hasThesis}>Status Terkini</TabsTrigger>
                    <TabsTrigger value="history">Riwayat Tugas Akhir</TabsTrigger>
                </TabsList>

                {/* --- TAB: OVERVIEW (CURRENT THESIS) --- */}
                <TabsContent value="overview" className="w-full space-y-6">
                    {/* If Failed (Gagal) -> Show warning message, must go to department */}
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
                                            Tugas akhir Anda telah melewati deadline. Silakan ke departemen untuk mendaftar ulang tugas akhir.
                                        </p>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-2">
                                        <p>Untuk mendaftar ulang tugas akhir, Anda perlu:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Datang ke departemen secara langsung</li>
                                            <li>Menentukan pembimbing baru bersama departemen</li>
                                            <li>Mencari dan memilih topik serta judul baru</li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                                        {thesisDetail?.status && <ThesisStatusBadge status={thesisDetail.status} />}
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
                                                {/* Masa bimbingan (dihitung dari tanggal mulai, tidak disimpan) */}
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Masa Bimbingan: <span className="text-foreground font-medium">{thesisDetail?.supervisionClock?.elapsedLabel ?? "-"}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Supervisor List */}
                                        <div className="pt-2">
                                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                                                <GraduationCap className="h-4 w-4" /> Dosen Pembimbing
                                            </span>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {thesisDetail?.supervisors && thesisDetail.supervisors.length > 0 && thesisDetail.supervisors
                                                    .sort((a: any, b: any) => {
                                                        const roleA = (a.role || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                                                        const roleB = (b.role || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                                                        if (roleA.includes('pembimbing1')) return -1;
                                                        if (roleB.includes('pembimbing1')) return 1;
                                                        return roleA.localeCompare(roleB);
                                                    })
                                                    .map((sup: any) => {
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

                                                                    {sup.email && (
                                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground group">
                                                                            <Mail className="h-3 w-3 shrink-0" />
                                                                            <span className="truncate" title={sup.email}>{sup.email}</span>
                                                                            <button
                                                                                onClick={() => copyEmail(sup.id, sup.email)}
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
                                                    })}

                                            </div>
                                        </div>

                                        {/* Readiness Cards Integrated */}
                                        {!isSeminarCompleted && thesisId && (
                                            <SeminarReadinessStatusCard thesisId={thesisId} className="mt-0" />
                                        )}

                                        {thesisId && (
                                            <div className="mt-4">
                                                <DefenceReadinessStatusCard thesisId={thesisId} className="mt-0" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Pengajuan Perubahan Tugas Akhir (judul, ganti/tambah pembimbing) */}
                            <StudentThesisChangeRequestCard />

                            {/* DOKUMEN TUGAS AKHIR */}
                            {/* Always shown: an empty latest-report slot reads "Belum ada dokumen" */}
                            {thesisDetail && (
                                <Card className="w-full">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                                <FileText className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">Dokumen Tugas Akhir</CardTitle>
                                                <CardDescription>File yang telah Anda upload</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {/* Proposal */}
                                            {thesisDetail.proposalDocument && (
                                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50/50">
                                                    <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{thesisDetail.proposalDocument.fileName}</p>
                                                        <p className="text-xs text-muted-foreground">Proposal</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="shrink-0" aria-label="Buka berkas" onClick={() => openAuthenticatedFileOrToast(thesisDetail.proposalDocument!.filePath)}><Download className="h-4 w-4" /></Button>
                                                </div>
                                            )}

                                            {/* Latest Draft */}
                                            {!thesisDetail.document?.filePath && (
                                                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
                                                    <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm text-muted-foreground italic">Belum ada dokumen</p>
                                                        <p className="text-xs text-muted-foreground">Draft Terbaru</p>
                                                    </div>
                                                </div>
                                            )}
                                            {thesisDetail.document?.filePath && (
                                                <div className="flex items-center gap-3 p-3 rounded-lg border bg-green-50/50">
                                                    <FileText className="h-8 w-8 text-green-500 shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium truncate">{thesisDetail.document.fileName}</p>
                                                        <p className="text-xs text-muted-foreground">Draft Terbaru</p>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="shrink-0" aria-label="Buka berkas" onClick={() => openAuthenticatedFileOrToast(thesisDetail.document!.filePath)}><Download className="h-4 w-4" /></Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* File Versions */}
                                        {thesisDetail.uploadedFiles && thesisDetail.uploadedFiles.length > 1 && (
                                            <div className="space-y-2">
                                                <Separator />
                                                <p className="text-sm font-medium text-muted-foreground">Riwayat File Upload ({thesisDetail.uploadedFiles.length} versi)</p>
                                                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                                    {thesisDetail.uploadedFiles.map((file, idx) => (
                                                        <div key={file.id} className="flex items-center gap-3 p-2 rounded-md border text-sm">
                                                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="truncate font-medium">{file.fileName}</p>
                                                                <p className="text-xs text-muted-foreground">{formatDateId(file.uploadedAt)}</p>
                                                            </div>
                                                            {idx === 0 && (
                                                                <Badge variant="outline" className="text-[10px] shrink-0">Terbaru</Badge>
                                                            )}
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Buka berkas" onClick={() => openAuthenticatedFileOrToast(file.filePath)}><Download className="h-3.5 w-3.5" /></Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
                                            disabled={!!guidanceBlockReason}
                                            title={guidanceBlockReason ?? undefined}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <Plus className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Ajukan Bimbingan</span>
                                        </Button>
                                        {guidanceBlockReason && (
                                            <p className="text-xs text-muted-foreground">{guidanceBlockReason}</p>
                                        )}
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/student/milestone')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <Target className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Kelola Milestone</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/student?status=completed')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Cetak Riwayat Bimbingan</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/danger-zone')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center mr-3 group-hover:bg-destructive/20 transition-colors">
                                                <ShieldAlert className="h-4 w-4 text-destructive" />
                                            </div>
                                            <span>Zona Berbahaya</span>
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="md:col-span-2">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Milestone Progress Summary</CardTitle>
                                        <CardDescription>Perjalanan pengerjaan tugas akhir Anda</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-muted-foreground">Total Penyelesaian</span>
                                                <span className="text-sm font-bold text-primary">
                                                    {Math.round((milestones.filter((m: any) => m.status === 'completed').length / (milestones.length || 1)) * 100)}%
                                                </span>
                                            </div>
                                            <Progress value={Math.round((milestones.filter((m: any) => m.status === 'completed').length / (milestones.length || 1)) * 100)} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {milestones.filter((m: any) => m.status === 'completed').length} dari {milestones.length} tahapan selesai
                                            </p>
                                        </div>

                                        <div className="h-100 overflow-y-auto pr-4 pl-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                                            <div className="relative border-l ml-2 space-y-8 my-2 pt-2">
                                                {milestones
                                                    .sort((a: any, b: any) => {
                                                        const statusPriority = {
                                                            in_progress: 0,
                                                            revision_needed: 1,
                                                            pending_review: 2,
                                                            not_started: 3,
                                                            completed: 4
                                                        };
                                                        const scoreA = statusPriority[a.status as keyof typeof statusPriority] ?? 5;
                                                        const scoreB = statusPriority[b.status as keyof typeof statusPriority] ?? 5;
                                                        return scoreA - scoreB;
                                                    })
                                                    .map((milestone: any) => {
                                                        const getStatusIcon = (status: string) => {
                                                            switch (status) {
                                                                case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
                                                                case "in_progress": return <Clock className="h-5 w-5 text-blue-500" />;
                                                                case "revision_needed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
                                                                default: return <Clock className="h-5 w-5 text-gray-300" />;
                                                            }
                                                        };

                                                        return (
                                                            <div key={milestone.id} className="ml-6 relative group pb-2">
                                                                <span className={cn(
                                                                    "absolute -left-10.25 top-0 p-1 rounded-full border bg-background z-10",
                                                                    milestone.status === 'completed' ? "border-green-500" :
                                                                        milestone.status === 'in_progress' ? "border-blue-500" : "border-border"
                                                                )}>
                                                                    {getStatusIcon(milestone.status)}
                                                                </span>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className={cn(
                                                                            "font-medium text-sm leading-snug mt-0.5",
                                                                            milestone.status === 'in_progress' && "text-primary font-bold"
                                                                        )}>
                                                                            {milestone.title}
                                                                        </h4>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                                            <span>Proses</span>
                                                                            <span>{milestone.progressPercentage || 0}%</span>
                                                                        </div>
                                                                        <Progress value={milestone.progressPercentage || 0} className={cn(
                                                                            "h-1.5",
                                                                            milestone.status === 'completed' ? "bg-green-100" : ""
                                                                        )} />
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                                                                        <Badge variant={STATUS_VARIANTS[milestone.status] || "outline"} className="text-[10px] h-5 px-1.5 font-normal">
                                                                            {STATUS_LABELS[milestone.status] || milestone.status.replace(/_/g, " ")}
                                                                        </Badge>
                                                                        {milestone.updatedAt && (
                                                                            <span className="text-xs text-muted-foreground/70">
                                                                                {formatDateId(milestone.updatedAt)}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                {milestones.length === 0 && (
                                                    <p className="text-sm text-muted-foreground pl-8">Belum ada milestone.</p>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </>
                    )}
                </TabsContent>

                {/* --- TAB: RIWAYAT (HISTORY) --- */}
                <TabsContent value="history" className="w-full space-y-6">

                    <div className="w-full flex flex-col gap-6">
                        {historyData?.theses?.map((thesis: any) => (
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
                                            <ThesisStatusBadge status={thesis.status} />
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
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>
                                                    Milestone Selesai:{" "}
                                                    <span className="text-foreground font-medium">
                                                        {thesis.stats.completedMilestones} tahapan
                                                    </span>
                                                </span>
                                            </div>
                                            {thesis.status === "failed" && thesis.supervisors && thesis.supervisors.length > 0 && (
                                                <div className="flex items-start gap-2 text-muted-foreground md:col-span-2 mt-2 pt-2 border-t border-border/50">
                                                    <GraduationCap className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <div className="flex flex-col gap-1.5 w-full">
                                                        <span className="text-xs font-medium">Dosen Pembimbing:</span>
                                                        <div className="flex flex-wrap gap-2 text-foreground font-medium">
                                                            {thesis.supervisors.map((sup: any) => (
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
