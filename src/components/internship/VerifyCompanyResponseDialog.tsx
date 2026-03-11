import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface Member {
    id: string;
    name: string;
    nim: string;
    role: string;
    status: string;
}

interface VerifyCompanyResponseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (notes?: string, acceptedMemberIds?: string[]) => void;
    isLoading: boolean;
    type: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY' | null;
    companyName?: string;
    members?: Member[];
}

export default function VerifyCompanyResponseDialog({
    open,
    onOpenChange,
    onConfirm,
    isLoading,
    type,
    companyName,
    members = []
}: VerifyCompanyResponseDialogProps) {
    const [notes, setNotes] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (open) {
            setNotes("");
            // Auto-select all pending members by default if approving
            if (type === 'APPROVED_PROPOSAL') {
                const initialSelected = members.reduce((acc, m) => {
                    if (m.status === 'PENDING' || m.status === 'ACCEPTED' || m.status === 'ACCEPTED_BY_COMPANY' || m.status === 'PARTIALLY_ACCEPTED') {
                        acc[m.id] = true;
                    }
                    return acc;
                }, {} as Record<string, boolean>);
                setSelectedMembers(initialSelected);
            } else {
                setSelectedMembers({});
            }
        }
    }, [open, type, members]);

    const title = type === 'APPROVED_PROPOSAL' ? 'Verifikasi Surat Balasan (Terima)'
        : type === 'REJECTED_BY_COMPANY' ? 'Tandai Ditolak Perusahaan'
            : 'Tolak Verifikasi (Dokumen Invalid)';

    const actionText = type === 'APPROVED_PROPOSAL' ? 'Verifikasi & Setujui'
        : type === 'REJECTED_BY_COMPANY' ? 'Konfirmasi Penolakan'
            : 'Tolak Dokumen';

    const handleConfirm = () => {
        const acceptedMemberIds = Object.entries(selectedMembers)
            .filter(([_, isSelected]) => isSelected)
            .map(([id]) => id);

        onConfirm(notes, acceptedMemberIds);
    };

    const toggleMember = (id: string, checked: boolean) => {
        setSelectedMembers(prev => ({ ...prev, [id]: checked }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {type === 'APPROVED_PROPOSAL' && `Anda akan memverifikasi dan menyetujui surat balasan dari perusahaan ${companyName || ''}. Silakan pilih anggota yang diterima oleh perusahaan.`}
                        {type === 'REJECTED_BY_COMPANY' && `Anda akan mengkonfirmasi bahwa pengajuan ke ${companyName || ''} telah ditolak oleh perusahaan.`}
                        {type === 'REJECTED_PROPOSAL' && `Anda akan menolak hasil verifikasi surat balasan dari ${companyName || ''} (misalnya dokumen tidak terbaca atau invalid).`}
                    </p>

                    {type === 'APPROVED_PROPOSAL' && members && members.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <h4 className="text-sm font-medium">Pilih Mahasiswa yang Diterima</h4>
                            <div className="bg-muted/50 p-3 rounded-md space-y-2 border">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-start space-x-3 py-1">
                                        <Checkbox
                                            id={`member-${member.id}`}
                                            checked={!!selectedMembers[member.id]}
                                            onCheckedChange={(checked) => toggleMember(member.id, !!checked)}
                                        />
                                        <div className="grid gap-1.5 leading-none mt-0.5">
                                            <label
                                                htmlFor={`member-${member.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                            >
                                                {member.name}
                                            </label>
                                            <p className="text-xs text-muted-foreground">
                                                {member.nim} • {member.role}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Catatan (Opsional)</label>
                        <Textarea
                            placeholder="Tambahkan catatan jika diperlukan..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Batal
                    </Button>
                    <Button
                        variant={type === 'REJECTED_PROPOSAL' || type === 'REJECTED_BY_COMPANY' ? 'destructive' : 'default'}
                        onClick={handleConfirm}
                        disabled={isLoading || (type === 'APPROVED_PROPOSAL' && Object.values(selectedMembers).filter(Boolean).length === 0)}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {actionText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
