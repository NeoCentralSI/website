import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { AlertTriangle, Bell, CalendarIcon, CheckCircle2, Clock, Loader2, MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";

import { MilestoneNotes } from "@/components/milestone/MilestoneNotes";
import { ReasonDialog } from "@/components/thesis/LecturerGuidanceDialogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EmptyState from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ThesisPhaseBadge } from "@/components/shared/ThesisPhaseBadge";
import { formatDateTimeWib } from "@/lib/text";
import { getMilestoneStatusLabel, type ThesisPhase } from "@/lib/thesisLabels";
import { cn } from "@/lib/utils";
import {
    createMilestoneForStudent,
    requestMilestoneRevision,
    validateMilestone,
    type CreateMilestoneForStudentDto,
    type StudentDetail,
} from "@/services/lecturerGuidance.service";
import { addFeedback } from "@/services/milestone.service";
import { countMilestonesAwaitingReview } from "./studentDetailPending";

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    not_started: "outline",
    in_progress: "secondary",
    pending_review: "secondary",
    revision_needed: "destructive",
    completed: "default",
};

function MilestoneStatusIcon({ status }: { status: string }) {
    switch (status) {
        case "completed": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        case "in_progress": return <Clock className="h-5 w-5 text-blue-500" />;
        case "revision_needed": return <AlertTriangle className="h-5 w-5 text-red-500" />;
        default: return <Clock className="h-5 w-5 text-gray-300" />;
    }
}

interface StudentMilestoneCardProps {
    thesisId: string;
    milestones: StudentDetail["milestones"];
    isPembimbing1: boolean;
    /** Ended thesis (completed/failed): read-only history. */
    isEnded: boolean;
    /** K14: why milestone write actions are closed; null when they are open. */
    actionBlockReason: string | null;
    /**
     * Paket E4 (2.4): milestones of the other phase continue the same list below the current
     * phase, each with its phase badge, read-only, without action buttons.
     */
    readOnlyMilestones?: StudentDetail["milestones"];
    readOnlyPhase?: ThesisPhase;
}

/** Shared max height of the Milestone and Riwayat Bimbingan lists (Paket E4, 2.5). */
export const DETAIL_LIST_MAX_HEIGHT_CLASS = "max-h-150";

/**
 * Supervisor's view of a student's milestones: review (Pembimbing 1), feedback
 * (Pembimbing 1 and 2) and "Tambah" (Pembimbing 1), each with its own dialog.
 */
