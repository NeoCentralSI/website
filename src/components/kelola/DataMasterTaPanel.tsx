import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getMasterDataTheses, createMasterDataThesis, updateMasterDataThesis, type MasterDataThesis, type SupervisorData } from "@/services/masterDataTa.service";
import { getStudentsAPI, getLecturersAPI, getAcademicYearsAPI } from "@/services/admin.service";
import { getTopics } from "@/services/topic.service";

import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Spinner, Loading } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RefreshButton } from '@/components/ui/refresh-button';

interface FormState {
    id?: string;
    studentId: string;
    title: string;
    thesisTopicId: string;
    academicYearId: string;
    startDate: string;
    rating: string;
    supervisors: SupervisorData[];
    pembimbing1: string;
    pembimbing2: string;
}

const emptyForm: FormState = {
    studentId: "",
    title: "",
    thesisTopicId: "none",
    academicYearId: "none",
    startDate: "",
    rating: "ONGOING",
    supervisors: [],
    pembimbing1: "none",
    pembimbing2: "none",
};

const ratings = ["ONGOING", "SLOW", "AT_RISK", "FAILED", "CANCELLED"];

export function DataMasterTaPanel() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formState, setFormState] = useState<FormState>(emptyForm);

    // Queries
    const { data: theses = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ["master-data-ta"],
        queryFn: getMasterDataTheses,
    });

    const { data: studentsData } = useQuery({ queryKey: ["admin-students"], queryFn: () => getStudentsAPI({ pageSize: 1000 }) });
    const { data: lecturersData } = useQuery({ queryKey: ["admin-lecturers"], queryFn: () => getLecturersAPI({ pageSize: 1000 }) });
    const { data: topics = [] } = useQuery({ queryKey: ["topics"], queryFn: getTopics });
    const { data: academicYearsData } = useQuery({ queryKey: ["admin-academic-years"], queryFn: () => getAcademicYearsAPI({ pageSize: 100 }) });

    const students = studentsData?.students || [];
    const lecturers = lecturersData?.lecturers || [];
    const academicYears = academicYearsData?.academicYears || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => createMasterDataThesis(data),
        onSuccess: () => {
            toast.success("Data TA berhasil ditambahkan");
            queryClient.invalidateQueries({ queryKey: ["master-data-ta"] });
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Gagal menambah data"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateMasterDataThesis(id, data),
        onSuccess: () => {
            toast.success("Data TA berhasil diperbarui");
            queryClient.invalidateQueries({ queryKey: ["master-data-ta"] });
            setDialogOpen(false);
        },
        onError: (err: any) => toast.error(err.message || "Gagal memperbarui data"),
    });

    const isBusy = isLoading || createMutation.isPending || updateMutation.isPending;

    const filteredTheses = useMemo(() => {
        const term = search.toLowerCase();
        return theses.filter((t) =>
            t.student?.name?.toLowerCase().includes(term) ||
            t.student?.nim?.toLowerCase().includes(term) ||
            t.title?.toLowerCase().includes(term)
        );
    }, [search, theses]);

    const paginatedTheses = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredTheses.slice(start, start + pageSize);
    }, [filteredTheses, page, pageSize]);

    const handleStartCreate = () => {
        setFormState({ ...emptyForm });
        setDialogOpen(true);
    };

    const handleStartEdit = (thesis: MasterDataThesis) => {
        setFormState({
            id: thesis.id,
            studentId: thesis.student?.id || "",
            title: thesis.title || "",
            thesisTopicId: thesis.topic?.id || "none",
            academicYearId: thesis.academicYear?.id || "none",
            startDate: thesis.startDate ? new Date(thesis.startDate).toISOString().split('T')[0] : "",
            rating: thesis.rating || "ONGOING",
            supervisors: thesis.supervisors.map(s => ({
                lecturerId: s.lecturerId,
                roleId: s.roleId,
            })),
            pembimbing1: "none",
            pembimbing2: "none",
        });
        setDialogOpen(true);
    };

    const addSupervisor = () => {
        setFormState(prev => ({
            ...prev,
            supervisors: [...prev.supervisors, { lecturerId: "", roleId: "" }]
        }));
    };

    const removeSupervisor = (index: number) => {
        setFormState(prev => ({
            ...prev,
            supervisors: prev.supervisors.filter((_, i) => i !== index)
        }));
    };

    const updateSupervisor = (index: number, field: keyof SupervisorData, value: string) => {
        setFormState(prev => {
            const newSups = [...prev.supervisors];
            newSups[index] = { ...newSups[index], [field]: value };
            return { ...prev, supervisors: newSups };
        });
    };

    const handleSubmit = () => {
        if (!formState.studentId) {
            toast.error("Mahasiswa harus dipilih");
            return;
        }

        if (!formState.id && formState.pembimbing1 === "none") {
            toast.error("Pembimbing 1 harus dipilih");
            return;
        }

        const payload = {
            ...formState,
            startDate: formState.startDate ? new Date(formState.startDate).toISOString() : null,
            thesisTopicId: formState.thesisTopicId !== "none" ? formState.thesisTopicId : null,
            academicYearId: formState.academicYearId !== "none" ? formState.academicYearId : null,
            title: formState.title || null,
            pembimbing1: formState.pembimbing1 !== "none" ? formState.pembimbing1 : undefined,
            pembimbing2: formState.pembimbing2 !== "none" ? formState.pembimbing2 : undefined,
        };

        if (formState.id) {
            updateMutation.mutate({ id: formState.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const columns = useMemo<Column<MasterDataThesis>[]>(() => [
        {
            key: "student",
            header: "Mahasiswa",
            render: (t) => (
                <div>
                    <div className="font-semibold">{t.student?.name}</div>
                    <div className="text-sm text-muted-foreground">{t.student?.nim}</div>
                </div>
            )
        },
        {
            key: "title",
            header: "Judul / Topik",
            render: (t) => (
                <div>
                    <div className="line-clamp-2 max-w-sm">{t.title || "-"}</div>
                    <Badge variant="outline" className="mt-1">{t.topic?.name || "Tanpa Topik"}</Badge>
                </div>
            )
        },
        {
            key: "academicYear",
            header: "Tahun Ajaran",
            render: (t) => (
                <span className="text-sm">
                    {t.academicYear ? `${t.academicYear.year} - ${t.academicYear.semester}` : "-"}
                </span>
            )
        },
        {
            key: "rating",
            header: "Rating",
            render: (t) => {
                const colors: Record<string, string> = {
                    "ONGOING": "bg-blue-500",
                    "SLOW": "bg-yellow-500",
                    "AT_RISK": "bg-orange-500",
                    "FAILED": "bg-red-500",
                    "CANCELLED": "bg-gray-500",
                };
                return <Badge className={`${colors[t.rating] || "bg-primary"}`}>{t.rating}</Badge>;
            }
        },
        {
            key: "supervisors",
            header: "Pembimbing",
            render: (t) => (
                <div className="flex flex-col gap-1 text-sm">
                    {t.supervisors.map((s, i) => (
                        <span key={i}>• {s.name || s.lecturerId}</span>
                    ))}
                    {t.supervisors.length === 0 && <span className="text-muted-foreground">-</span>}
                </div>
            )
        },
        {
            key: "actions",
            header: "Aksi",
            className: "text-right",
            render: (t) => (
                <Button variant="ghost" size="icon" onClick={() => handleStartEdit(t)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )
        }
    ], []);

    if (isLoading && theses.length === 0) {
        return <div className="p-8 flex justify-center"><Loading size="lg" text="Memuat data..." /></div>;
    }

    return (
        <div className="space-y-4">
            <CustomTable
                columns={columns}
                data={paginatedTheses}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={filteredTheses.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                searchValue={search}
                onSearchChange={setSearch}
                emptyText="Tidak ada data tugas akhir ditemukan"
                actions={
                    <div className="flex items-center gap-2">
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                        <Button onClick={handleStartCreate} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Data TA
                        </Button>
                    </div>
                }
            />

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{formState.id ? "Edit Data Tugas Akhir" : "Tambah Data Tugas Akhir"}</DialogTitle>
                        <DialogDescription>Isi form di bawah ini untuk mengelola master data tugas akhir.</DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 px-1">
                        <div className="space-y-4 py-4 pr-3">
                            <div className="grid gap-2">
                                <Label>Mahasiswa *</Label>
                                <Select
                                    value={formState.studentId}
                                    onValueChange={(v) => setFormState(prev => ({ ...prev, studentId: v }))}
                                    disabled={!!formState.id} // Disable changing student if editing
                                >
                                    <SelectTrigger><SelectValue placeholder="Pilih mahasiswa..." /></SelectTrigger>
                                    <SelectContent>
                                        {students.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.fullName} ({s.identityNumber})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label>Judul Tugas Akhir</Label>
                                <Input
                                    value={formState.title}
                                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Masukkan judul TA..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Topik</Label>
                                    <Select
                                        value={formState.thesisTopicId}
                                        onValueChange={(v) => setFormState(prev => ({ ...prev, thesisTopicId: v }))}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Pilih topik..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Tanpa Topik --</SelectItem>
                                            {topics.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formState.id && (
                                    <div className="grid gap-2">
                                        <Label>Tahun Ajaran</Label>
                                        <Select
                                            value={formState.academicYearId}
                                            onValueChange={(v) => setFormState(prev => ({ ...prev, academicYearId: v }))}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Pilih tahun ajaran..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">-- Silahkan Pilih --</SelectItem>
                                                {academicYears.map(ay => (
                                                    <SelectItem key={ay.id} value={ay.id}>{ay.year} - {ay.semester}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>

                            {formState.id && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Tanggal Mulai</Label>
                                        <Input
                                            type="date"
                                            value={formState.startDate}
                                            onChange={(e) => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Rating</Label>
                                        <Select
                                            value={formState.rating}
                                            onValueChange={(v) => setFormState(prev => ({ ...prev, rating: v }))}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Pilih rating..." /></SelectTrigger>
                                            <SelectContent>
                                                {ratings.map(r => (
                                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div className="border-t pt-4 mt-4">
                                {formState.id ? (
                                    <>
                                        <div className="flex items-center justify-between mb-2">
                                            <Label className="text-base">Pembimbing</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addSupervisor}>
                                                <Plus className="w-4 h-4 mr-1" /> Tambah
                                            </Button>
                                        </div>
                                        {formState.supervisors.length === 0 ? (
                                            <p className="text-sm text-muted-foreground italic">Belum ada pembimbing.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {formState.supervisors.map((sup, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 bg-muted/30 p-2 rounded-md border">
                                                        <div className="flex-1 grid gap-2">
                                                            <Select
                                                                value={sup.lecturerId}
                                                                onValueChange={(v) => updateSupervisor(idx, "lecturerId", v)}
                                                            >
                                                                <SelectTrigger><SelectValue placeholder="Pilih Dosen..." /></SelectTrigger>
                                                                <SelectContent>
                                                                    {lecturers.map(l => (
                                                                        <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Input
                                                                placeholder="Role ID Pembimbing (UUID)"
                                                                value={sup.roleId}
                                                                onChange={(e) => updateSupervisor(idx, "roleId", e.target.value)}
                                                            />
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="text-destructive mt-1" onClick={() => removeSupervisor(idx)}>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-2">
                                            * Catatan: Role ID UUID dapat diambil dari database / tabel UserRole.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Label className="text-base mb-4 block">Pembimbing</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Pembimbing 1 *</Label>
                                                <Select
                                                    value={formState.pembimbing1}
                                                    onValueChange={(v) => setFormState(prev => ({ ...prev, pembimbing1: v }))}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Pilih pembimbing 1..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Silahkan Pilih --</SelectItem>
                                                        {lecturers.map(l => (
                                                            <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Pembimbing 2 (Opsional)</Label>
                                                <Select
                                                    value={formState.pembimbing2}
                                                    onValueChange={(v) => setFormState(prev => ({ ...prev, pembimbing2: v }))}
                                                >
                                                    <SelectTrigger><SelectValue placeholder="Pilih pembimbing 2..." /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">-- Silahkan Pilih --</SelectItem>
                                                        {lecturers.map(l => (
                                                            <SelectItem key={l.id} value={l.id}>{l.fullName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="mt-4 pt-2 border-t">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isBusy}>
                            {isBusy && <Spinner className="w-4 h-4 mr-2" />} Simpan Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
