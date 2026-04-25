import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ComboBox } from "@/components/ui/combobox";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/shared";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    getCompanies,
    getEligibleStudents,
    uploadInternshipDocument,
    submitProposal,
    updateProposal,
    getStudentProposals
} from "@/services/internship.service";
import { getHolidays, type InternshipHoliday } from "@/services/internship/holiday.service";
import { getActiveAcademicYearAPI } from "@/services/admin.service";
import { X, Search, UserPlus, ArrowLeft, Calendar, Info, Building2, FileText, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";

export default function RegisterInternshipFormPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { proposalId } = useParams();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    // States
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
    const [newCompanyName, setNewCompanyName] = useState("");
    const [newCompanyAddress, setNewCompanyAddress] = useState("");
    const [newCompanyReason, setNewCompanyReason] = useState("");
    const [proposalFile, setProposalFile] = useState<File | null>(null);
    const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
    const [memberSearch, setMemberSearch] = useState("");
    const [proposedStartDate, setProposedStartDate] = useState("");
    const [proposedEndDate, setProposedEndDate] = useState("");

    // Breadcrumbs
    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik', path: '/kerja-praktik' },
        { label: 'Pendaftaran', path: '/kerja-praktik/pendaftaran' },
        { label: proposalId ? 'Edit Proposal' : 'Daftar Baru' }
    ], [proposalId]);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(proposalId ? "Edit Pengajuan Kerja Praktik" : "Pendaftaran Kerja Praktik Baru");
    }, [breadcrumbs, setBreadcrumbs, setTitle, proposalId]);

    // Queries
    const companiesQuery = useQuery({
        queryKey: ['internship-companies'],
        queryFn: getCompanies,
    });

    const studentsQuery = useQuery({
        queryKey: ['eligible-students'],
        queryFn: getEligibleStudents,
    });

    const activeAcademicYearQuery = useQuery({
        queryKey: ['active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const proposalsQuery = useQuery({
        queryKey: ['student-proposals'],
        queryFn: () => getStudentProposals(),
        enabled: !!proposalId
    });

    // Fetch holidays
    const holidaysQuery = useQuery({
        queryKey: ['internship-holidays'],
        queryFn: async () => {
            const res = await getHolidays();
            return res.data;
        },
    });

    const calculateBusinessDays = (startStr: string, endStr: string, holidayList: InternshipHoliday[] = []) => {
        if (!startStr || !endStr) return 0;
        const start = new Date(startStr);
        const end = new Date(endStr);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
        if (start > end) return 0;

        const holidaySet = new Set(
            holidayList.map((h) => {
                const d = new Date(h.holidayDate);
                return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
            })
        );

        let count = 0;
        const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
        const finalEnd = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

        while (current <= finalEnd) {
            const dayOfWeek = current.getUTCDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const key = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}-${String(current.getUTCDate()).padStart(2, '0')}`;
                if (!holidaySet.has(key)) count++;
            }
            current.setUTCDate(current.getUTCDate() + 1);
        }
        return count;
    };

    const proposalToEdit = useMemo(() => {
        if (!proposalId || !proposalsQuery.data?.data) return null;
        return proposalsQuery.data.data.find(p => p.id === proposalId);
    }, [proposalId, proposalsQuery.data]);

    // Populate form if editing
    useEffect(() => {
        if (proposalToEdit) {
            setSelectedCompanyId(proposalToEdit.targetCompanyId || "");
            setSelectedMemberIds(proposalToEdit.members?.filter(m => m.id !== user?.id).map(m => m.id) || []);
            const formatDate = (dateStr?: string | null) => {
                if (!dateStr) return "";
                const d = new Date(dateStr);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            setProposedStartDate(formatDate(proposalToEdit.proposedStartDate));
            setProposedEndDate(formatDate(proposalToEdit.proposedEndDate));
        }
    }, [proposalToEdit, user?.id]);

    // Mapped options for ComboBox
    const companyOptions = useMemo(() => {
        const options = (companiesQuery.data?.data || [])
            .filter(c => {
                const status = (c.status || '').toLowerCase();
                return status === 'save' || status === 'blacklist';
            })
            .map(c => {
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
            s.id !== user?.id &&
            !selectedMemberIds.includes(s.id) &&
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
            if (!proposalFile && !proposalToEdit) throw new Error("Harap unggah dokumen proposal");
            if (selectedCompanyId === "NEW" && (!newCompanyName || !newCompanyAddress)) {
                throw new Error("Harap isi nama dan alamat perusahaan baru");
            }
            if (!selectedCompanyId) throw new Error("Harap pilih perusahaan");
            if (!proposedStartDate || !proposedEndDate) {
                throw new Error("Harap isi rencana tanggal mulai dan selesai");
            }
            const currentWorkingDays = calculateBusinessDays(proposedStartDate, proposedEndDate, holidaysQuery.data || []);
            if (currentWorkingDays < 30) {
                throw new Error("Jumlah hari kerja minimal adalah 30 hari.");
            }

            let documentId = proposalToEdit?.dokumenProposal?.id;

            // 1. Upload document if changed
            if (proposalFile) {
                const uploadRes = await uploadInternshipDocument(proposalFile);
                documentId = uploadRes.documentId;
            }

            if (!documentId) throw new Error("Dokumen proposal wajib ada.");

            // 2. Submit or Update proposal
            const baseBody = {
                coordinatorId: user?.id || "",
                targetCompanyId: selectedCompanyId === "NEW" ? undefined : selectedCompanyId,
                newCompany: selectedCompanyId === "NEW" ? {
                    companyName: newCompanyName,
                    address: newCompanyAddress,
                    alasan: newCompanyReason || undefined,
                } : undefined,
                proposalDocumentId: documentId,
                academicYearId: activeAcademicYearQuery.data?.academicYear?.id || "",
                memberIds: selectedMemberIds,
                proposedStartDate,
                proposedEndDate,
            };

            if (proposalToEdit?.id) {
                return updateProposal(proposalToEdit.id, baseBody);
            }

            return submitProposal(baseBody);
        },
        onSuccess: () => {
            toast.success(proposalToEdit ? "Proposal berhasil diperbarui" : "Proposal internship berhasil diajukan");
            navigate("/kerja-praktik/pendaftaran");
        },
        onError: (error: any) => {
            toast.error(error.message || (proposalToEdit ? "Gagal memperbarui proposal" : "Gagal mengajukan proposal"));
        }
    });

    const addMember = (id: string) => {
        setSelectedMemberIds(prev => [...prev, id]);
    };

    const removeMember = (id: string) => {
        setSelectedMemberIds(prev => prev.filter(mId => mId !== id));
    };

    const workingDaysCount = calculateBusinessDays(proposedStartDate, proposedEndDate, holidaysQuery.data || []);
    const isWorkingDaysValid = workingDaysCount >= 30;

    const isFormValid = (!!proposalFile || !!proposalToEdit) &&
        !!selectedCompanyId &&
        !!proposedStartDate &&
        !!proposedEndDate &&
        isWorkingDaysValid &&
        (selectedCompanyId === "NEW" ? (!!newCompanyName && !!newCompanyAddress) : true);

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500 mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate("/kerja-praktik/pendaftaran")} className="shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {proposalId ? "Edit Pengajuan Kerja Praktik" : "Pendaftaran Kerja Praktik Baru"}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Waktu Pelaksanaan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Calendar className="h-4 w-4" />
                                Rencana Waktu Kerja Praktik
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Tanggal Mulai <span className="text-destructive">*</span></Label>
                                    <DatePicker
                                        value={proposedStartDate ? new Date(proposedStartDate) : undefined}
                                        onChange={(date) => {
                                            if (!date) {
                                                setProposedStartDate("");
                                            } else {
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                setProposedStartDate(`${year}-${month}-${day}`);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Selesai <span className="text-destructive">*</span></Label>
                                    <DatePicker
                                        value={proposedEndDate ? new Date(proposedEndDate) : undefined}
                                        onChange={(date) => {
                                            if (!date) {
                                                setProposedEndDate("");
                                            } else {
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                setProposedEndDate(`${year}-${month}-${day}`);
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            {proposedStartDate && proposedEndDate && (
                                <div className={`mt-4 p-4 rounded-lg flex items-center justify-between ${isWorkingDaysValid ? 'bg-primary/5 text-primary' : 'bg-destructive/5 text-destructive'}`}>
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        <Info className="h-4 w-4" />
                                        <span>Estimasi Hari Kerja:</span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-bold">{holidaysQuery.isLoading ? "..." : workingDaysCount}</span>
                                        <span className="text-xs font-normal">Hari</span>
                                    </div>
                                </div>
                            )}

                            {!isWorkingDaysValid && proposedStartDate && proposedEndDate && !holidaysQuery.isLoading && (
                                <Alert variant="destructive" className="mt-2">
                                    <AlertTitle>Durasi Tidak Mencukupi</AlertTitle>
                                    <AlertDescription>
                                        Jumlah hari kerja minimal adalah 30 hari. Silakan sesuaikan rentang tanggal Anda.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    {/* Informasi Perusahaan */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="h-4 w-4" />
                                Informasi Perusahaan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
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
                                <div className="space-y-6 pt-4 border-t animate-in fade-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <Label>Nama Perusahaan Baru</Label>
                                        <Input
                                            placeholder="Masukkan nama resmi perusahaan..."
                                            value={newCompanyName}
                                            onChange={(e) => setNewCompanyName(e.target.value)}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alamat Perusahaan</Label>
                                        <Textarea
                                            placeholder="Masukkan alamat lengkap perusahaan..."
                                            value={newCompanyAddress}
                                            onChange={(e) => setNewCompanyAddress(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            Alasan Memilih Perusahaan
                                            <Badge variant="outline" className="text-[10px] font-normal">Opsional</Badge>
                                        </Label>
                                        <Textarea
                                            placeholder="Berikan alasan mengapa Anda memilih perusahaan ini..."
                                            value={newCompanyReason}
                                            onChange={(e) => setNewCompanyReason(e.target.value)}
                                            rows={3}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Dokumen Proposal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <FileText className="h-4 w-4" />
                                Dokumen Proposal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Label className="text-sm font-semibold">File Proposal <span className="text-destructive">*</span></Label>

                            {proposalToEdit?.dokumenProposal && !proposalFile && (
                                <div className="p-3 bg-primary/5 rounded-md border border-primary/10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-4 w-4 text-primary shrink-0" />
                                        <span className="text-sm truncate font-medium">{proposalToEdit.dokumenProposal.fileName}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] h-7 px-2" onClick={() => setProposalFile(null)}>Ganti File</Button>
                                </div>
                            )}

                            {(!proposalToEdit || proposalFile) && (
                                <Input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                                    className="cursor-pointer h-11"
                                />
                            )}

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                                <p className="text-xs text-blue-700 italic leading-relaxed">
                                    Pastikan file berformat PDF dengan ukuran maksimal 2MB. Template proposal dapat diunduh pada halaman utama pendaftaran.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Members Area */}
                <div className="space-y-6">
                    <Card className="sticky top-6">
                        <CardHeader className="pb-3 border-b mb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Users className="h-4 w-4" />
                                    Anggota Kelompok
                                </CardTitle>
                                <Badge variant="secondary" className="font-mono">{selectedMemberIds.length + 1} Anggota</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed mt-2">
                                Anda adalah Koordinator. Anda dapat menambahkan anggota tambahan ke dalam kelompok Anda jika diperlukan.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari NIM atau Nama..."
                                    className="pl-10"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />

                                {memberSearch && (
                                    <div className="absolute top-full left-0 right-0 mt-1 z-20 border rounded-lg shadow-xl bg-background overflow-hidden">
                                        {availableStudents.length > 0 ? (
                                            <div className="divide-y max-h-60 overflow-y-auto">
                                                {availableStudents.slice(0, 5).map(student => (
                                                    <div key={student.id}
                                                        className="flex items-center justify-between p-3 hover:bg-primary/5 cursor-pointer transition-colors"
                                                        onClick={() => {
                                                            addMember(student.id);
                                                            setMemberSearch("");
                                                        }}
                                                    >
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium truncate">{student.fullName}</span>
                                                            <span className="text-[10px] text-muted-foreground">{student.identityNumber}</span>
                                                        </div>
                                                        <UserPlus className="h-4 w-4 text-primary shrink-0" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-center text-muted-foreground py-4 px-2">
                                                Mahasiswa tidak ditemukan atau sudah terpilih.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 pt-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                                    Daftar Anggota
                                </Label>

                                <div className="space-y-2">
                                    {/* Coordinator Card (Static) */}
                                    <div className="flex items-center justify-between bg-muted/40 border rounded-lg p-3">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-semibold truncate">{user?.fullName}</span>
                                            <span className="text-[10px] text-muted-foreground">{user?.identityNumber} (Koordinator)</span>
                                        </div>
                                        <Badge className="bg-primary/20 text-primary hover:bg-primary/20 text-[9px] uppercase font-bold">You</Badge>
                                    </div>

                                    {/* Members List */}
                                    {selectedMembers.map(member => (
                                        <div key={member.id} className="flex items-center justify-between bg-primary/5 border border-primary/10 rounded-lg p-3 group animate-in slide-in-from-right-2 duration-200">
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold truncate">{member.fullName}</span>
                                                <span className="text-[10px] text-muted-foreground">{member.identityNumber}</span>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-full"
                                                onClick={() => removeMember(member.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    {selectedMembers.length === 0 && (
                                        <div className="py-6 flex flex-col items-center justify-center border border-dashed rounded-lg bg-muted/10 opacity-60">
                                            <p className="text-[11px] italic text-muted-foreground">Pilih teman untuk berkelompok</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t space-y-4">
                                <Button
                                    disabled={!isFormValid || submitMutation.isPending}
                                    onClick={() => submitMutation.mutate()}
                                    className="w-full h-12 text-md font-bold shadow-lg shadow-primary/20"
                                >
                                    {submitMutation.isPending ? (
                                        <>
                                            <Spinner className="mr-2 h-4 w-4 text-white" />
                                            Sedang Memproses...
                                        </>
                                    ) : (
                                        proposalToEdit ? "Simpan Perubahan" : "Ajukan Proposal"
                                    )}
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground px-4">
                                    Dengan mengajukan, Anda menyatakan bahwa data yang diisi adalah benar dan telah disetujui oleh seluruh anggota kelompok.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
