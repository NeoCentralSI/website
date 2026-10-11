import { useCallback, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Download, AlertCircle, RotateCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { getMasterDataTheses, createMasterDataThesis, updateMasterDataThesis, type MasterDataThesis, type SupervisorData } from "@/services/masterDataTa.service";
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
import { ExportExcelDialog } from "./ExportExcelDialog";
import { ImportMasterDataDialog } from "./ImportMasterDataDialog";
import { Upload } from "lucide-react";
import { ThesisStatusBadge } from "@/components/shared/ThesisStatusBadge";
import { ThesisRatingBadge } from "@/components/shared/ThesisRatingBadge";
import {
    getAllowedThesisStatusOptions,
    getTerminationReasonOptions,
    THESIS_STATUS_LABELS,
    type ThesisLifecycleStatus,
    type ThesisTerminationReason,
} from "@/lib/thesisLabels";
import { Textarea } from "@/components/ui/textarea";

interface FormState {
    id?: string;
    studentId: string;
    title: string;
    thesisTopicId: string;
    academicYearId: string;
    startDate: string;
    rating: string | null;
    status: ThesisLifecycleStatus;
    /** Status when the dialog opened (null = new thesis); K21 transitions start from here. */
    originalStatus: ThesisLifecycleStatus | null;
    statusBeforeLeave: ThesisLifecycleStatus | null;
    terminationReason: ThesisTerminationReason | "none";
    terminationNote: string;
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
    rating: null,
    status: "research",
    originalStatus: null,
    statusBeforeLeave: null,
    terminationReason: "none",
    terminationNote: "",
    supervisors: [],
    pembimbing1: "none",
    pembimbing2: "none",
};

const terminationReasonOptions = getTerminationReasonOptions();
const isClosedStatus = (s: ThesisLifecycleStatus | null) => s === "completed" || s === "failed";

export function DataMasterTaPanel() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [formState, setFormState] = useState<FormState>(emptyForm);

    // Queries
    const { data: theses = [], isLoading, isFetching, isError, error, refetch } = useQuery({
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

    const handleStartEdit = useCallback((thesis: MasterDataThesis) => {
        setFormState({
            id: thesis.id,
            studentId: thesis.student?.id || "",
            title: thesis.title || "",
            thesisTopicId: thesis.topic?.id || "none",
            academicYearId: thesis.academicYear?.id || "none",
            startDate: thesis.startDate ? new Date(thesis.startDate).toISOString().split('T')[0] : "",
            rating: thesis.rating ?? null,
            status: thesis.status,
            originalStatus: thesis.status,
            statusBeforeLeave: thesis.statusBeforeLeave ?? null,
            terminationReason: thesis.terminationReason ?? "none",
            terminationNote: thesis.terminationNote ?? "",
            supervisors: [],
            pembimbing1: thesis.supervisors.find((s) => s.roleName === "Pembimbing 1")?.lecturerId || "none",
            pembimbing2: thesis.supervisors.find((s) => s.roleName === "Pembimbing 2")?.lecturerId || "none",
        });
        setDialogOpen(true);
    }, []);

    const handleSubmit = () => {
        if (!formState.studentId) {
            toast.error("Mahasiswa harus dipilih");
            return;
        }

        if (!formState.id && formState.pembimbing1 === "none") {
            toast.error("Pembimbing 1 harus dipilih");
            return;
        }
        if (formState.pembimbing1 !== "none" && formState.pembimbing1 === formState.pembimbing2) {
            toast.error("Pembimbing 1 dan Pembimbing 2 harus dosen yang berbeda");
            return;
        }
        const becomesFailed = formState.status === "failed" && formState.originalStatus !== "failed";
        if (becomesFailed && formState.terminationReason === "none") {
            toast.error("Alasan penghentian wajib dipilih untuk status Gagal");
            return;
        }

        // K21: rating is never sent (computed by the rating job); supervisors of a closed
        // thesis are not editable; status is sent only when it changes.
        const closed = isClosedStatus(formState.originalStatus);
        const payload: Record<string, unknown> = {
            title: formState.title || null,
            thesisTopicId: formState.thesisTopicId !== "none" ? formState.thesisTopicId : null,
            ...(formState.id
                ? {
                    startDate: formState.startDate ? new Date(formState.startDate).toISOString() : null,
                    academicYearId: formState.academicYearId !== "none" ? formState.academicYearId : null,
                }
                : { studentId: formState.studentId }),
            ...(!closed
                ? {
                    pembimbing1: formState.pembimbing1 !== "none" ? formState.pembimbing1 : undefined,
                    pembimbing2: formState.pembimbing2 !== "none" ? formState.pembimbing2 : "none",
                }
                : {}),
            ...(formState.status !== formState.originalStatus ? { status: formState.status } : {}),
            ...(becomesFailed
                ? { terminationReason: formState.terminationReason, terminationNote: formState.terminationNote.trim() || null }
                : {}),
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
                    <Badge
                        variant="outline"
                        className="mt-1 max-w-full overflow-hidden text-xs"
                        title={t.topic?.name || "Tanpa Topik"}
                    >
                        <span className="min-w-0 truncate">
                            {t.topic?.name || "Tanpa Topik"}
                        </span>
                    </Badge>
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
                if (!t.rating || t.status === "completed") {
                    return <span className="text-muted-foreground text-xs font-mono">-</span>;
                }
                return <ThesisRatingBadge rating={t.rating} className="text-xs" />;
            }
        },
        {
            key: "status",
            header: "Status",
            width: 90,
            className: "text-center",
            render: (t) => <ThesisStatusBadge status={t.status} className="text-xs" />
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
            key: "actions",
            header: "",
            width: 48,
            render: (t) => (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStartEdit(t)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            )
        }
    ], [handleStartEdit]);

    if (isLoading && theses.length === 0) {
        return <div className="p-8 flex justify-center"><Loading size="lg" text="Memuat data..." /></div>;
    }

    // A failed GET /master-data-ta must not look like an empty table.
    if (isError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Gagal memuat data master tugas akhir</AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span>{(error as Error)?.message || "Terjadi kesalahan saat memuat data."}</span>
                    <Button size="sm" variant="outline" onClick={() => void refetch()}>
                        <RotateCw className="mr-2 h-4 w-4" />
                        Coba lagi
                    </Button>
                </AlertDescription>
            </Alert>
        );
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
                        <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                            <Download className="mr-2 h-4 w-4" /> Export Excel
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
                                            {/* K21: rating is computed by the rating job, shown only */}
                                            <div className="flex h-9 items-center gap-2">
                                                {formState.rating ? (
                                                    <ThesisRatingBadge rating={formState.rating} />
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">-</span>
                                                )}
                                                <span className="text-xs text-muted-foreground">dihitung otomatis</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="grid gap-2">
                                    <Label>Status Tugas Akhir</Label>
                                    <Select
                                        value={formState.status}
                                        onValueChange={(v) => setFormState(prev => ({ ...prev, status: v as ThesisLifecycleStatus }))}
                                        disabled={isClosedStatus(formState.originalStatus)}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                                        <SelectContent>
                                            {getAllowedThesisStatusOptions(formState.originalStatus, formState.statusBeforeLeave).map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {isClosedStatus(formState.originalStatus) && (
                                        <p className="text-xs text-muted-foreground">
                                            Tugas akhir berstatus "{THESIS_STATUS_LABELS[formState.originalStatus as ThesisLifecycleStatus]}" tidak dapat diubah lagi.
                                        </p>
                                    )}
                                    {formState.originalStatus === "on_leave" && (
                                        <p className="text-xs text-muted-foreground">
                                            Dari BSS, tugas akhir hanya dapat kembali ke status sebelumnya atau dihentikan.
                                        </p>
                                    )}
                                </div>

                                {formState.status === "failed" && formState.originalStatus !== "failed" && (
                                    <div className="col-span-2 grid gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                                        <Alert variant="destructive" className="border-0 bg-transparent p-0">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Hentikan tugas akhir</AlertTitle>
                                            <AlertDescription>
                                                Semua pembimbing aktif akan dilepas dan sesi bimbingan yang masih terbuka dibatalkan. Status Gagal tidak dapat diubah lagi.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="grid gap-2">
                                            <Label>Alasan penghentian *</Label>
                                            <Select
                                                value={formState.terminationReason}
                                                onValueChange={(v) => setFormState(prev => ({ ...prev, terminationReason: v as ThesisTerminationReason }))}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Pilih alasan..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" disabled>-- Pilih alasan --</SelectItem>
                                                    {terminationReasonOptions.map(r => (
                                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Catatan (opsional)</Label>
                                            <Textarea
                                                value={formState.terminationNote}
                                                onChange={(e) => setFormState(prev => ({ ...prev, terminationNote: e.target.value }))}
                                                maxLength={2000}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <Label className="text-base mb-4 block">Pembimbing</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Pembimbing 1 *</Label>
                                        <Select
                                            value={formState.pembimbing1}
                                            onValueChange={(v) => setFormState(prev => ({ ...prev, pembimbing1: v }))}
                                            disabled={isClosedStatus(formState.originalStatus)}
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
                                            disabled={isClosedStatus(formState.originalStatus)}
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

            <ExportExcelDialog
                open={exportDialogOpen}
                onOpenChange={setExportDialogOpen}
                theses={theses}
                academicYears={academicYears.map((year) => ({
                    ...year,
                    year: String(year.year),
                }))}
            />
            <ImportMasterDataDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
            />
        </div>
    );
}
