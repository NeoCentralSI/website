import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Download, Upload } from "lucide-react";
import { format } from "date-fns";
import * as xlsx from "xlsx";
import { toast } from "sonner";
import { getMasterDataTheses, createMasterDataThesis, updateMasterDataThesis, getMasterDataThesisStatuses, type MasterDataThesis, type SupervisorData } from "@/services/masterDataTa.service";
import { getStudentsAPI, getLecturersAPI, getAcademicYearsAPI } from "@/services/admin.service";
import { getTopics } from "@/services/topic.service";

import CustomTable, { type Column } from "@/components/layout/CustomTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Spinner, Loading } from "@/components/ui/spinner";
import { RefreshButton } from '@/components/ui/refresh-button';
import { ImportMasterDataDialog } from "./ImportMasterDataDialog";
import { Switch } from "@/components/ui/switch";

interface FormState {
    id?: string;
    studentId: string;
    title: string;
    thesisTopicId: string;
    academicYearId: string;
    startDate: string;
    rating: string;
    thesisStatusId: string;
    supervisors: SupervisorData[];
    pembimbing1: string;
    pembimbing2: string;
    isProposal?: boolean;
}

const emptyForm: FormState = {
    studentId: "",
    title: "",
    thesisTopicId: "none",
    academicYearId: "none",
    startDate: "",
    rating: "ONGOING",
    thesisStatusId: "none",
    supervisors: [],
    pembimbing1: "none",
    pembimbing2: "none",
    isProposal: false,
};

const ratings = ["ONGOING", "SLOW", "AT_RISK", "FAILED", "CANCELLED"];

