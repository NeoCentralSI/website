import { useState } from "react";
import { Clock, Download, Eye, FileText } from "lucide-react";

import AuthenticatedDocumentPreviewDialog from "@/components/thesis/AuthenticatedDocumentPreviewDialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiUrl } from "@/config/api";
import { openAuthenticatedFileOrToast } from "@/lib/authenticatedFile";
import { formatDateTimeWib } from "@/lib/text";
import type { StudentDetail } from "@/services/lecturerGuidance.service";

// Backend paths already carry the /uploads/ prefix; absolute URLs are used as they are.
// No JWT in the URL; files are fetched with the Authorization header.
function openDocument(path: string | null | undefined) {
    if (!path) return;
    const url = path.startsWith("http://") || path.startsWith("https://") ? path : getApiUrl(path);
    void openAuthenticatedFileOrToast(url);
}

/** Upload paths arrive with or without the leading /uploads/ segment. */
function toUploadPath(filePath: string): string {
    const hasUploadsPrefix = /^[\\/]?uploads[\\/]/.test(filePath);
    if (!hasUploadsPrefix) return `/uploads/${filePath}`;
    return filePath.startsWith("/") || filePath.startsWith("\\") ? filePath : `/${filePath}`;
}

/** A document tile; the file opens in the full-screen viewer (with "Buka di tab baru"). */
function DocumentTile({ label, tone, caption, emptyText, file }: {
    label: string;
    tone: "blue" | "green";
    caption: string;
    emptyText: string;
    file: { fileName: string; url: string | null } | null;
}) {
    const toneClass = tone === "blue" ? "bg-blue-50 border-blue-200 text-blue-600" : "bg-green-50 border-green-200 text-green-600";
    const iconClass = tone === "blue" ? "text-blue-500" : "text-green-500";
    const [viewing, setViewing] = useState(false);
    return (
        <div className="rounded-xl border bg-background/50 p-3">
            <Badge variant="outline" className={`mb-2 text-xs ${toneClass}`}>{label}</Badge>
            {file?.url ? (
                <div className="flex items-center gap-3">
                    <FileText className={`h-8 w-8 shrink-0 ${iconClass}`} />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium" title={file.fileName}>{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">{caption}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0" title="Lihat berkas" aria-label={`Lihat ${file.fileName}`} onClick={() => setViewing(true)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <AuthenticatedDocumentPreviewDialog open={viewing} onOpenChange={setViewing} fileName={file.fileName} filePath={file.url} />
                </div>
            ) : (
                <p className="text-sm italic text-muted-foreground">{emptyText}</p>
            )}
        </div>
    );
}

/** Proposal, latest thesis draft, and the files uploaded with guidance sessions. */
export function StudentDocumentsCard({ detail }: { detail: StudentDetail }) {
    const uploadedFiles = detail.uploadedFiles ?? [];
    return (
        <Card className="w-full">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Dokumen
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <DocumentTile
                        label="Proposal"
                        tone="blue"
                        caption="Dokumen Proposal"
                        emptyText="Belum ada dokumen proposal"
                        file={detail.proposalDocument}
                    />
                    <DocumentTile
                        label="Draft Laporan Tugas Akhir"
                        tone="green"
                        caption="Draft Akhir"
                        emptyText="Belum ada dokumen"
                        file={detail.document}
                    />
                </div>

                {uploadedFiles.length > 0 && (
                    <div>
                        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <Clock className="h-4 w-4" /> Riwayat File Upload ({uploadedFiles.length})
                        </p>
                        <div className="max-h-48 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            {uploadedFiles.map((file, idx) => (
                                <div key={file.id} className="flex items-center gap-3 rounded-lg border bg-background/50 p-2">
                                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium" title={file.fileName}>{file.fileName}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDateTimeWib(file.guidanceDate ?? file.uploadedAt)}
                                        </p>
                                    </div>
                                    {idx === 0 && (
                                        <Badge variant="outline" className="h-5 shrink-0 border-green-200 bg-green-50 px-1.5 text-[10px] font-normal text-green-600">
                                            Terbaru
                                        </Badge>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" title="Buka berkas" onClick={() => openDocument(toUploadPath(file.filePath))}>
                                        <Download className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
