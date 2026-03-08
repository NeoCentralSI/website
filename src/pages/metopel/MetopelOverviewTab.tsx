import { useQuery } from "@tanstack/react-query";
import { metopenService } from "@/services/metopen.service";
import { useAdvisorAccessState } from "@/hooks/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import {
    UserPlus, CheckCircle2, Clock, AlertTriangle,
    ChevronRight, BookOpen, Target, TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
    not_started: { label: "Belum Dimulai", color: "text-muted-foreground" },
    in_progress: { label: "Dikerjakan", color: "text-blue-600" },
    pending_review: { label: "Menunggu Review", color: "text-amber-600" },
    revision_needed: { label: "Perlu Revisi", color: "text-red-600" },
    completed: { label: "Selesai", color: "text-green-600" },
};

export function MetopelOverviewTab() {
    const { data: tasksData, isLoading: isTasksLoading } = useQuery({
        queryKey: ["metopen-my-tasks"],
        queryFn: () => metopenService.getMyTasks(),
    });

    const { data: advisorAccess, isLoading: isAdvisorAccessLoading } = useAdvisorAccessState();

    if (isTasksLoading || isAdvisorAccessLoading) {
        return (
            <Card className="min-h-[300px] flex items-center justify-center border-dashed">
                <Loading size="lg" text="Memuat ringkasan..." />
            </Card>
        );
    }

    const tasks = tasksData?.tasks || [];
    const gateOpen = advisorAccess?.gateOpen || false;
    const completedCount = tasks.filter((t: any) => t.status === "completed").length;
    const pendingReviewCount = tasks.filter((t: any) => t.status === "pending_review").length;
    const inProgressCount = tasks.filter((t: any) => ["in_progress", "revision_needed", "not_started"].includes(t.status)).length;
    const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

    const supervisors = advisorAccess?.supervisors || [];
    const hasSupervisors = advisorAccess?.hasOfficialSupervisor || false;
    const blockingRequest = advisorAccess?.blockingRequest;

    // Find the next actionable task
    const nextTask = tasks.find((t: any) =>
        ["in_progress", "revision_needed", "not_started"].includes(t.status)
    );

    const overdueCount = tasks.filter((t: any) => {
        const canSubmit = ["in_progress", "revision_needed", "not_started"].includes(t.status);
        return t.targetDate && new Date(t.targetDate) < new Date() && canSubmit;
    }).length;

    return (
        <div className="space-y-4">
            {/* Hero Card */}
            <Card className="bg-linear-to-br from-primary/5 via-transparent to-transparent border-primary/20 overflow-hidden relative">
                <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                <CardContent className="p-5 md:p-6 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary shrink-0" />
                                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Metodologi Penelitian</h2>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                                Pantau milestone tugas, ajukan pembimbing, dan catat progres bimbingan.
                            </p>
                        </div>

                        {/* Progress ring */}
                        <div className="flex items-center gap-4 bg-background/80 backdrop-blur-sm px-4 py-3 rounded-xl border shadow-sm shrink-0 self-start sm:self-auto">
                            <div className="w-14 h-14 relative flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                        className="text-muted/30"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="3.5"
                                    />
                                    <path
                                        className="text-primary transition-all duration-1000 ease-out"
                                        strokeDasharray={`${progressPct}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"
                                    />
                                </svg>
                                <span className="absolute text-[13px] font-black">{progressPct}%</span>
                            </div>
                            <div className="text-left">
                                <p className="text-2xl font-black leading-none">
                                    {completedCount}
                                    <span className="text-base font-semibold text-muted-foreground ml-1">/ {tasks.length}</span>
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">tugas selesai</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className={cn("border", overdueCount > 0 && "border-red-200 bg-red-50/30")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            overdueCount > 0 ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
                        )}>
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                            <p className={cn("text-xl font-bold", overdueCount > 0 ? "text-red-600" : "text-foreground")}>{overdueCount}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Terlambat</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={cn("border", pendingReviewCount > 0 && "border-amber-200 bg-amber-50/30")}>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{pendingReviewCount}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Menunggu Review</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{inProgressCount}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Perlu Dikerjakan</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/20">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-xl font-bold text-green-700">{completedCount}</p>
                            <p className="text-xs text-muted-foreground leading-tight">Selesai</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Next Task + Supervisor Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Next Task */}
                <Card className="border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Tugas Selanjutnya</h3>
                        </div>
                        {tasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada tugas dari dosen pengampu.</p>
                        ) : nextTask ? (
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold mt-0.5",
                                        nextTask.status === "revision_needed"
                                            ? "bg-red-100 text-red-700"
                                            : nextTask.status === "in_progress"
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        {nextTask.orderIndex ?? 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm leading-snug">{nextTask.title}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={cn("text-xs font-medium", STATUS_DISPLAY[nextTask.status]?.color)}>
                                                {STATUS_DISPLAY[nextTask.status]?.label}
                                            </span>
                                            {nextTask.targetDate && (
                                                <span className="text-xs text-muted-foreground">
                                                    · Deadline {format(new Date(nextTask.targetDate), "d MMM", { locale: localeId })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
                                    <Link to="/metopel/tugas">
                                        Lihat semua tugas <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                <p className="text-sm text-green-700 font-medium">Semua tugas telah diselesaikan!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Supervisor Status */}
                <Card className="border shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <UserPlus className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Status Pembimbing</h3>
                        </div>
                        {hasSupervisors ? (
                            <div className="space-y-2">
                                {supervisors.map((sp) => (
                                    <div key={sp.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-muted/20">
                                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="text-xs font-bold text-primary">
                                                {sp.name?.charAt(0) || "D"}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{sp.name}</p>
                                            <p className="text-xs text-muted-foreground">{sp.role || "Pembimbing"}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[10px] shrink-0 bg-green-50 text-green-700 border-green-200">Aktif</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : blockingRequest ? (
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200">
                                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-amber-700">
                                        {blockingRequest.status === "pending" && "Pengajuan pembimbing Anda sedang menunggu respon dosen."}
                                        {blockingRequest.status === "escalated" && "Pengajuan pembimbing Anda sedang menunggu keputusan Ketua Departemen."}
                                        {["approved", "override_approved", "redirected"].includes(blockingRequest.status) &&
                                            "Pengajuan pembimbing Anda sudah disetujui dan sedang menunggu penetapan pembimbing."}
                                        {blockingRequest.status === "assigned" &&
                                            "Penetapan pembimbing sedang disinkronkan. Silakan cek kembali sebentar lagi."}
                                    </p>
                                </div>
                                {["pending", "escalated"].includes(blockingRequest.status) && (
                                    <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
                                        <Link to="/metopel/cari-pembimbing">
                                            Lihat Status Pengajuan <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        ) : gateOpen && advisorAccess?.canBrowseCatalog ? (
                            <div className="space-y-2">
                                <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-700">Syarat pencarian pembimbing terpenuhi. Silakan ajukan sekarang.</p>
                                </div>
                                <Button variant="outline" size="sm" className="w-full gap-1 text-xs" asChild>
                                    <Link to="/metopel/cari-pembimbing">
                                        Cari Pembimbing <ChevronRight className="w-3.5 h-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {advisorAccess?.reason || "Selesaikan tugas milestone yang diperlukan untuk dapat mengajukan dosen pembimbing."}
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
