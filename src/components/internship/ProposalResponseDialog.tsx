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
    type: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | 'REJECTED_BY_COMPANY' | null;
    companyName?: string;
    members?: { id: string; name: string; nim: string; role: string; status?: string }[];
}

const ProposalResponseDialog: React.FC<ProposalResponseDialogProps> = ({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    type,
    companyName,
    members = []
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
                // Always select Coordinator by default as they are not part of the selection list in student view
                setAcceptedMemberIds(members.filter(m =>
                    m.status === 'ACCEPTED_BY_COMPANY' || m.role === 'Koordinator'
                ).map(m => m.id));
            } else {
                // Default select all members if no decision yet
                setAcceptedMemberIds(members.map(m => m.id));
            }
        }
    }, [open, members]);

    const isRejectSekdep = type === 'REJECTED_BY_SEKDEP';
    const isRejectCompany = type === 'REJECTED_BY_COMPANY';
    const isApprove = type === 'APPROVED_BY_SEKDEP';

    let label = 'Proses';
    if (isRejectSekdep) label = 'Tolak (Dokumen Invalid)';
    if (isRejectCompany) label = 'Tolak (Ditolak Perusahaan)';
    if (isApprove) label = 'Verifikasi Diterima';

    const handleConfirm = () => {
        onConfirm(notes, isApprove ? acceptedMemberIds : undefined);
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
                    <DialogTitle>{label} Proposal KP</DialogTitle>
                    <DialogDescription>
                        {isRejectSekdep && "Tolak karena dokumen tidak valid/buram/salah. Mahasiswa harus upload ulang."}
                        {isRejectCompany && `Verifikasi bahwa perusahaan ${companyName || ''} MENOLAK lamaran ini.`}
                        {isApprove && `Verifikasi bahwa perusahaan ${companyName || ''} MENERIMA lamaran ini. Centang mahasiswa yang diterima.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {isApprove && members.length > 0 && (
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
                            <Label htmlFor="notes">Catatan {isRejectCompany ? '(Opsional)' : '(Wajib jika ada)'}</Label>
                            <Textarea
                                id="notes"
                                placeholder={isRejectSekdep ? "Alasan dokumen ditolak..." : "Catatan tambahan..."}
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="min-h-[100px]"
                            />
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
                        disabled={isLoading || (isApprove && acceptedMemberIds.length === 0)}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Memproses...
                            </span>
                        ) : (
                            isApprove && acceptedMemberIds.length < members.length && acceptedMemberIds.length > 0 ? "Konfirmasi Diterima Sebagian" : "Konfirmasi"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ProposalResponseDialog;
