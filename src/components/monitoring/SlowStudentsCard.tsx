import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronRight, Mail, Copy, Bell, CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toTitleCaseName } from "@/lib/text";
import { sendBatchWarnings, type AtRiskStudent } from "@/services/monitoring.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SlowStudentsCardProps {
    slowStudents: AtRiskStudent[] | undefined;
    atRiskStudents: AtRiskStudent[] | undefined;
    isLoading: boolean;
    showViewAll?: boolean;
}

export function SlowStudentsCard({ slowStudents, atRiskStudents, isLoading, showViewAll = true }: SlowStudentsCardProps) {
    const navigate = useNavigate();
    const [sending, setSending] = React.useState(false);

    // Combine and prioritize at-risk
    const allStudents = React.useMemo(() => {
        const slow = slowStudents || [];
        const atRisk = atRiskStudents || [];

        // Combine, ensuring unique thesisIds (though they should be distinct categories)
        const combined = [...atRisk.map(s => ({ ...s, isAtRisk: true })), ...slow.map(s => ({ ...s, isAtRisk: false }))];

        // Distinct by thesisId just in case
        const unique = combined.filter((v, i, a) => a.findIndex(t => t.thesisId === v.thesisId) === i);

        // Sort: At Risk first, then by days since activity
        return unique.sort((a, b) => {
            if (a.isAtRisk && !b.isAtRisk) return -1;
            if (!a.isAtRisk && b.isAtRisk) return 1;
            return b.daysSinceActivity - a.daysSinceActivity;
        });
    }, [slowStudents, atRiskStudents]);

    const handleCopyEmail = (email: string) => {
        navigator.clipboard.writeText(email);
        toast.success("Email disalin ke clipboard");
    };

    const handleBatchWarning = async () => {
        if (allStudents.length === 0) return;

        setSending(true);
        try {
            const thesisIds = allStudents.map(s => s.thesisId);
            // Send as AT_RISK if there's any at-risk, or just generic SLOW for batch?
            // User requested "batch peringatan ke semua daftar mahasiswa"
            // We'll use SLOW as the baseline or handle based on the mix
            await sendBatchWarnings(thesisIds, 'SLOW');
            toast.success(`Berhasil mengirim peringatan ke ${thesisIds.length} mahasiswa`);
        } catch (error: any) {
            toast.error(error.message || "Gagal mengirim peringatan batch");
        } finally {
            setSending(false);
        }
    };

    if (isLoading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-6 w-48" />
                    </CardTitle>
                    <Skeleton className="h-4 w-64 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="p-4 border rounded-xl space-y-3">
                            <div className="flex justify-between">
                                <Skeleton className="h-5 w-40" />
                                <Skeleton className="h-6 w-20" />
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <div className="flex gap-2">
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    const displayStudents = allStudents;

    return (
        <Card className="flex flex-col h-full overflow-hidden">
            <CardHeader className="pb-4 border-b bg-slate-50/30">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
                            <AlertTriangle className="h-5 w-5 text-orange-500 animate-pulse" />
                            Progress Lambat & Berisiko
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            Daftar mahasiswa yang memerlukan perhatian segera
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {displayStudents.length > 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="h-9 w-9 p-0 rounded-full shadow-sm hover:shadow-md transition-all"
                                            onClick={handleBatchWarning}
                                            disabled={sending}
                                        >
                                            <Bell className={cn("h-4 w-4", sending && "animate-bounce")} />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Kirim Peringatan ke Semua</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        {showViewAll && allStudents.length > 5 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 rounded-full bg-white"
                                onClick={() => navigate("/monitoring/slow")}
                            >
                                Lihat Semua
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                {displayStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                        <div className="bg-green-50 p-4 rounded-full mb-4">
                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                        </div>
                        <p className="font-semibold text-slate-800">Semua Terkendali!</p>
                        <p className="text-sm text-slate-500 mt-1">Tidak ada mahasiswa dengan progress lambat saat ini.</p>
                    </div>
                ) : (
                    <div className="h-[400px] overflow-y-auto px-4 py-4 custom-scrollbar bg-slate-50/20">
                        <div className="space-y-3">
                            {displayStudents.map((student) => {
                                const isAtRisk = student.isAtRisk;
                                return (
                                    <div
                                        key={student.thesisId}
                                        className={cn(
                                            "group relative flex flex-col p-4 rounded-xl border transition-all duration-200",
                                            isAtRisk
                                                ? "bg-rose-50/50 border-rose-200 hover:border-rose-300 shadow-sm shadow-rose-100/50"
                                                : "bg-white border-slate-200 hover:border-amber-300 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-slate-800 truncate text-base">
                                                        {toTitleCaseName(student.student.name)}
                                                    </p>
                                                    {isAtRisk && (
                                                        <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold">
                                                            At Risk
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 tracking-tight">
                                                    {student.student.nim}
                                                </p>

                                                <div className="flex items-center gap-2 mt-2">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200/50 group/copy">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                        <span className="font-medium truncate max-w-[200px]">{student.student.email}</span>
                                                        <button
                                                            className="ml-1 p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-primary transition-all"
                                                            onClick={() => handleCopyEmail(student.student.email)}
                                                            title="Salin Email"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                        <a
                                                            href={`mailto:${student.student.email}?subject=Peringatan Progres Tugas Akhir&body=Halo ${toTitleCaseName(student.student.name)},%0D%0A%0D%0AAnda sudah tidak ada update progress tugas akhir selama ${student.daysSinceActivity} hari. Segera lakukan bimbingan dengan dosen pembimbing Anda sebelum deadline tugas akhir Anda berakhir.`}
                                                            className="p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-primary transition-all flex items-center justify-center"
                                                            title="Kirim Email"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Badge
                                                            variant="secondary"
                                                            className={cn(
                                                                "h-9 px-3 rounded-full font-bold border transition-colors shadow-sm",
                                                                isAtRisk
                                                                    ? "bg-rose-100 text-rose-700 border-rose-200"
                                                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                                            )}
                                                        >
                                                            {student.daysSinceActivity} hari lalu
                                                        </Badge>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="left">
                                                        <p className="text-xs font-semibold">
                                                            {isAtRisk ? "Tidak bimbingan sejak" : "Terakhir bimbingan"}
                                                        </p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
