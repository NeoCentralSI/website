import { useEffect, useMemo } from "react";
import { useOutletContext, useParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { getStudentDetail } from "@/services/lecturerGuidance.service";
import { useQuery } from "@tanstack/react-query";
import { toTitleCaseName, formatRoleName, formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmptyState from "@/components/ui/empty-state";
import {
    FileText,
    Clock,
    AlertTriangle,
    Download,
    ArrowLeft,
    BookOpen,
    Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { GuidanceHistorySection } from "@/components/tugas-akhir/lecturer/GuidanceHistorySection";
import { ProposalVersionHistory } from "@/components/thesis/ProposalVersionHistory";
import { RefreshButton } from "@/components/ui/refresh-button";
import { SupervisorScoreCard } from "@/components/metopen/SupervisorScoreCard";

export default function LecturerMyStudentDetailPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { thesisId } = useParams<{ thesisId: string }>();

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

    const isCancelled = useMemo(() => {
        if (!detailData?.status) return false;
        const status = detailData.status.toLowerCase();
        return status === "dibatalkan" || status === "gagal" || status === "cancelled";
    }, [detailData?.status]);

    const isProposed = useMemo(() => {
        return detailData?.status === "Diajukan";
    }, [detailData?.status]);

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
                        <h1 className="text-base font-semibold tracking-tight sm:text-lg">{toTitleCaseName(detailData.student.fullName)}</h1>
                        <p className="text-xs text-muted-foreground sm:text-sm">
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
            {isProposed && (
                <Alert className="border-blue-200 bg-blue-50">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div className="ml-2 w-full">
                        <AlertTitle className="text-blue-800">Proposal Tugas Akhir Diajukan</AlertTitle>
                        <AlertDescription className="text-blue-700 mt-1">
                            Pembimbing dapat melanjutkan review melalui bimbingan dan penilaian TA-03. Aktivasi resmi proposal diputuskan pada TA-04 oleh KaDep.
                        </AlertDescription>
                    </div>
                </Alert>
            )}

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

                            {/* Proposal Version History */}
                            {thesisId && (
                                <div className="mb-4">
                                    <ProposalVersionHistory thesisId={thesisId} compact readOnly />
                                </div>
                            )}

                            {/* Thesis Draft Document */}
                            <div className="p-3 rounded-xl bg-background/50 border hover:bg-background/80 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-600">
                                        Draft Skripsi
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
                                            <a href={getDocumentUrl(detailData.document.url ?? "")} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">Belum ada draft skripsi</p>
                                )}
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
                                            file.filePath
                                                ? (file.filePath.startsWith('uploads/') || file.filePath.startsWith('/uploads/')
                                                    ? (file.filePath.startsWith('/') ? file.filePath : `/${file.filePath}`)
                                                    : `/uploads/${file.filePath}`)
                                                : file.url || ""
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

            {/* P2-11 (audit Sprint 3): ProposalVersionHistory di-render
                ringkas (compact) di section Dokumen di atas. Render full duplikat
                di sini dihapus untuk menghindari pengulangan UI. */}

            {/* Supervisor Metopen Score Card */}
            {thesisId && (
                <SupervisorScoreCard thesisId={thesisId} scoreData={detailData.researchMethodScore} />
            )}

            {detailData.guidanceHistory && (
                <GuidanceHistorySection guidanceHistory={detailData.guidanceHistory} />
            )}
        </div>
    );
}
