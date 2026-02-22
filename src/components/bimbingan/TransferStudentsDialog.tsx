import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { toTitleCaseName } from "@/lib/text";
import {
    getEligibleTransferLecturers,
    requestStudentTransfer,
    type MyStudentItem,
    type TransferLecturer,
} from "@/services/lecturerGuidance.service";
import { ArrowRightLeft, Users, AlertTriangle } from "lucide-react";

interface TransferStudentsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedStudents: MyStudentItem[];
    onSuccess: () => void;
}

export function TransferStudentsDialog({
    open,
    onOpenChange,
    selectedStudents,
    onSuccess,
}: TransferStudentsDialogProps) {
    const [targetLecturerId, setTargetLecturerId] = useState("");
    const [reason, setReason] = useState("");

    // Fetch eligible lecturers
    const { data: lecturerData, isLoading: loadingLecturers } = useQuery({
        queryKey: ["transfer-eligible-lecturers"],
        queryFn: getEligibleTransferLecturers,
        enabled: open,
    });

    const lecturers: TransferLecturer[] = lecturerData?.lecturers ?? [];

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setTargetLecturerId("");
            setReason("");
        }
    }, [open]);

    const transferMutation = useMutation({
        mutationFn: () =>
            requestStudentTransfer({
                thesisIds: selectedStudents.map((s) => s.thesisId!).filter(Boolean),
                targetLecturerId,
                reason,
            }),
        onSuccess: (data) => {
            toast.success("Transfer berhasil dikirim", {
                description: data.message,
            });
            onOpenChange(false);
            onSuccess();
        },
        onError: (error: Error) => {
            toast.error("Gagal mengirim permintaan transfer", {
                description: error.message,
            });
        },
    });

    const canSubmit =
        targetLecturerId &&
        reason.trim().length >= 10 &&
        selectedStudents.length > 0 &&
        !transferMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        Transfer Mahasiswa Bimbingan
                    </DialogTitle>
                    <DialogDescription>
                        Transfer mahasiswa ke dosen pembimbing lain. Dosen tujuan harus
                        menyetujui terlebih dahulu.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Selected students */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Mahasiswa yang akan ditransfer
                            <Badge variant="secondary" className="text-xs ml-1">{selectedStudents.length}</Badge>
                        </label>
                        <div className="max-h-32 overflow-y-auto rounded-md border bg-muted/30 p-2 space-y-1.5">
                            {selectedStudents.map((s) => (
                                <div key={s.studentId} className="text-sm flex items-center justify-between">
                                    <div>
                                        <span className="font-medium">{toTitleCaseName(s.fullName || "")}</span>
                                        <span className="text-muted-foreground ml-1.5 text-xs">
                                            ({s.identityNumber})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Target lecturer */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Dosen Pembimbing Tujuan <span className="text-destructive">*</span>
                        </label>
                        {loadingLecturers ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Spinner className="h-4 w-4" />
                                Memuat daftar dosen...
                            </div>
                        ) : lecturers.length === 0 ? (
                            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 py-2">
                                <AlertTriangle className="h-4 w-4" />
                                Tidak ada dosen dengan role Pembimbing 1 yang tersedia
                            </div>
                        ) : (
                            <Select value={targetLecturerId} onValueChange={setTargetLecturerId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih dosen pembimbing tujuan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {lecturers.map((l) => (
                                        <SelectItem key={l.id} value={l.id}>
                                            <div className="flex items-center justify-between w-full gap-2">
                                                <span>{toTitleCaseName(l.fullName)}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({l.identityNumber}) • {l.currentStudentCount} mhs
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Alasan Transfer <span className="text-destructive">*</span>
                        </label>
                        <Textarea
                            placeholder="Jelaskan alasan transfer (min. 10 karakter)..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                        {reason.length > 0 && reason.length < 10 && (
                            <p className="text-xs text-destructive">Minimal 10 karakter ({reason.length}/10)</p>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transferMutation.isPending}>
                        Batal
                    </Button>
                    <Button onClick={() => transferMutation.mutate()} disabled={!canSubmit}>
                        {transferMutation.isPending ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                Mengirim...
                            </>
                        ) : (
                            <>
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Kirim Permintaan Transfer
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
