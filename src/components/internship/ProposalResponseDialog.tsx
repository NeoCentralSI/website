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
import { Checkbox } from "@/components/ui/checkbox";

interface ProposalResponseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes?: string, acceptedMemberIds?: string[]) => void;
    isLoading?: boolean;
    type: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY' | null;
    companyName?: string;
    members?: { id: string; name: string; nim: string; role: string; status?: string }[];
}

const EMPTY_ARRAY: any[] = [];

const ProposalResponseDialog: React.FC<ProposalResponseDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    type,
    companyName,
    members = EMPTY_ARRAY
}) => {
    const [notes, setNotes] = useState('');
    const [acceptedMemberIds, setAcceptedMemberIds] = useState<string[]>([]);

    useEffect(() => {
        if (open) {
            setNotes('');
            // Logic to pre-select members based on their current status
            const hasCompanyDecision = members.some(m => m.status === 'ACCEPTED_BY_COMPANY' || m.status === 'REJECTED_BY_COMPANY');

            if (hasCompanyDecision) {
                // If there's a decision recorded (from student upload), select only those accepted
                const filteredIds = members
                    .filter(m => m.status === 'ACCEPTED_BY_COMPANY' || m.role === 'Koordinator')
                    .map(m => m.id);
                setAcceptedMemberIds(filteredIds);
            } else {
                // Default select all members if no decision yet
                setAcceptedMemberIds(members.map(m => m.id));
            }
        }
    }, [open]); // Only run when dialog opens

    const isRejectSekdep = type === 'REJECTED_PROPOSAL';
    const isRejectCompany = type === 'REJECTED_BY_COMPANY';
    const isApprove = type === 'APPROVED_PROPOSAL';

    // Detect stage: Proposal (initial submission) vs Assignment (company response verification)
    const isAssignmentStage = members.length > 0;

    let dialogTitle = 'Proses Proposal KP';
    let dialogDescription = 'Berikan respon terhadap pengajuan kerja praktik ini.';

    if (isRejectSekdep) {
        dialogTitle = 'Tolak Dokumen Proposal';
        dialogDescription = 'Tolak karena dokumen tidak valid (buram/salah). Mahasiswa harus mengunggah ulang.';
    } else if (isRejectCompany) {
        dialogTitle = 'Konfirmasi Penolakan Perusahaan';
        dialogDescription = `Verifikasi bahwa perusahaan ${companyName || ''} MENOLAK lamaran ini.`;
    } else if (isApprove) {
        if (isAssignmentStage) {
            dialogTitle = 'Verifikasi Surat Balasan';
            dialogDescription = `Konfirmasi penerimaan dari ${companyName || ''}. Centang mahasiswa yang diterima.`;
        } else {
            dialogTitle = 'Setujui Proposal KP';
            dialogDescription = `Setujui pengajuan proposal ke ${companyName || ''} untuk masuk ke tahap permohonan surat ke prodi/fakultas.`;
        }
    }

    const handleConfirm = () => {
        onConfirm(notes, isAssignmentStage && isApprove ? acceptedMemberIds : undefined);
    };

    const toggleMember = (id: string) => {
        setAcceptedMemberIds(prev =>
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{dialogTitle}</DialogTitle>
                    <DialogDescription>
                        {dialogDescription}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isAssignmentStage && isApprove && (
                        <div className="grid gap-2">
                            <Label>Daftar Mahasiswa Diterima</Label>
                            <div className="border rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                                {members.map(member => (
                                    <div key={member.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={member.id}
                                            checked={acceptedMemberIds.includes(member.id)}
                                            onCheckedChange={() => toggleMember(member.id)}
                                        />
                                        <label
                                            htmlFor={member.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                            {member.name} ({member.nim})
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Mahasiswa yang tidak dicentang akan berstatus DITOLAK PERUSAHAAN.
                            </p>
                        </div>
                    )}

                    {(isRejectSekdep || isRejectCompany) && (
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Catatan (Opsional)</Label>
                            <Textarea
                                id="notes"
                                placeholder={isRejectSekdep ? "Alasan dokumen ditolak..." : "Catatan tambahan untuk mahasiswa..."}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    )}

                    {!isAssignmentStage && isApprove && (
                        <div className="p-3 bg-green-50 border border-green-100 rounded-md">
                            <p className="text-xs text-green-700">
                                Dengan menyetujui, proposal akan ditandai valid dan siap untuk proses pembuatan surat tugas/permohonan.
                            </p>
                        </div>
                    )}
                </div>

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
                        variant={isRejectSekdep || isRejectCompany ? "destructive" : "default"}
                        className={isApprove ? "bg-green-600 hover:bg-green-700 text-white" : ""}
                        onClick={handleConfirm}
                        disabled={isLoading || (isAssignmentStage && isApprove && acceptedMemberIds.length === 0)}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Memproses...
                            </span>
                        ) : (
                            isAssignmentStage && isApprove && acceptedMemberIds.length < members.length && acceptedMemberIds.length > 0 ? "Konfirmasi Diterima Sebagian" : "Konfirmasi"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProposalResponseDialog;
