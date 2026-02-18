import { useOutletContext, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStudentSupervisors, getMyThesisDetail, getStudentThesisHistory } from "@/services/studentGuidance.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
} from "lucide-react";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { useMilestones } from "@/hooks/milestone";
import { Loading } from "@/components/ui/spinner";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { RequestSupervisor2Dialog } from "@/components/bimbingan/RequestSupervisor2Dialog";
import { getPendingSupervisor2Request } from "@/services/studentGuidance.service";
import { PendingRequestCard } from "@/components/bimbingan/PendingRequestCard";
import { toast } from "sonner";

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

    // History Data
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["student-thesis-history"],
        queryFn: getStudentThesisHistory,
    });

    const { data: milestonesData, isLoading: isLoadingMilestones } = useMilestones(thesisId);
    const milestones = milestonesData?.milestones ?? [];

    const hasPembimbing2 = thesisDetail?.supervisors?.some((s: any) =>
        (s.role || "").toLowerCase().includes("pembimbing 2") ||
        (s.role || "").toLowerCase().includes("pembimbing2")
    );

    // Determines if current thesis is active or cancelled/failed
    const isThesisActive = thesisDetail?.status !== "Dibatalkan" && thesisDetail?.status !== "Gagal";

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
        return "2 Bulan 15 Hari"; // Placeholder
    };

    if (isLoadingThesis || isLoadingMilestones || isLoadingHistory) {
        return <Loading size="lg" text="Memuat data tugas akhir..." />;
    }

    if (!hasThesis && (!historyData?.theses || historyData.theses.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <h3 className="text-lg font-semibold mb-2">Belum Terdaftar Tugas Akhir</h3>
                <p className="text-muted-foreground">Silakan hubungi admin untuk pendaftaran.</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Tabs defaultValue={isThesisActive ? "overview" : "history"} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview" disabled={!isThesisActive && !hasThesis}>Status Terkini</TabsTrigger>
                    <TabsTrigger value="history">Riwayat Tugas Akhir</TabsTrigger>
                </TabsList>

                {/* --- TAB: OVERVIEW (CURRENT THESIS) --- */}
                <TabsContent value="overview" className="space-y-6">
                    {!isThesisActive && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Tugas Akhir Tidak Aktif</AlertTitle>
                            <AlertDescription>
                                Status tugas akhir Anda saat ini adalah <strong>{thesisDetail?.status}</strong>.
                                Silakan hubungi Departemen untuk melakukan pendaftaran ulang judul baru.
                            </AlertDescription>
                        </Alert>
                    )}

                    {isThesisActive && (
                        <>
                            {/* 1. INFO CARD TUGAS AKHIR */}
                            <Card className="border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
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

                                                {/* Request Pembimbing 2 Logic */}
                                                {(!hasPembimbing2 && !pendingRequest && (thesisDetail?.supervisors?.length || 0) > 0) && (
                                                    <div className="flex items-center justify-center p-3 rounded-xl border border-dashed hover:bg-background/50 transition-colors min-h-[100px]">
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
                                            onClick={() => navigate('/tugas-akhir/bimbingan/milestone')}
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                                                <Target className="h-4 w-4 text-primary" />
                                            </div>
                                            <span>Kelola Milestone</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all group"
                                            onClick={() => navigate('/tugas-akhir/bimbingan/completed-history')}
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

                                        <div className="h-[400px] overflow-y-auto pr-4 pl-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
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
                                                                    "absolute -left-[41px] top-0 p-1 rounded-full border bg-background z-10",
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
                <TabsContent value="history" className="space-y-6">
                    {!isThesisActive && (
                        <Card className="border-yellow-200 bg-yellow-50 mb-6">
                            <CardContent className="flex items-start gap-4 p-4">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                                <div>
                                    <h4 className="font-semibold text-yellow-800">Pendaftaran Ulang Diperlukan</h4>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        Karena tugas akhir sebelumnya telah dibatalkan atau tidak lulus, Anda perlu melakukan pendaftaran judul baru melalui Departemen.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-4">
                        {historyData?.theses?.map((thesis: any) => (
                            <Card key={thesis.id} className={cn(
                                "border transition-all",
                                (thesis.status === 'Dibatalkan' || thesis.status === 'Gagal') ? "bg-muted/30 opacity-75 hover:opacity-100" : ""
                            )}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={
                                                    thesis.status === 'aktif' ? 'default' :
                                                        thesis.status === 'Selesai' ? 'default' : // Green usually
                                                            'secondary'
                                                }>
                                                    {thesis.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{formatDateId(thesis.createdAt)}</span>
                                            </div>
                                            <CardTitle className="text-lg leading-snug">{thesis.title}</CardTitle>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Topik:</span>
                                            <span className="font-medium">{thesis.topic}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <History className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Periode:</span>
                                            <span className="font-medium">{thesis.academicYear}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Total Bimbingan:</span>
                                            <span className="font-medium">{thesis.stats.guidances} kali</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Milestone Selesai:</span>
                                            <span className="font-medium">{thesis.stats.completedMilestones} tahapan</span>
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
