import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { getStudentDetail, validateMilestone, requestMilestoneRevision, createMilestoneForStudent, type CreateMilestoneForStudentDto } from "@/services/lecturerGuidance.service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import { FileText, CheckCircle2, Clock, AlertTriangle, AlertCircle, Download, ArrowLeft, BookOpen, Calendar, Bell, PartyPopper, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SeminarReadinessCard } from "@/components/milestone/lecturer/SeminarReadinessCard";
import { DefenceReadinessCard } from "@/components/milestone/lecturer/DefenceReadinessCard";
import { useSeminarReadinessStatus } from "@/hooks/milestone/useMilestone";
import { ChangeRequestReviewCard } from "@/components/tugas-akhir/lecturer/ChangeRequestReviewCard";
import { GuidanceHistorySection } from "@/components/tugas-akhir/lecturer/GuidanceHistorySection";
import { RefreshButton } from "@/components/ui/refresh-button";
// import { SupervisorScoreCard } from "@/components/metopen/SupervisorScoreCard";

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

export default function LecturerMyStudentDetailPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { thesisId } = useParams<{ thesisId: string }>();
    const queryClient = useQueryClient();
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);

    // Create milestone dialog state
    const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [milestoneDescription, setMilestoneDescription] = useState("");
    const [milestoneTargetDate, setMilestoneTargetDate] = useState<Date | undefined>();
    const [milestoneSupervisorNotes, setMilestoneSupervisorNotes] = useState("");
    const [reviewNotes, setReviewNotes] = useState("");

    // Helper to convert backend URLs to absolute URLs
    const getDocumentUrl = (path: string): string => {
        if (path.startsWith("http://") || path.startsWith("https://")) {
            return path;
        }
        // Backend returns paths WITH /uploads/ prefix, so we need to use it as-is
        // getApiUrl() just prepends base URL: http://localhost:3000 + /uploads/thesis/file.pdf
        let url = getApiUrl(path);
        const token = localStorage.getItem("accessToken");
        if (token && path.includes("thesis/")) {
            url += (url.includes("?") ? "&" : "?") + `token=${token}`;
        }
        return url;
    };

    // Initial breadcrumb, will be updated when data is loaded
    const baseBreadcrumb = useMemo(() => [
        { label: "Tugas Akhir" },
        { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" },
        { label: "Mahasiswa Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/my-students" },
        { label: "Detail Mahasiswa" }
    ], []);

    useEffect(() => {
        setBreadcrumbs(baseBreadcrumb);
        setTitle(undefined);
    }, [baseBreadcrumb, setBreadcrumbs, setTitle]);

    const { data: detailData, isLoading, isError, isFetching, refetch } = useQuery({
        queryKey: ['student-detail', thesisId],
        queryFn: () => getStudentDetail(thesisId!).then(res => res.data),
        enabled: !!thesisId
    });

    const { data: readinessStatus } = useSeminarReadinessStatus(thesisId);

    const progressPercentage = useMemo(() => {
        if (!detailData?.milestones?.length) return 0;
        const completed = detailData.milestones.filter(m => m.status === 'completed').length;
        return Math.round((completed / detailData.milestones.length) * 100);
    }, [detailData?.milestones]);

    const isCancelled = useMemo(() => {
        if (!detailData?.status) return false;
        const status = detailData.status.toLowerCase();
        return status === "dibatalkan" || status === "gagal" || status === "cancelled";
    }, [detailData?.status]);

    const isPembimbing1 = useMemo(() => {
        if (!detailData?.userRole) return false;
        const role = detailData.userRole.toLowerCase();
        return role === "pembimbing 1" || role === "pembimbing1";
    }, [detailData?.userRole]);

    // const isProposed = useMemo(() => {
    //     return detailData?.status === "Diajukan";
    // }, [detailData?.status]);

    // const approveProposalMutation = useMutation({
    //     mutationFn: () => approveThesisProposalAPI(thesisId!),
    //     onSuccess: () => {
    //         toast.success("Proposal berhasil disetujui. Status mahasiswa kini Aktif.");
    //         queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
    //         queryClient.invalidateQueries({ queryKey: ['lecturer-my-students'] });
    //     },
    //     onError: (error: Error) => {
    //         toast.error(error.message);
    //     }
    // });

    const validateMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string, notes?: string }) => validateMilestone(id, notes),
        onSuccess: () => {
            toast.success("Milestone berhasil divalidasi");
            queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
            setSelectedMilestoneId(null);
            setReviewNotes("");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
        onSettled: () => {
            setValidatingId(null);
        }
    });

    const requestRevisionMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string, notes: string }) => requestMilestoneRevision(id, notes),
        onSuccess: () => {
            toast.success("Permintaan revisi berhasil dikirim");
            queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
            setSelectedMilestoneId(null);
            setReviewNotes("");
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
        onSettled: () => {
            setValidatingId(null);
        }
    });

    const createMilestoneMutation = useMutation({
        mutationFn: (data: CreateMilestoneForStudentDto) => createMilestoneForStudent(thesisId!, data),
        onSuccess: () => {
            toast.success("Milestone berhasil dibuat untuk mahasiswa");
            queryClient.invalidateQueries({ queryKey: ['student-detail', thesisId] });
            setCreateMilestoneOpen(false);
            resetMilestoneForm();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        }
    });

    const resetMilestoneForm = () => {
        setMilestoneTitle("");
        setMilestoneDescription("");
        setMilestoneTargetDate(undefined);
        setMilestoneSupervisorNotes("");
    };

    const handleCreateMilestone = () => {
        if (!milestoneTitle.trim()) {
            toast.error("Judul milestone wajib diisi");
            return;
        }
        createMilestoneMutation.mutate({
            title: milestoneTitle.trim(),
            description: milestoneDescription.trim() || undefined,
            targetDate: milestoneTargetDate?.toISOString(),
            supervisorNotes: milestoneSupervisorNotes.trim() || undefined,
        });
    };

    const handleValidate = () => {
        if (selectedMilestoneId) {
            setValidatingId(selectedMilestoneId);
            validateMutation.mutate({ id: selectedMilestoneId, notes: reviewNotes.trim() || undefined });
        }
    };

    const handleRequestRevision = () => {
        if (!selectedMilestoneId) return;
        if (!reviewNotes.trim()) {
            toast.error("Catatan revisi wajib diisi");
            return;
        }
        setValidatingId(selectedMilestoneId);
        requestRevisionMutation.mutate({ id: selectedMilestoneId, notes: reviewNotes.trim() });
    };

    // Update breadcrumb with student name when data is loaded
    useEffect(() => {
        if (detailData?.student.fullName) {
            setBreadcrumbs([
                { label: "Tugas Akhir" },
                { label: "Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/requests" },
                { label: "Mahasiswa Bimbingan", href: "/tugas-akhir/bimbingan/lecturer/my-students" },
                { label: toTitleCaseName(detailData.student.fullName) }
            ]);
        }
    }, [detailData, setBreadcrumbs]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case "in_progress": return <Clock className="h-5 w-5 text-blue-500" />;
            case "revision_needed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
            default: return <Clock className="h-5 w-5 text-gray-300" />;
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Memuat detail mahasiswa...</p>
            </div>
        );
    }

    if (isError || !detailData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100">
                <EmptyState
                    title="Terjadi Kesalahan"
                    description="Gagal memuat data mahasiswa. Silakan coba lagi."
                    showButton
                    buttonText="Kembali"
                    onButtonClick={() => window.location.href = '/tugas-akhir/bimbingan/lecturer/my-students'}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild className="shrink-0">
                        <Link to="/tugas-akhir/bimbingan/lecturer/my-students">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{toTitleCaseName(detailData.student.fullName)}</h1>
                        <p className="text-muted-foreground">
                            {detailData.student.nim} • {detailData.student.email}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <RefreshButton
                        onClick={() => refetch()}
                        isRefreshing={isFetching && !isLoading}
                    />
                    <Badge variant="outline" className="text-sm px-3 py-1 h-9">
                        {formatRoleName(detailData.status)}
                    </Badge>
                </div>
            </div>

            {/* Approval Proposal Banner */}
            {/* {isProposed && (
                <Alert className="border-blue-200 bg-blue-50">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div className="ml-2 w-full">
                        <AlertTitle className="text-blue-800">Proposal Tugas Akhir Baru</AlertTitle>
                        <AlertDescription className="text-blue-700 mt-1">
                            Mahasiswa ini mengajukan judul proposal baru. Silakan review dan setujui untuk mengaktifkan status Tugas Akhir.
                        </AlertDescription>
                        <div className="mt-3 flex gap-3">
                            <Button
                                size="sm"
                                onClick={() => approveProposalMutation.mutate()}
                                disabled={approveProposalMutation.isPending}
                            >
                                {approveProposalMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Setujui Proposal
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </Alert>
            )} */}

            {/* Cancelled/Failed Banner */}
            {isCancelled && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-800">Tugas Akhir Berakhir</AlertTitle>
                    <AlertDescription className="text-red-700">
                        Tugas akhir ini telah berstatus <strong>{toTitleCaseName(detailData?.status || "")}</strong>.
                        Anda hanya dapat melihat riwayat dan tidak dapat melakukan perubahan data.
                    </AlertDescription>
                </Alert>
            )}

            {/* Alert Banner ketika milestone 100% */}
            {progressPercentage === 100 && (
                <Alert className={cn(
                    "border-green-200 bg-green-50",
                    readinessStatus?.guidanceProgress?.isComplete ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"
                )}>
                    {readinessStatus?.guidanceProgress?.isComplete ? (
                        <PartyPopper className="h-5 w-5 text-green-600" />
                    ) : (
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <AlertTitle className={readinessStatus?.guidanceProgress?.isComplete ? "text-green-800" : "text-yellow-800"}>
                        {readinessStatus?.guidanceProgress?.isComplete ? "Milestone Selesai 100%!" : "Milestone Selesai, Menunggu Bimbingan"}
                    </AlertTitle>
                    <AlertDescription className={readinessStatus?.guidanceProgress?.isComplete ? "text-green-700" : "text-yellow-700"}>
                        {readinessStatus?.guidanceProgress?.isComplete
                            ? "Mahasiswa ini telah menyelesaikan keseluruhan milestone dan syarat bimbingan. Silakan review kembali progress dan berikan approval agar mahasiswa dapat mendaftar seminar."
                            : "Mahasiswa telah menyelesaikan milestone, namun syarat minimal 8 sesi bimbingan belum terpenuhi. Approval seminar dapat diberikan setelah syarat bimbingan tercapai."}
                    </AlertDescription>
                </Alert>
            )}

            {/* Change Request Review Card - tampilkan jika ada pending request */}
            {thesisId && (
                <ChangeRequestReviewCard
                    thesisId={thesisId}
                    studentName={detailData.student.fullName}
                />
            )}

            {/* Seminar Readiness Card - tampilkan bagi mahasiswa aktif untuk monitoring */}
            {(detailData.status === "Bimbingan" || detailData.status === "Acc Seminar") && thesisId && (
                <SeminarReadinessCard
                    thesisId={thesisId}
                    studentName={detailData.student.fullName}
                    thesisTitle={detailData.title}
                />
            )}

            {/* Defence Readiness Card - tampilkan berdasarkan status thesis */}
            {thesisId && (
                <DefenceReadinessCard
                    thesisId={thesisId}
                    studentName={detailData.student.fullName}
                    thesisTitle={detailData.title}
                />
            )}

            {/* Thesis Info & Documents */}
            <Card className="w-full border-primary/20 bg-linear-to-br from-primary/5 via-background to-background">
                <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Informasi Tugas Akhir</CardTitle>
                                <CardDescription>Detail status pengerjaan tugas akhir mahasiswa</CardDescription>
                            </div>
                        </div>
                        {detailData.status && (
                            <Badge
                                variant={detailData.status === "Bimbingan" ? "default" : "secondary"}
                            >
                                {detailData.status.toUpperCase()}
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        {/* Judul & Detail Utama */}
                        <div>
                            <h3 className="text-lg font-semibold leading-relaxed mb-3">
                                {detailData.title || <span className="text-muted-foreground italic">Judul belum ditentukan</span>}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {/* Tanggal Mulai */}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>Mulai: <span className="text-foreground font-medium">{detailData.startDate ? formatDateId(detailData.startDate) : '-'}</span></span>
                                </div>
                                {/* Sisa Waktu */}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    <span>Sisa Waktu: <span className="text-foreground font-medium">
                                        {detailData.deadlineDate ? (() => {
                                            const days = Math.ceil((new Date(detailData.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                            if (days < 0) return `Terlewat ${Math.abs(days)} Hari`;
                                            if (days < 30) return `${days} Hari`;
                                            const months = Math.floor(days / 30);
                                            const rem = days % 30;
                                            return rem > 0 ? `${months} Bulan ${rem} Hari` : `${months} Bulan`;
                                        })() : '-'}
                                    </span></span>
                                    {detailData.deadlineDate && (() => {
                                        const days = Math.ceil((new Date(detailData.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                        if (days < 0) return (
                                            <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-normal">
                                                Expired
                                            </Badge>
                                        );
                                        if (days <= 30) return (
                                            <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal text-orange-600 bg-orange-50 border-orange-200">
                                                Segera
                                            </Badge>
                                        );
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </div>


                        <Separator />

                        {/* Documents Section */}
                        <div className="pt-2">
                            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4" /> Dokumen
                            </span>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Proposal Document */}
                                <div className="p-3 rounded-xl bg-background/50 border hover:bg-background/80 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-600">
                                            Proposal
                                        </Badge>
                                    </div>
                                    {detailData.proposalDocument ? (
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-blue-500 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{detailData.proposalDocument.fileName}</p>
                                                <p className="text-xs text-muted-foreground">Dokumen Proposal</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                                <a href={getDocumentUrl(detailData.proposalDocument.url)} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Belum ada dokumen proposal</p>
                                    )}
                                </div>

                                {/* Thesis Draft Document */}
                                <div className="p-3 rounded-xl bg-background/50 border hover:bg-background/80 transition-colors">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-600">
                                            Draft Laporan Tugas Akhir
                                        </Badge>
                                    </div>
                                    {detailData.document ? (
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-8 w-8 text-green-500 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">{detailData.document.fileName}</p>
                                                <p className="text-xs text-muted-foreground">Draft Akhir</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="shrink-0" asChild>
                                                <a href={getDocumentUrl(detailData.document.url)} target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Belum ada draft laporan tugas akhir</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File Version History */}
                        {detailData.uploadedFiles && detailData.uploadedFiles.length > 0 && (
                            <div className="pt-2">
                                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-3">
                                    <Clock className="h-4 w-4" /> Riwayat File Upload ({detailData.uploadedFiles.length})
                                </span>
                                <div className="max-h-48 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent space-y-2">
                                    {detailData.uploadedFiles.map((file, idx) => {
                                        const fileUrl = getDocumentUrl(
                                            file.filePath.startsWith('uploads/') || file.filePath.startsWith('/uploads/') ||
                                                file.filePath.startsWith('uploads\\') || file.filePath.startsWith('\\uploads\\')
                                                ? (file.filePath.startsWith('/') || file.filePath.startsWith('\\') ? file.filePath : `/${file.filePath}`)
                                                : `/uploads/${file.filePath}`
                                        );
                                        return (
                                            <div key={file.id} className="flex items-center gap-3 p-2 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors">
                                                <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{file.fileName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {file.guidanceDate ? formatDateId(file.guidanceDate) : formatDateId(file.uploadedAt)}
                                                    </p>
                                                </div>
                                                {idx === 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal bg-green-50 border-green-200 text-green-600 shrink-0">
                                                        Terbaru
                                                    </Badge>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" asChild>
                                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                        <Download className="h-3.5 w-3.5" />
                                                    </a>
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {/* Supervisor Metopen Score Card */}
            {/* {thesisId && (
                <SupervisorScoreCard thesisId={thesisId} scoreData={detailData.researchMethodScore} />
            )} */}

            {/* Guidance History & Milestone side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {detailData.guidanceHistory && (
                    <GuidanceHistorySection guidanceHistory={detailData.guidanceHistory} />
                )}

                {/* Milestones */}
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Riwayat Milestone</CardTitle>
                        {isPembimbing1 && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCreateMilestoneOpen(true)}
                                disabled={isCancelled}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <div className="h-150 overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            <div className="relative border-l ml-3 space-y-8 my-2 pt-2">
                                {detailData.milestones && detailData.milestones.length > 0 ? (
                                    detailData.milestones.map((milestone) => (
                                        <div key={milestone.id} className="ml-6 relative group pb-2">
                                            {validatingId === milestone.id && (
                                                <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm rounded transition-all">
                                                    <Spinner className="h-6 w-6 text-primary" />
                                                </div>
                                            )}
                                            <span className={cn(
                                                "absolute -left-9.25 top-1 p-1 rounded-full border bg-background z-10",
                                                milestone.status === 'completed' ? "border-green-500 text-green-500" : "border-border text-muted-foreground"
                                            )}>
                                                {getStatusIcon(milestone.status)}
                                            </span>
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h4 className="font-medium text-sm leading-snug mt-0.5">{milestone.title}</h4>
                                                    {milestone.status !== 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={cn(
                                                                "h-6 w-6 transition-opacity",
                                                                (!isPembimbing1 || (milestone.progressPercentage < 100 && milestone.status !== 'pending_review')) ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-primary/10 text-primary"
                                                            )}
                                                            title={
                                                                isCancelled
                                                                    ? "Tidak dapat memproses karena tugas akhir dibatalkan"
                                                                    : !isPembimbing1
                                                                        ? "Hanya Pembimbing 1 yang dapat melakukan review"
                                                                        : (milestone.progressPercentage < 100 && milestone.status !== 'pending_review')
                                                                            ? "Milestone belum mencapai 100%"
                                                                            : "Review Milestone"
                                                            }
                                                            disabled={!isPembimbing1 || (milestone.progressPercentage < 100 && milestone.status !== 'pending_review') || isCancelled}
                                                            onClick={() => setSelectedMilestoneId(milestone.id)}
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground">
                                                        <span>Proses</span>
                                                        <span>{milestone.progressPercentage || 0}%</span>
                                                    </div>
                                                    <Progress value={milestone.progressPercentage || 0} className="h-1.5" />
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                                                    <Badge variant={STATUS_VARIANTS[milestone.status] || "outline"} className="text-[10px] h-5 px-1.5 font-normal">
                                                        {STATUS_LABELS[milestone.status] || milestone.status.replace(/_/g, " ")}
                                                    </Badge>
                                                    {milestone.progressPercentage === 100 && milestone.status === 'in_progress' && (
                                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1 animate-pulse text-red-600 border-red-600 bg-transparent">
                                                            <Bell className="h-3 w-3" />
                                                            Perlu Approval
                                                        </Badge>
                                                    )}
                                                    {milestone.updatedAt && (
                                                        <span className="text-xs text-muted-foreground/70">
                                                            {formatDateId(milestone.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="-ml-3">
                                        <EmptyState
                                            size="sm"
                                            title="Belum Ada Milestone"
                                            description="Belum ada milestone yang tercatat"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedMilestoneId} onOpenChange={(open) => {
                if (!open) {
                    setSelectedMilestoneId(null);
                    setReviewNotes("");
                }
            }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review Milestone</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="review-notes">Catatan Feedback</Label>
                            <Textarea
                                id="review-notes"
                                placeholder="Tulis catatan feedback atau instruksi revisi..."
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                rows={4}
                            />
                            <p className="text-[10px] text-muted-foreground">Catatan wajib diisi jika meminta revisi.</p>
                        </div>
                    </div>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="destructive"
                            className="w-full sm:w-auto"
                            onClick={handleRequestRevision}
                            disabled={requestRevisionMutation.isPending || validateMutation.isPending}
                        >
                            {requestRevisionMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Minta Revisi
                        </Button>
                        <Button
                            variant="default"
                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                            onClick={handleValidate}
                            disabled={requestRevisionMutation.isPending || validateMutation.isPending}
                        >
                            {validateMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Setujui
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create Milestone Dialog */}
            <Dialog
                open={createMilestoneOpen}
                onOpenChange={(open) => {
                    setCreateMilestoneOpen(open);
                    if (!open) resetMilestoneForm();
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Tambah Milestone untuk Mahasiswa</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateMilestone();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="milestone-title">
                                Judul Milestone <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="milestone-title"
                                value={milestoneTitle}
                                onChange={(e) => setMilestoneTitle(e.target.value)}
                                placeholder="Contoh: Revisi Bab 4"
                                disabled={createMilestoneMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="milestone-description">Deskripsi</Label>
                            <Textarea
                                id="milestone-description"
                                value={milestoneDescription}
                                onChange={(e) => setMilestoneDescription(e.target.value)}
                                placeholder="Deskripsi detail milestone..."
                                rows={3}
                                disabled={createMilestoneMutation.isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Target Tanggal</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !milestoneTargetDate && "text-muted-foreground"
                                        )}
                                        disabled={createMilestoneMutation.isPending}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {milestoneTargetDate
                                            ? format(milestoneTargetDate, "PPP", { locale: localeId })
                                            : "Pilih tanggal target"
                                        }
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <CalendarComponent
                                        mode="single"
                                        selected={milestoneTargetDate}
                                        onSelect={setMilestoneTargetDate}
                                        initialFocus
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="milestone-notes">Catatan untuk Mahasiswa</Label>
                            <Textarea
                                id="milestone-notes"
                                value={milestoneSupervisorNotes}
                                onChange={(e) => setMilestoneSupervisorNotes(e.target.value)}
                                placeholder="Instruksi atau catatan untuk mahasiswa..."
                                rows={3}
                                disabled={createMilestoneMutation.isPending}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateMilestoneOpen(false)}
                                disabled={createMilestoneMutation.isPending}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMilestoneMutation.isPending || !milestoneTitle.trim()}
                            >
                                {createMilestoneMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    "Simpan Milestone"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
