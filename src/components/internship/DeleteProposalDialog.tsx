import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteProposal } from "@/services/internship.service";
import { toast } from "sonner";

interface DeleteProposalDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proposalId: string | null;
    companyName?: string;
    onDeleted?: () => void;
}

export default function DeleteProposalDialog({
    open,
    onOpenChange,
    proposalId,
    companyName,
    onDeleted,
}: DeleteProposalDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (!proposalId) return;

        setIsDeleting(true);
        try {
            await deleteProposal(proposalId);
            toast.success("Proposal berhasil dihapus.");
            onOpenChange(false);
            onDeleted?.();
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus proposal");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!proposalId) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                        <Trash2 className="h-5 w-5" />
                        Hapus Proposal
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                Apakah Anda yakin ingin menghapus proposal internship ke{" "}
                                <span className="font-semibold text-foreground">
                                    {companyName || "perusahaan terkait"}
                                </span>
                                ?
                            </p>
                            <p>
                                Tindakan ini tidak dapat dibatalkan. Dokumen proposal dan data terkait akan dihapus secara permanen.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleConfirm();
                        }}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Hapus Proposal
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