export function StudentMilestoneCard({ thesisId, milestones, isPembimbing1, isEnded, actionBlockReason, readOnlyMilestones = [], readOnlyPhase }: StudentMilestoneCardProps) {
    const queryClient = useQueryClient();
    const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [reviewNotes, setReviewNotes] = useState("");

    // Create milestone dialog state
    const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false);
    const [milestoneTitle, setMilestoneTitle] = useState("");
    const [milestoneDescription, setMilestoneDescription] = useState("");
    const [milestoneTargetDate, setMilestoneTargetDate] = useState<Date | undefined>();
    const [milestoneSupervisorNotes, setMilestoneSupervisorNotes] = useState("");

    // K20: feedback from P1 or P2 (does not change the milestone status)
    const [feedbackMilestoneId, setFeedbackMilestoneId] = useState<string | null>(null);

    const awaitingReview = countMilestonesAwaitingReview(milestones, { isPembimbing1, isEnded });

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

    const resetMilestoneForm = () => {
        setMilestoneTitle("");
        setMilestoneDescription("");
        setMilestoneTargetDate(undefined);
        setMilestoneSupervisorNotes("");
    };

    const createMilestoneMutation = useMutation({
        mutationFn: (data: CreateMilestoneForStudentDto) => createMilestoneForStudent(thesisId, data),
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

    const submitFeedback = async (feedback: string) => {
        if (!feedbackMilestoneId) return false;
        try {
            await addFeedback(feedbackMilestoneId, { feedback });
            toast.success("Feedback berhasil dikirim");
            queryClient.invalidateQueries({ queryKey: ["student-detail", thesisId] });
            return true;
        } catch (e) {
            toast.error((e as Error)?.message || "Gagal mengirim feedback");
            return false;
        }
    };

    const previousFeedback = milestones.find((m) => m.id === feedbackMilestoneId)?.feedback;

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-4">
                <div className="min-w-0 space-y-1">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                        Milestone
                        {awaitingReview > 0 && (
                            <Badge variant="warning" className="font-medium">{awaitingReview} menunggu tinjauan</Badge>
                        )}
                    </CardTitle>
                    {/* C11: visible reason for the disabled review button */}
                    {!isPembimbing1 && (
                        <p className="text-xs text-muted-foreground">
                            Hanya Pembimbing 1 yang dapat menyetujui atau meminta revisi milestone. Anda tetap dapat memberi feedback.
                        </p>
                    )}
                </div>
                {isPembimbing1 && (
                    <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0"
                        onClick={() => setCreateMilestoneOpen(true)}
                        disabled={isEnded || !!actionBlockReason}
                        title={actionBlockReason ?? undefined}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Tambah
                    </Button>
                )}
            </CardHeader>
            <CardContent className="px-2 sm:px-6">
                <div className={cn(DETAIL_LIST_MAX_HEIGHT_CLASS, "overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent")}>
                    <div className="relative border-l ml-3 space-y-8 my-2 pt-2">
                        {milestones.length + readOnlyMilestones.length > 0 ? (
                            [
                                ...milestones.map((milestone) => ({ milestone, readOnly: false })),
                                ...readOnlyMilestones.map((milestone) => ({ milestone, readOnly: true })),
                            ].map(({ milestone, readOnly }) => {
                                const canReview = !readOnly && isPembimbing1 && milestone.status === 'pending_review' && !isEnded;
                                return (
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
                                            <MilestoneStatusIcon status={milestone.status} />
                                        </span>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className="min-w-0 flex-1 font-medium text-sm leading-snug mt-0.5 [overflow-wrap:anywhere]">{milestone.title}</h4>
                                                {!readOnly && <div className="flex shrink-0 items-center gap-1">
                                                    {canReview && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 gap-1 px-2 text-xs"
                                                            title="Review Milestone"
                                                            onClick={() => setSelectedMilestoneId(milestone.id)}
                                                        >
                                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                                            Tinjau
                                                        </Button>
                                                    )}
                                                    {!canReview && milestone.status !== 'completed' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-30 cursor-not-allowed"
                                                            title={
                                                                isEnded
                                                                    ? "Tidak dapat memproses karena tugas akhir dibatalkan"
                                                                    : !isPembimbing1
                                                                        ? "Hanya Pembimbing 1 yang dapat menyetujui atau meminta revisi milestone. Anda tetap dapat memberi feedback."
                                                                        : "Milestone belum diajukan untuk review (progres 100%)"
                                                            }
                                                            disabled
                                                        >
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {/* K20: Pembimbing 1 and 2 may give feedback (no status change) */}
                                                    {!actionBlockReason && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            title="Beri feedback"
                                                            aria-label="Beri feedback"
                                                            onClick={() => setFeedbackMilestoneId(milestone.id)}
                                                        >
                                                            <MessageSquare className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>}
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-muted-foreground">
                                                    <span>Proses</span>
                                                    <span>{milestone.progressPercentage || 0}%</span>
                                                </div>
                                                <Progress value={milestone.progressPercentage || 0} className="h-1.5" />
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-1">
                                                {readOnly && (
                                                    <ThesisPhaseBadge phase={readOnlyPhase ?? milestone.phase} className="text-[10px] h-5 px-1.5" />
                                                )}
                                                <Badge variant={STATUS_VARIANTS[milestone.status] || "outline"} className="text-[10px] h-5 px-1.5 font-normal">
                                                    {getMilestoneStatusLabel(milestone.status)}
                                                </Badge>
                                                {!readOnly && milestone.progressPercentage === 100 && milestone.status === 'in_progress' && (
                                                    <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal gap-1 animate-pulse text-red-600 border-red-600 bg-transparent">
                                                        <Bell className="h-3 w-3" />
                                                        Perlu Persetujuan
                                                    </Badge>
                                                )}
                                                {milestone.updatedAt && (
                                                    <span className="text-xs text-muted-foreground/70">
                                                        {formatDateTimeWib(milestone.updatedAt)}
                                                    </span>
                                                )}
                                            </div>
                                            {/* C9: decision notes and supervisor feedback, separately */}
                                            <MilestoneNotes
                                                status={milestone.status}
                                                supervisorNotes={milestone.supervisorNotes}
                                                feedback={milestone.feedback}
                                                feedbackByName={milestone.feedbackByName}
                                                feedbackAt={milestone.feedbackAt}
                                            />
                                        </div>
                                    </div>
                                );
                            })
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
                            <p className="text-[10px] text-muted-foreground">Catatan wajib diisi jika meminta revisi; opsional saat menyetujui.</p>
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

            <ReasonDialog
                open={!!feedbackMilestoneId}
                onOpenChange={(o) => !o && setFeedbackMilestoneId(null)}
                title="Feedback Milestone"
                description="Feedback dikirim ke mahasiswa tanpa mengubah status maupun catatan persetujuan/revisi."
                note={previousFeedback ? (
                    <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Feedback sebelumnya (akan digantikan)</p>
                        <div className="rounded-md bg-muted/50 p-2 text-xs whitespace-pre-wrap">{previousFeedback}</div>
                    </div>
                ) : null}
                label="Feedback"
                placeholder="Contoh: Perhatikan format sitasi pada bab 2."
                confirmText="Kirim Feedback"
                onSubmit={submitFeedback}
            />

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
        </Card>
    );
}
