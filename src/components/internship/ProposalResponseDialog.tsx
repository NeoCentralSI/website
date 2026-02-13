import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProposalResponseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes?: string) => void;
    isLoading?: boolean;
    type: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | null;
    companyName?: string;
}

const ProposalResponseDialog: React.FC<ProposalResponseDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    type,
    companyName
}) => {
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!open) {
            setNotes('');
        }
    }, [open]);

    const isReject = type === 'REJECTED_BY_SEKDEP';
    const label = isReject ? 'Tolak' : 'Setujui';

    const handleConfirm = () => {
        onConfirm(notes);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{label} Proposal KP</DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin {label.toLowerCase()} proposal KP {companyName ? `ke ${companyName}` : ''}?
                        {isReject ? ' Anda dapat memberikan alasan penolakan (opsional).' : ' Tindakan ini tidak dapat dibatalkan.'}
                    </DialogDescription>
                </DialogHeader>

                {isReject && (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan Alasan Penolakan (Opsional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Masukkan alasan penolakan..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        variant={isReject ? "destructive" : "default"}
                        className={!isReject ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        onClick={handleConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Memproses...
                            </span>
                        ) : (
                            `Konfirmasi ${label}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProposalResponseDialog;
