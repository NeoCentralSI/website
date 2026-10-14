import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyState from "@/components/ui/empty-state";
import AuthenticatedDocumentPreviewDialog from "@/components/thesis/AuthenticatedDocumentPreviewDialog";
import StatusBadge from "@/components/thesis/StatusBadge";
import { ThesisPhaseBadge } from "@/components/shared/ThesisPhaseBadge";
import { openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import { formatDateTimeWib } from "@/lib/text";
import { History, ChevronDown, ChevronUp, FileText, MessageSquare, XCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuidanceItem } from "@/services/lecturerGuidance.service";

const DOCUMENT_CHIP_CLASS =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs text-blue-600 transition-colors hover:text-blue-800";

/**
 * `documentUrl` is a link the student typed (Google Docs, Overleaf, ...). Only such an
 * outside address may be a plain link: a path into /uploads needs the Authorization
 * header, which a link cannot send.
 */
function isOutsideLink(url: string): boolean {
    return /^https?:\/\//i.test(url) && !url.includes("/uploads/");
}

interface GuidanceHistorySectionProps {
    guidanceHistory: {
        count: number;
        items: GuidanceItem[];
    };
}

export function GuidanceHistorySection({ guidanceHistory }: GuidanceHistorySectionProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [preview, setPreview] = useState<{ fileName: string; filePath: string } | null>(null);

    const completedCount = useMemo(() =>
        guidanceHistory.items.filter(g => g.status === "completed").length,
        [guidanceHistory.items]
    );

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
                            const isExpanded = expandedId === g.id;
                            const externalLink = g.documentUrl && g.documentUrl !== "null" ? g.documentUrl : null;

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
                                        aria-expanded={isExpanded}
                                        onClick={() => setExpandedId(isExpanded ? null : g.id)}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-medium truncate">
                                                    {g.milestoneTitles && g.milestoneTitles.length > 0
                                                        ? g.milestoneTitles.join(", ")
                                                        : g.milestoneName || "Bimbingan"}
                                                </p>
                                                {g.phase && <ThesisPhaseBadge phase={g.phase} className="text-[10px]" />}
                                                {g.duration && (
                                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                                        {g.duration} menit
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDateTimeWib(g.approvedDate ?? g.requestedDate ?? g.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <StatusBadge status={g.status} />
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
                                                {g.document?.filePath && (
                                                    // A protected upload: fetched with the Authorization header, never linked.
                                                    <button
                                                        type="button"
                                                        className={DOCUMENT_CHIP_CLASS}
                                                        title="Buka dokumen"
                                                        onClick={() => setPreview({ fileName: g.document!.fileName, filePath: g.document!.filePath })}
                                                    >
                                                        <FileText className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{g.document.fileName}</span>
                                                    </button>
                                                )}
                                                {externalLink && (isOutsideLink(externalLink) ? (
                                                    <a
                                                        href={externalLink}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={DOCUMENT_CHIP_CLASS}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                        Dokumen Eksternal
                                                    </a>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className={DOCUMENT_CHIP_CLASS}
                                                        onClick={() => void openAuthenticatedFileOrToast(externalLink)}
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                                        Dokumen Eksternal
                                                    </button>
                                                ))}
                                            </div>

                                            {/* No notes/feedback message */}
                                            {!g.studentNotes && !g.supervisorFeedback && !g.rejectionReason && !g.document?.filePath && !externalLink && (
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
            <AuthenticatedDocumentPreviewDialog
                open={preview !== null}
                onOpenChange={(open) => { if (!open) setPreview(null); }}
                fileName={preview?.fileName}
                filePath={preview?.filePath}
            />
        </Card>
    );
}