export function DataMasterTaPanel() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [formState, setFormState] = useState<FormState>(emptyForm);

    // Queries
    const { data: theses = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ["master-data-ta"],
        queryFn: getMasterDataTheses,
    });

    const { data: statusesData = [] } = useQuery({ queryKey: ["master-data-ta-statuses"], queryFn: getMasterDataThesisStatuses });

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
            thesisStatusId: thesis.thesisStatusId || "none",
            supervisors: [],
            pembimbing1: thesis.supervisors.find((s) => s.roleName === "Pembimbing 1")?.lecturerId || "none",
            pembimbing2: thesis.supervisors.find((s) => s.roleName === "Pembimbing 2")?.lecturerId || "none",
            isProposal: thesis.isProposal || false,
        });
        setDialogOpen(true);
    };

    const handleToggleProposal = (t: MasterDataThesis, checked: boolean) => {
        const payload = {
            title: t.title,
            thesisTopicId: t.topic?.id,
            academicYearId: t.academicYear?.id,
            startDate: t.startDate,
            rating: t.rating,
            thesisStatusId: t.thesisStatusId,
            pembimbing1: t.supervisors.find((s) => s.roleName === "Pembimbing 1")?.lecturerId,
            pembimbing2: t.supervisors.find((s) => s.roleName === "Pembimbing 2")?.lecturerId,
            isProposal: checked,
        };
        updateMutation.mutate({ id: t.id, data: payload });
    };

    const handleDirectExport = () => {
        setIsExporting(true);
        try {
            const excelData = theses.map((t, index) => ({
                "No": index + 1,
                "NIM": t.student?.nim || "-",
                "Nama Mahasiswa": t.student?.name || "-",
                "Judul Tugas Akhir": t.title || "-",
                "Topik": t.topic?.name || "-",
                "Tahun Ajaran": t.academicYear ? `${t.academicYear.year} - ${t.academicYear.semester}` : "-",
                "Rating": t.rating || "-",
                "Status": t.status || "-",
                "Pembimbing 1": t.supervisors.find(s => s.roleName === "Pembimbing 1")?.name || "-",
                "Pembimbing 2": t.supervisors.find(s => s.roleName === "Pembimbing 2")?.name || "-",
                "Tanggal Mulai": t.startDate ? format(new Date(t.startDate), "dd MMM yyyy") : "-"
            }));

            const worksheet = xlsx.utils.json_to_sheet(excelData);
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, worksheet, "Data TA");

            // Adjust column widths
            worksheet["!cols"] = [
                { wch: 5 }, { wch: 15 }, { wch: 30 }, { wch: 50 }, { wch: 20 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
            ];

            xlsx.writeFile(workbook, `Data_Master_TA_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
            toast.success("Data berhasil dieksport ke Excel");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Gagal mengeksport data");
        } finally {
            setIsExporting(false);
        }
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
            thesisStatusId: formState.id ? formState.thesisStatusId : undefined,
            isProposal: formState.isProposal,
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
            width: 140,
            render: (t) => (
                <div className="min-w-[120px]">
                    <div className="font-semibold truncate">{t.student?.name}</div>
                    <div className="text-sm text-muted-foreground">{t.student?.nim}</div>
                </div>
            )
        },
        {
            key: "title",
            header: "Judul / Topik",
            render: (t) => (
                <div className="min-w-[180px] max-w-[260px]">
                    <div className="line-clamp-2 text-sm">{t.title || "-"}</div>
                    <Badge variant="outline" className="mt-1 text-xs">{t.topic?.name || "Tanpa Topik"}</Badge>
                </div>
            )
        },
        {
            key: "academicYear",
            header: "Periode",
            width: 110,
            className: "whitespace-nowrap",
            render: (t) => (
                <span className="text-sm">
                    {t.academicYear ? `${t.academicYear.year} - ${t.academicYear.semester}` : "-"}
                </span>
            )
        },
        {
            key: "rating",
            header: "Rating",
            width: 90,
            className: "text-center",
            render: (t) => {
                const colors: Record<string, string> = {
                    "ONGOING": "bg-blue-500",
                    "SLOW": "bg-yellow-500",
                    "AT_RISK": "bg-orange-500",
                    "FAILED": "bg-red-500 text-white",
                    "CANCELLED": "bg-gray-500",
                };
                return <Badge className={`${colors[t.rating] || "bg-primary"} text-xs`}>{t.rating}</Badge>;
            }
        },
        {
            key: "status",
            header: "Status",
            width: 90,
            className: "text-center",
            render: (t) => {
                const colors: Record<string, string> = {
                    "Aktif": "bg-green-500",
                    "Selesai": "bg-blue-600",
                    "Dibatalkan": "bg-red-600 text-white",
                    "Lulus": "bg-blue-600",
                };
                return <Badge className={`${colors[t.status] || "bg-primary"} text-xs`}>{t.status}</Badge>;
            }
        },
        {
            key: "supervisors",
            header: "Pembimbing",
            width: 180,
            render: (t) => (
                <div className="flex flex-col gap-0.5 text-xs min-w-[140px] max-w-[180px]">
                    {t.supervisors.map((s, i) => (
                        <span key={i} className="truncate">• {s.name || s.lecturerId}</span>
                    ))}
                    {t.supervisors.length === 0 && <span className="text-muted-foreground">-</span>}
                </div>
            )
        },
        {
            key: "isProposal",
            header: "Proposal",
            width: 70,
            className: "text-center",
            render: (t) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={!!t.isProposal}
                        onCheckedChange={(checked) => handleToggleProposal(t, checked)}
                        disabled={updateMutation.isPending}
                    />
                </div>
            )
        },
        {
            key: "actions",
            header: "",
            width: 48,
            render: (t) => (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(t)}>
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
                        <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" /> Import Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDirectExport} disabled={isExporting}>
                            {isExporting ? <Spinner className="size-4 mr-2" /> : <Download className="mr-2 h-4 w-4" />} Export Excel
                        </Button>
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

                    <div className="flex-1 overflow-y-auto px-1">
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

                                {formState.id && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label>Tanggal Mulai</Label>
                                            <DatePicker
                                                value={formState.startDate ? new Date(formState.startDate) : undefined}
                                                onChange={(date) => setFormState(prev => ({ ...prev, startDate: date ? date.toISOString().split('T')[0] : "" }))}
                                                showPastDates={true}
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
                                        <div className="grid gap-2">
                                            <Label>Status Tugas Akhir</Label>
                                            <Select
                                                value={formState.thesisStatusId}
                                                onValueChange={(v) => setFormState(prev => ({ ...prev, thesisStatusId: v }))}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                                                <SelectContent>
                                                    {statusesData.map(s => (
                                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                <div className="grid gap-2 col-span-2">
                                    <div className="flex items-center space-x-2 mt-2">
                                        <Switch
                                            id="isProposal"
                                            checked={!!formState.isProposal}
                                            onCheckedChange={(v) => setFormState(prev => ({ ...prev, isProposal: v }))}
                                        />
                                        <Label htmlFor="isProposal">Status Proposal (Aktif = Masih Proposal)</Label>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
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
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-4 pt-2 border-t">
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isBusy}>
                            {isBusy && <Spinner className="w-4 h-4 mr-2" />} Simpan Data
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            <ImportMasterDataDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
            />
        </div>
    );
}
