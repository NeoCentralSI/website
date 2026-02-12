import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCompanies, getEligibleStudents, uploadInternshipDocument, submitProposal } from "@/services/internship.service";
import { getActiveAcademicYearAPI } from "@/services/admin.service";
import { X, Search, Plus, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export type RegisterInternshipDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmitted?: () => void;
};

export default function RegisterInternshipDialog({ open, onOpenChange, onSubmitted }: RegisterInternshipDialogProps) {
    const { user } = useAuth();

    // States
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newCompanyAddress, setNewCompanyAddress] = useState("");
    const [proposalFile, setProposalFile] = useState<File | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState("");

    // Queries
    const companiesQuery = useQuery({
        queryKey: ['internship-companies'],
        queryFn: getCompanies,
        enabled: open,
    });

    const studentsQuery = useQuery({
        queryKey: ['eligible-students'],
        queryFn: getEligibleStudents,
        enabled: open,
    });

    const activeAcademicYearQuery = useQuery({
        queryKey: ['active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
        enabled: open,
    });

    // Mapped options for ComboBox
    const companyOptions = useMemo(() => {
        const options = (companiesQuery.data?.data || []).map(c => {
            const isBlacklisted = (c.status || '').toLowerCase() === 'blacklist';
            return {
                label: c.companyName,
                value: c.id,
                disabled: isBlacklisted,
                rightLabel: isBlacklisted ? (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0 uppercase">
                        Blacklist
                    </Badge>
                ) : undefined
            };
        });
        return [
            { label: "+ Tambah Perusahaan Baru", value: "NEW" },
            ...options
        ];
    }, [companiesQuery.data]);

    // Member search logic
    const availableStudents = useMemo(() => {
        if (!studentsQuery.data?.data) return [];
        return studentsQuery.data.data.filter(s =>
            s.id !== user?.id && // Don't show current user
            !selectedMemberIds.includes(s.id) && // Don't show already selected
            (s.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
                s.identityNumber.includes(memberSearch))
        );
    }, [studentsQuery.data, selectedMemberIds, memberSearch, user?.id]);

    const selectedMembers = useMemo(() => {
        if (!studentsQuery.data?.data) return [];
        return studentsQuery.data.data.filter(s => selectedMemberIds.includes(s.id));
    }, [studentsQuery.data, selectedMemberIds]);

    // Mutations
    const submitMutation = useMutation({
        mutationFn: async () => {
            if (!proposalFile) throw new Error("Harap unggah dokumen proposal");
            if (selectedCompanyId === "NEW" && (!newCompanyName || !newCompanyAddress)) {
                throw new Error("Harap isi nama dan alamat perusahaan baru");
            }
            if (!selectedCompanyId) throw new Error("Harap pilih perusahaan");

            // 1. Upload document first
            const uploadRes = await uploadInternshipDocument(proposalFile);

            // 2. Submit proposal
            return submitProposal({
                coordinatorId: user?.id || "",
                targetCompanyId: selectedCompanyId === "NEW" ? undefined : selectedCompanyId,
                newCompany: selectedCompanyId === "NEW" ? {
                    companyName: newCompanyName,
                    address: newCompanyAddress,
                } : undefined,
                proposalDocumentId: uploadRes.documentId,
                academicYearId: activeAcademicYearQuery.data?.academicYear?.id || "",
                memberIds: selectedMemberIds,
            });
        },
        onSuccess: () => {
            toast.success("Proposal internship berhasil diajukan");
            onOpenChange(false);
            resetForm();
            onSubmitted?.();
        },
        onError: (error: any) => {
            toast.error(error.message || "Gagal mengajukan proposal");
        }
    });

    const resetForm = () => {
        setSelectedCompanyId("");
        setNewCompanyName("");
        setNewCompanyAddress("");
        setProposalFile(null);
        setSelectedMemberIds([]);
        setMemberSearch("");
    };

    const addMember = (id: string) => {
        setSelectedMemberIds(prev => [...prev, id]);
    };

    const removeMember = (id: string) => {
        setSelectedMemberIds(prev => prev.filter(mId => mId !== id));
    };

    const isFormValid = !!proposalFile && !!selectedCompanyId &&
        (selectedCompanyId === "NEW" ? (!!newCompanyName && !!newCompanyAddress) : true);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 text-foreground">
                <DialogHeader className="px-6 pt-6 shrink-0">
                    <DialogTitle>Daftar Kerja Praktik</DialogTitle>
                    <DialogDescription>
                        Isi detail perusahaan dan ajak anggota kelompok (opsional).
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                        {/* Left Column: Information & Document */}
                        <div className="space-y-6">
                            {/* Company Section */}
                            <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Plus className="h-4 w-4 text-primary" /> Informasi Perusahaan
                                </h3>

                                <div className="space-y-2">
                                    <Label>Pilih Perusahaan <span className="text-destructive">*</span></Label>
                                    <ComboBox
                                        items={companyOptions}
                                        placeholder="Cari atau tambah perusahaan..."
                                        onChange={setSelectedCompanyId}
                                        defaultValue={selectedCompanyId}
                                        width="w-full"
                                        disabled={companiesQuery.isLoading}
                                    />
                                </div>

                                {selectedCompanyId === "NEW" && (
                                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                        <div className="space-y-2">
                                            <Label>Nama Perusahaan Baru</Label>
                                            <Input
                                                placeholder="Masukkan nama perusahaan..."
                                                value={newCompanyName}
                                                onChange={(e) => setNewCompanyName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Alamat Perusahaan</Label>
                                            <Textarea
                                                placeholder="Masukkan alamat lengkap perusahaan..."
                                                value={newCompanyAddress}
                                                onChange={(e) => setNewCompanyAddress(e.target.value)}
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Document Section */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold">Dokumen Proposal <span className="text-destructive">*</span></Label>
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                                    className="cursor-pointer"
                                />
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                                    <p className="text-[10px] text-blue-700 italic leading-relaxed">
                                        Pastikan file berformat PDF dengan ukuran maksimal 2MB.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Members Section */}
                        <div className="space-y-4 border-l pl-2 md:pl-8 border-muted">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Anggota Kelompok</Label>
                                <Badge variant="secondary" className="font-mono">{selectedMemberIds.length} Anggota</Badge>
                            </div>

                            {/* Search Members */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIM atau Nama Mahasiswa..."
                                    className="pl-10 h-10"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />

                                {/* Suggestions (Floating) */}
                                {memberSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-1 z-20 border rounded-md shadow-lg bg-background overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        {availableStudents.length > 0 ? (
                                            <div className="divide-y max-h-60 overflow-y-auto">
                                                {availableStudents.slice(0, 3).map(student => (
                                                    <div key={student.id}
                                                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            addMember(student.id);
                                                            setMemberSearch("");
                                                        }}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium">{student.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground">{student.identityNumber}</span>
                                                        </div>
                                                        <UserPlus className="h-4 w-4 text-primary opacity-50" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-4 bg-muted/10">
                                                Mahasiswa tidak ditemukan atau sudah terpilih.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Selected Members List */}
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-2">
                                    Anggota Terpilih
                                    {selectedMembers.length > 0 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">{selectedMembers.length}</Badge>
                                    )}
                                </Label>

                                {selectedMembers.length > 0 ? (
                                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                                        {selectedMembers.map(member => (
                                            <div key={member.id} className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-lg p-2 pl-3 group hover:border-primary/30 transition-colors">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold">{member.fullName}</span>
                                                    <span className="text-[10px] text-muted-foreground">{member.identityNumber}</span>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded-full transition-opacity"
                                                    onClick={() => removeMember(member.id)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground border border-dashed rounded-lg bg-muted/5">
                                        <Search className="h-8 w-8 mb-2 opacity-10" />
                                        <p className="text-[11px] italic">Belum ada anggota yang dipilih</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="px-6 py-4 border-t gap-3 shrink-0 bg-muted/10">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="px-8">
                        Batal
                    </Button>
                    <Button
                        disabled={!isFormValid || submitMutation.isPending}
                        onClick={() => submitMutation.mutate()}
                        className="px-8 font-semibold shadow-lg shadow-primary/20"
                    >
                        {submitMutation.isPending ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4 text-white" />
                                Mengirim...
                            </>
                        ) : "Daftar Sekarang"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
