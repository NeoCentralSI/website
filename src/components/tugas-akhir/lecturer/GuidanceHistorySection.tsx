import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import EmptyState from "@/components/ui/empty-state";
import { formatDateId } from "@/lib/text";
import { History, ChevronDown, ChevronUp, FileText, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";
import { getApiUrl } from "@/config/api";

const GUIDANCE_STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }> = {
    completed: { label: "Selesai", variant: "default", icon: CheckCircle2 },
    accepted: { label: "Diterima", variant: "secondary", icon: CheckCircle2 },
    summary_pending: { label: "Menunggu Ringkasan", variant: "secondary", icon: Clock },
    requested: { label: "Menunggu", variant: "outline", icon: Clock },
    rejected: { label: "Ditolak", variant: "destructive", icon: XCircle },
    cancelled: { label: "Dibatalkan", variant: "outline", icon: AlertCircle },
};

interface GuidanceHistorySectionProps {
    guidanceHistory: {
        count: number;
        items: GuidanceItem[];
    };
}

export function GuidanceHistorySection({ guidanceHistory }: GuidanceHistorySectionProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const completedCount = useMemo(() =>
        guidanceHistory.items.filter(g => g.status === "completed").length,
        [guidanceHistory.items]
    );

    const getDocumentUrl = (path: string): string => {
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return getApiUrl(path);
    };

    return (
        <Card className="h-full">
            <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Riwayat Bimbingan
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                        {completedCount}/{guidanceHistory.count} selesai
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                {guidanceHistory.items.length > 0 ? (
                    <div className="h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent space-y-2">
                        {guidanceHistory.items.map((g) => {
                            const statusInfo = GUIDANCE_STATUS_MAP[g.status] || { label: g.status, variant: "outline" as const, icon: Clock };
                            const StatusIcon = statusInfo.icon;
                            const isExpanded = expandedId === g.id;

                            return (
                                <div
                                    key={g.id}
                                    className={cn(
                                        "rounded-lg border transition-colors",
                                        isExpanded ? "bg-muted/30" : "bg-muted/50 hover:bg-muted/70"
                                    )}
                                >
                                    {/* Summary row */}
                                    <button
                                        type="button"
                                        className="flex items-center justify-between w-full p-3 text-left"
                                        onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <StatusIcon className={cn(
                                                "h-4 w-4 shrink-0",
                                                g.status === "completed" && "text-green-500",
                                                g.status === "accepted" && "text-blue-500",
                                                g.status === "rejected" && "text-red-500",
                                                g.status === "requested" && "text-yellow-500",
                                                g.status === "summary_pending" && "text-blue-400",
                                            )} />
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-sm font-medium truncate">
                                                        {g.milestoneTitles && g.milestoneTitles.length > 0
                                                            ? g.milestoneTitles.join(", ")
                                                            : g.milestoneName || "Bimbingan"}
                                                    </p>
                                                    {g.duration && (
                                                        <span className="text-[10px] text-muted-foreground shrink-0">
                                                            {g.duration} menit
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {g.approvedDateFormatted || g.requestedDateFormatted || (g.createdAt ? formatDateId(g.createdAt) : "-")}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <Badge variant={statusInfo.variant} className="text-[10px] h-5 px-1.5 font-normal">
                                                {statusInfo.label}
                                            </Badge>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="px-3 pb-3 pt-0 space-y-3 border-t mx-3">
                                            <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                {g.studentNotes && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            Catatan Mahasiswa
                                                        </p>
                                                        <p className="text-sm bg-background p-2 rounded border">
                                                            {g.studentNotes}
                                                        </p>
                                                    </div>
                                                )}

                                                {g.supervisorFeedback && (
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                                            <MessageSquare className="h-3 w-3" />
                                                            Feedback Dosen
                                                        </p>
                                                        <p className="text-sm bg-background p-2 rounded border">
                                                            {g.supervisorFeedback}
                                                        </p>
                                                    </div>
                                                )}

                                                {g.rejectionReason && (
                                                    <div className="space-y-1 sm:col-span-2">
                                                        <p className="text-xs font-medium text-red-600 flex items-center gap-1">
                                                            <XCircle className="h-3 w-3" />
                                                            Alasan Penolakan
                                                        </p>
                                                        <p className="text-sm bg-red-50 text-red-700 p-2 rounded border border-red-200">
                                                            {g.rejectionReason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Document & External URL */}
                                            <div className="flex flex-wrap gap-2">
                                                {g.document && (
                                                    <a
                                                        href={getDocumentUrl(g.document.filePath)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 transition-colors"
                                                    >
                                                        <FileText className="h-3.5 w-3.5" />
                                                        {g.document.fileName}
                                                    </a>
                                                )}
                                                {g.documentUrl && (
                                                    <a
                                                        href={getDocumentUrl(g.documentUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 transition-colors"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        Dokumen Eksternal
                                                    </a>
                                                )}
                                            </div>

                                            {/* No notes/feedback message */}
                                            {!g.studentNotes && !g.supervisorFeedback && !g.rejectionReason && !g.document && !g.documentUrl && (
                                                <p className="text-xs text-muted-foreground italic pt-2">
                                                    Tidak ada catatan atau dokumen pada sesi ini.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    </div>
                ) : (
                    <EmptyState
                        size="sm"
                        title="Belum Ada Bimbingan"
                        description="Belum ada riwayat sesi bimbingan"
                    />
                )}
            </CardContent>
        </Card>
    );
}
