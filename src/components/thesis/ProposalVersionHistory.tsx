import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    FileText,
    Upload,
    Download,
    Clock,
    CheckCircle2,
    History,
} from "lucide-react";
import { formatDateId } from "@/lib/text";
import { getApiUrl } from "@/config/api";
import {
    getProposalVersions,
    getProposalSubmissionStatus,
    submitFinalProposal,
    uploadProposalVersion,
    type ProposalVersion,
    type ProposalSubmissionStatus,
} from "@/services/studentGuidance.service";
import {
    getStudentProposalVersions,
    type ProposalVersion as LecturerProposalVersion,
} from "@/services/lecturerGuidance.service";
import { toast } from "sonner";

function formatFileSize(bytes: number | null): string {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileUrl(url: string | null): string {
    if (!url) return "#";
    const fullUrl = url.startsWith("http") ? url : getApiUrl(url);
    const token = localStorage.getItem("accessToken");
    if (token && url.includes("thesis/")) {
        return fullUrl + (fullUrl.includes("?") ? "&" : "?") + `token=${token}`;
    }
    return fullUrl;
}

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (file: File, description: string) => void;
    isUploading: boolean;
}

function UploadDialog({ open, onOpenChange, onUpload, isUploading }: UploadDialogProps) {
    const [description, setDescription] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = () => {
        if (!selectedFile) return;
        onUpload(selectedFile, description);
    };

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setDescription("");
            setSelectedFile(null);
        }
        onOpenChange(nextOpen);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Versi Proposal Baru</DialogTitle>
                    <DialogDescription>
                        Unggah file PDF proposal terbaru. Versi sebelumnya tetap tersimpan sebagai riwayat.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="hidden"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                        />
                        <Button
                            variant="outline"
                            className="w-full h-24 border-dashed flex flex-col gap-2"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {selectedFile ? (
                                <>
                                    <FileText className="h-6 w-6 text-primary" />
                                    <span className="text-sm font-medium truncate max-w-[90%]">{selectedFile.name}</span>
                                    <span className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="h-6 w-6 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Klik untuk pilih file PDF</span>
                                </>
                            )}
                        </Button>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">
                            Catatan Perubahan <span className="text-muted-foreground font-normal">(opsional)</span>
                        </label>
                        <Textarea
                            placeholder="Jelaskan perubahan pada versi ini..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => handleClose(false)} disabled={isUploading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!selectedFile || isUploading}>
                        {isUploading ? (
                            <>
                                <Spinner className="mr-2" /> Mengunggah...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" /> Upload
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface VersionItemProps {
    version: ProposalVersion | LecturerProposalVersion;
}

function VersionItem({ version }: VersionItemProps) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border bg-background/50 hover:bg-background/80 transition-colors">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">v{version.version}</span>
                    {version.isLatest && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Terbaru
                        </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {formatFileSize(version.fileSize)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {version.fileName}
                </p>
                {version.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">
                        {version.description}
                    </p>
                )}
                {version.submittedAsFinalAt && (
                    <p className="text-[11px] text-emerald-700 mt-1">
                        Diajukan sebagai proposal final
                    </p>
                )}
                <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {formatDateId(version.createdAt)}
                </p>
            </div>
            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" asChild>
                <a href={getFileUrl(version.url)} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                </a>
            </Button>
        </div>
    );
}

interface ProposalVersionHistoryProps {
    thesisId: string;
    compact?: boolean;
    readOnly?: boolean;
}

export function ProposalVersionHistory({ thesisId, compact = false, readOnly = false }: ProposalVersionHistoryProps) {
    const queryClient = useQueryClient();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [showAll, setShowAll] = useState(false);

    const queryKey = readOnly
        ? ["lecturer-proposal-versions", thesisId]
        : ["proposal-versions"];

    const { data, isLoading } = useQuery({
        queryKey,
        queryFn: () => readOnly ? getStudentProposalVersions(thesisId) : getProposalVersions(),
    });

    const { data: submissionStatus } = useQuery<ProposalSubmissionStatus>({
        queryKey: ["proposal-submission-status"],
        queryFn: () => getProposalSubmissionStatus(),
        enabled: !readOnly,
    });

    const uploadMutation = useMutation({
        mutationFn: ({ file, description }: { file: File; description: string }) =>
            uploadProposalVersion(file, description),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["proposal-versions"] });
            queryClient.invalidateQueries({ queryKey: ["proposal-submission-status"] });
            queryClient.invalidateQueries({ queryKey: ["student-thesis-detail"] });
            setUploadOpen(false);
            toast.success("Proposal berhasil diunggah");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Gagal mengunggah proposal");
        },
    });

    const submitFinalMutation = useMutation({
        mutationFn: () => submitFinalProposal(),
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: ["proposal-versions"] });
            queryClient.invalidateQueries({ queryKey: ["proposal-submission-status"] });
            queryClient.invalidateQueries({ queryKey: ["student-thesis-detail"] });
            toast.success(
                result.data.alreadySubmitted
                    ? "Versi terbaru sudah menjadi proposal final aktif"
                    : "Proposal final berhasil diajukan untuk penilaian"
            );
        },
        onError: (error: Error) => {
            toast.error(error.message || "Gagal submit proposal final");
        },
    });

    const versions = data?.versions ?? [];
    const displayVersions = compact && !showAll ? versions.slice(0, 3) : versions;
    const hasMore = compact && versions.length > 3 && !showAll;
    const latestVersionId = submissionStatus?.latestVersion?.id ?? null;
    const activeFinalVersionId = submissionStatus?.finalProposalVersion?.id ?? null;
    const canSubmitFinal = !readOnly && !!submissionStatus?.latestVersion && submissionStatus?.hasSupervisor;
    const finalStatusLabel = submissionStatus?.finalProposalVersion
        ? `Proposal final aktif: v${submissionStatus.finalProposalVersion.version}`
        : "Belum ada proposal final yang diajukan";

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Spinner className="h-5 w-5" />
                    <span className="ml-2 text-sm text-muted-foreground">Memuat riwayat proposal...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <History className="h-4 w-4" /> Riwayat Dokumen Proposal
                    </CardTitle>
                    {!readOnly && (
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => submitFinalMutation.mutate()}
                                disabled={!canSubmitFinal || submitFinalMutation.isPending || activeFinalVersionId === latestVersionId}
                            >
                                {submitFinalMutation.isPending ? "Memproses..." : "Submit Proposal Final"}
                            </Button>
                            <Button size="sm" onClick={() => setUploadOpen(true)}>
                                <Upload className="mr-2 h-3.5 w-3.5" /> Upload Versi Baru
                            </Button>
                        </div>
                    )}
                </div>
                {versions.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                            {versions.length} versi tersimpan
                        </p>
                        {!readOnly && (
                            <p className="text-xs text-muted-foreground">
                                {finalStatusLabel}
                            </p>
                        )}
                        {!readOnly && submissionStatus && !submissionStatus.hasSupervisor && (
                            <p className="text-xs text-amber-700">
                                Submit proposal final baru tersedia setelah dosen pembimbing resmi ditetapkan.
                            </p>
                        )}
                    </div>
                )}
            </CardHeader>
            <CardContent className="space-y-2">
                {versions.length === 0 ? (
                    <div className="text-center py-6">
                        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {readOnly
                                ? "Belum ada dokumen proposal yang diunggah"
                                : "Belum ada dokumen proposal. Upload versi pertama untuk mulai melacak perubahan."}
                        </p>
                    </div>
                ) : (
                    <>
                        {displayVersions.map((v) => (
                            <VersionItem key={v.id} version={v} />
                        ))}
                        {hasMore && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => setShowAll(true)}
                            >
                                Lihat semua {versions.length} versi
                            </Button>
                        )}
                    </>
                )}
            </CardContent>

            {!readOnly && (
                <UploadDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    onUpload={(file, description) => uploadMutation.mutate({ file, description })}
                    isUploading={uploadMutation.isPending}
                />
            )}
        </Card>
    );
}
