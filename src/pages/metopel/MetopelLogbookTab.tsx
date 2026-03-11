import { useQuery } from "@tanstack/react-query";
import {
    getCompletedGuidanceHistory,
    getStudentGuidanceHistory,
    type CompletedGuidance,
    type GuidanceItem,
} from "@/services/studentGuidance.service";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/spinner";
import { BookOpen, Calendar, Clock, User, FileText, CheckCircle2, AlertCircle, Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: typeof CheckCircle2; className: string }> = {
    completed: { label: "Selesai", variant: "default", icon: CheckCircle2, className: "bg-green-600 border-green-600" },
    accepted: { label: "Disetujui", variant: "secondary", icon: CheckCircle2, className: "" },
    summary_pending: { label: "Menunggu Ringkasan", variant: "outline", icon: Hourglass, className: "" },
    requested: { label: "Diajukan", variant: "outline", icon: Hourglass, className: "" },
    rejected: { label: "Ditolak", variant: "destructive", icon: AlertCircle, className: "" },
    cancelled: { label: "Dibatalkan", variant: "destructive", icon: AlertCircle, className: "" },
};

function formatDate(iso?: string | null): string {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function MetopelLogbookTab() {
    const { data: completedData, isLoading: isCompletedLoading } = useQuery({
        queryKey: ["metopel-completed-guidances"],
        queryFn: getCompletedGuidanceHistory,
    });

    const { data: historyData, isLoading: isHistoryLoading } = useQuery({
        queryKey: ["metopel-guidance-history"],
        queryFn: getStudentGuidanceHistory,
    });

    const isLoading = isCompletedLoading || isHistoryLoading;

    if (isLoading) {
        return (
            <Card className="min-h-[300px] flex items-center justify-center border-dashed">
                <Loading size="lg" text="Memuat riwayat bimbingan..." />
            </Card>
        );
    }

    const completedGuidances: CompletedGuidance[] = completedData?.guidances || [];
    // GuidanceListResponse uses 'items', not 'guidances'
    const allGuidances: GuidanceItem[] = historyData?.items || [];

    const pendingGuidances = allGuidances.filter(
        (g) => g.status === "requested" || g.status === "accepted" || g.status === "summary_pending"
    );

    const totalCompleted = completedGuidances.length;
    const totalSessions = allGuidances.length;
    const totalPending = pendingGuidances.length;

    return (
        <div className="space-y-5">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-950/40 flex items-center justify-center text-green-600 shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-green-700 dark:text-green-500">{totalCompleted}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Sesi Selesai</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn(totalPending > 0 && "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            totalPending > 0 ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                        )}>
                            <Hourglass className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{totalPending}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Dalam Proses</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{totalSessions}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Total Sesi</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pending sessions */}
            {pendingGuidances.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                        Bimbingan Dalam Proses
                    </p>
                    {pendingGuidances.map((g) => {
                        const cfg = STATUS_CONFIG[g.status] || STATUS_CONFIG.requested;
                        const Icon = cfg.icon;
                        return (
                            <Card key={g.id} className="border-dashed">
                                <CardContent className="p-4 flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                                        <Icon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-sm">{g.supervisorName || "Dosen Pembimbing"}</span>
                                            <Badge variant={cfg.variant} className={cn("text-xs", cfg.className)}>{cfg.label}</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(g.requestedDate)}
                                            </span>
                                            {g.duration && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {g.duration} menit
                                                </span>
                                            )}
                                        </div>
                                        {g.milestoneTitles && g.milestoneTitles.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1.5">
                                                <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <span className="text-xs text-muted-foreground">
                                                    Terkait: {g.milestoneTitles.join(", ")}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Completed sessions */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Riwayat Bimbingan Selesai
                </p>
                {completedGuidances.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-6 h-6 text-muted-foreground/40" />
                            </div>
                            <p className="text-muted-foreground font-medium text-sm">Belum ada sesi bimbingan selesai</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sesi bimbingan yang sudah selesai akan muncul di sini.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {completedGuidances.map((g, idx) => (
                            <Card key={g.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="flex">
                                        <div className="w-1 bg-green-500 shrink-0" />
                                        <div className="p-4 flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center text-green-700 shrink-0">
                                                        <span className="text-xs font-bold">{completedGuidances.length - idx}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                            <span className="font-semibold text-sm truncate">{g.supervisorName || "Dosen"}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3 shrink-0" />
                                                                {formatDate(g.approvedDate || g.completedAt)}
                                                            </span>
                                                            {g.duration && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3 shrink-0" />
                                                                    {g.duration} mnt
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Badge className="bg-green-600 text-xs shrink-0">Selesai</Badge>
                                            </div>

                                            {g.milestoneName && (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="text-xs font-medium text-primary">Tugas: {g.milestoneName}</span>
                                                </div>
                                            )}

                                            {g.sessionSummary && (
                                                <div className="mt-2.5 p-2.5 bg-muted/40 rounded-md border">
                                                    <p className="text-xs font-semibold text-muted-foreground mb-1">Ringkasan Sesi</p>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{g.sessionSummary}</p>
                                                </div>
                                            )}

                                            {g.actionItems && (
                                                <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
                                                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Tindak Lanjut</p>
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{g.actionItems}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
