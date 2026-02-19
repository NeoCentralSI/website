import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { uploadInternshipDocument, submitCompanyResponse, getProposalDetail, type InternshipProposalItem, type InternshipProposalMember } from "@/services/internship.service";
import { FileText, Upload, Check, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type UploadResponseLetterDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    proposal: InternshipProposalItem | null;
    onSuccess?: () => void;
};

export default function UploadResponseLetterDialog({ open, onOpenChange, proposal, onSuccess }: UploadResponseLetterDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [acceptedMemberIds, setAcceptedMemberIds] = useState<string[]>([]);

    // Fetch proposal detail to get members
    const { data: proposalDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['internship-proposal-detail', proposal?.id],
        queryFn: () => getProposalDetail(proposal!.id),
        enabled: !!proposal && open,
    });

    // Initialize acceptedMemberIds when members are loaded
    useEffect(() => {
        if (proposalDetail?.data?.members) {
            // Default to all members accepted
            const allMemberIds = proposalDetail.data.members.map(m => m.studentId);
            setAcceptedMemberIds(allMemberIds);
        }
    }, [proposalDetail]);

    const handleMemberToggle = (studentId: string) => {
        setAcceptedMemberIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const uploadMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Harap pilih file surat balasan");
            if (!proposal) throw new Error("Proposal tidak valid");

            // 1. Upload document
            const uploadRes = await uploadInternshipDocument(file);

            // 2. Submit company response with accepted members
            return submitCompanyResponse(proposal.id as string, uploadRes.documentId, acceptedMemberIds);
        },
        onSuccess: () => {
            toast.success("Surat balasan perusahaan berhasil diunggah");
            onOpenChange(false);
            setFile(null);
            onSuccess?.();
        },
        onError: (error: any) => {
            toast.error(error.message || "Gagal mengunggah surat balasan");
        }
    });

    const members = proposalDetail?.data?.members || [];
    const isPartial = members.length > 0 && acceptedMemberIds.length < members.length && acceptedMemberIds.length > 0;
    const isRejected = members.length > 0 && acceptedMemberIds.length === 0;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Unggah Surat Balasan Perusahaan</DialogTitle>
                    <DialogDescription>
                        Silakan unggah dokumen surat balasan dari {proposal?.namaCompany || 'perusahaan'} dan pilih anggota yang diterima.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* File Upload Section */}
                    <div className="flex flex-col gap-2">
                        <Label>Surat Balasan (PDF) <span className="text-destructive">*</span></Label>
                        <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                {file ? <FileText className="h-5 w-5 text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-sm font-medium truncate">
                                    {file ? file.name : "Klik untuk memilih file"}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase">
                                    Format: PDF • Max: 2MB
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Member Selection Section */}
                    <div className="space-y-3">
                        <Label>Anggota yang Diterima ({acceptedMemberIds.length}/{members.length})</Label>
                        {isLoadingDetail ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Spinner className="h-4 w-4" /> Memuat anggota...
                            </div>
                        ) : members.length > 0 ? (
                            <div className="border rounded-md divide-y">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">{member.student.user.fullName}</span>
                                            <span className="text-xs text-muted-foreground">{member.student.user.identityNumber}</span>
                                        </div>
                                        <Checkbox
                                            checked={acceptedMemberIds.includes(member.studentId)}
                                            onCheckedChange={() => handleMemberToggle(member.studentId)}
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">Tidak ada anggota dalam proposal ini.</p>
                        )}

                        {/* Status Preview Alert */}
                        {isPartial && (
                            <Alert className="bg-orange-50 text-orange-800 border-orange-200">
                                <AlertCircle className="h-4 w-4 text-orange-800" />
                                <AlertTitle>Diterima Sebagian</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Status proposal akan menjadi "Diterima Sebagian". Anggota yang tidak dicentang akan ditandai sebagai "Ditolak Perusahaan".
                                </AlertDescription>
                            </Alert>
                        )}
                        {isRejected && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Ditolak Semua</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Tidak ada anggota yang dipilih. Status proposal akan menjadi "Ditolak Perusahaan".
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploadMutation.isPending}>
                        Batal
                    </Button>
                    <Button
                        disabled={!file || uploadMutation.isPending || isLoadingDetail}
                        onClick={() => uploadMutation.mutate()}
                        className="gap-2"
                        variant={isRejected ? "destructive" : "default"}
                    >
                        {uploadMutation.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Upload className="h-4 w-4" />}
                        {isRejected ? "Unggah Penolakan" : "Unggah & Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
