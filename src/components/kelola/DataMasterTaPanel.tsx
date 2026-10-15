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
import { ThesisActivityBadge } from "@/components/shared/ThesisActivityBadge";
import { SearchableCombobox, type ComboboxOption } from "@/components/shared/SearchableCombobox";
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

// Two lines high, so a short hint and a long one keep the two columns level.
const FIELD_HINT_CLASS = "min-h-8 text-xs text-muted-foreground";
const NO_LECTURER_OPTION: ComboboxOption = { value: "none", label: "-- Silahkan Pilih --" };
// The full BSS label is too long for a one-line hint.
const SHORT_STATUS_LABELS: Partial<Record<ThesisLifecycleStatus, string>> = { on_leave: "BSS" };

/** "A", "A atau B", "A, B, atau C". */
function joinWithOr(items: string[]): string {
    if (items.length <= 2) return items.join(" atau ");
    return `${items.slice(0, -1).join(", ")}, atau ${items[items.length - 1]}`;
}

/** Always-present hint under the status field, so the row keeps its height. */
function getStatusHint(original: ThesisLifecycleStatus | null, statusBeforeLeave: ThesisLifecycleStatus | null): string {
    if (!original) return "Status awal tugas akhir yang didata.";
    if (isClosedStatus(original)) return `Tugas akhir berstatus "${THESIS_STATUS_LABELS[original]}" tidak dapat diubah lagi.`;
    if (original === "on_leave") return "Dari BSS, tugas akhir hanya dapat kembali ke status sebelumnya atau dihentikan.";
    const targets = getAllowedThesisStatusOptions(original, statusBeforeLeave)
        .filter((option) => option.value !== original)
        .map((option) => SHORT_STATUS_LABELS[option.value] ?? option.label);
    return `Dapat diubah menjadi ${joinWithOr(targets)}.`;
}

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

    const students = studentsData?.students;
    const lecturers = lecturersData?.lecturers;
    const academicYears = academicYearsData?.academicYears || [];

    const studentOptions = useMemo<ComboboxOption[]>(
        () => (students ?? []).map((s) => ({
            value: s.id,
            label: s.identityNumber ? `${s.fullName} (${s.identityNumber})` : s.fullName,
        })),
        [students],
    );
    const lecturerOptions = useMemo<ComboboxOption[]>(
        () => [
            NO_LECTURER_OPTION,
            ...(lecturers ?? []).map((l) => ({
                value: l.id,
                label: l.fullName,
                keywords: l.identityNumber ? [l.identityNumber] : undefined,
            })),
        ],
        [lecturers],
    );

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

    // While editing, the student cannot change: show them even before the student list loads.
    const editedStudent = formState.id ? theses.find((t) => t.id === formState.id)?.student : undefined;
    const editedStudentLabel = editedStudent ? `${editedStudent.name} (${editedStudent.nim})` : undefined;

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

        // The activity level is derived and never sent; supervisors of a closed
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
            // Read-only: derived from the last activity date (only for a research thesis).
            key: "activity",
            header: "Aktivitas",
            width: 90,
            className: "text-center",
            render: (t) => <ThesisActivityBadge level={t.activityLevel} className="text-xs" />
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
                onSearchChange={(value) => {
                    setSearch(value);
                    setPage(1);
                }}
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
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle>{formState.id ? "Edit Data Tugas Akhir" : "Tambah Data Tugas Akhir"}</DialogTitle>
                        <DialogDescription>Isi form di bawah ini untuk mengelola master data tugas akhir.</DialogDescription>
                    </DialogHeader>

                    <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-1">
                        <div className="space-y-4 py-4 pr-3">
                            <div className="grid min-w-0 gap-2">
                                <Label>Mahasiswa *</Label>
                                <SearchableCombobox
                                    ariaLabel="Pilih mahasiswa"
                                    options={studentOptions}
                                    value={formState.studentId}
                                    onChange={(v) => setFormState(prev => ({ ...prev, studentId: v }))}
                                    disabled={!!formState.id} // Disable changing student if editing
                                    placeholder="Pilih mahasiswa..."
                                    searchPlaceholder="Cari nama atau NIM..."
                                    emptyText="Mahasiswa tidak ditemukan."
                                    fallbackLabel={editedStudentLabel}
                                />
                            </div>

                            <div className="grid min-w-0 gap-2">
                                <Label>Judul Tugas Akhir</Label>
                                <Input
                                    value={formState.title}
                                    onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="Masukkan judul TA..."
                                />
                            </div>

                            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                <div className="grid min-w-0 content-start gap-2">
                                    <Label>Topik</Label>
                                    <Select
                                        value={formState.thesisTopicId}
                                        onValueChange={(v) => setFormState(prev => ({ ...prev, thesisTopicId: v }))}
                                    >
                                        <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Pilih topik..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Tanpa Topik --</SelectItem>
                                            {topics.map(t => (
                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formState.id && (
                                    <div className="grid min-w-0 content-start gap-2">
                                        <Label>Tahun Ajaran</Label>
                                        <Select
                                            value={formState.academicYearId}
                                            onValueChange={(v) => setFormState(prev => ({ ...prev, academicYearId: v }))}
                                        >
                                            <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Pilih tahun ajaran..." /></SelectTrigger>
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
                                    <div className="grid min-w-0 content-start gap-2">
                                        <Label>Tanggal Mulai</Label>
                                        <DatePicker
                                            value={formState.startDate ? new Date(formState.startDate) : undefined}
                                            onChange={(date) => setFormState(prev => ({ ...prev, startDate: date ? date.toISOString().split('T')[0] : "" }))}
                                            showPastDates={true}
                                        />
                                        <p className={FIELD_HINT_CLASS}>
                                            Masa bimbingan dihitung dari tanggal ini (masa BSS tidak dihitung).
                                        </p>
                                    </div>
                                )}

                                <div className="grid min-w-0 content-start gap-2">
                                    <Label>Status Tugas Akhir</Label>
                                    <Select
                                        value={formState.status}
                                        onValueChange={(v) => setFormState(prev => ({ ...prev, status: v as ThesisLifecycleStatus }))}
                                        disabled={isClosedStatus(formState.originalStatus)}
                                    >
                                        <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                                        <SelectContent>
                                            {getAllowedThesisStatusOptions(formState.originalStatus, formState.statusBeforeLeave).map(s => (
                                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className={FIELD_HINT_CLASS}>
                                        {getStatusHint(formState.originalStatus, formState.statusBeforeLeave)}
                                    </p>
                                </div>

                                {formState.status === "failed" && formState.originalStatus !== "failed" && (
                                    <div className="grid gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 sm:col-span-2">
                                        <Alert variant="destructive" className="border-0 bg-transparent p-0">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle>Hentikan tugas akhir</AlertTitle>
                                            <AlertDescription>
                                                Semua pembimbing aktif akan dilepas dan sesi bimbingan yang masih terbuka dibatalkan. Status Gagal tidak dapat diubah lagi.
                                            </AlertDescription>
                                        </Alert>
                                        <div className="grid min-w-0 gap-2">
                                            <Label>Alasan penghentian *</Label>
                                            <Select
                                                value={formState.terminationReason}
                                                onValueChange={(v) => setFormState(prev => ({ ...prev, terminationReason: v as ThesisTerminationReason }))}
                                            >
                                                <SelectTrigger className="w-full min-w-0"><SelectValue placeholder="Pilih alasan..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none" disabled>-- Pilih alasan --</SelectItem>
                                                    {terminationReasonOptions.map(r => (
                                                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid min-w-0 gap-2">
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
                                <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                    <div className="grid min-w-0 content-start gap-2">
                                        <Label>Pembimbing 1 *</Label>
                                        <SearchableCombobox
                                            ariaLabel="Pilih pembimbing 1"
                                            options={lecturerOptions}
                                            value={formState.pembimbing1}
                                            onChange={(v) => setFormState(prev => ({ ...prev, pembimbing1: v }))}
                                            disabled={isClosedStatus(formState.originalStatus)}
                                            placeholder="Pilih pembimbing 1..."
                                            searchPlaceholder="Cari nama atau NIP..."
                                            emptyText="Dosen tidak ditemukan."
                                        />
                                    </div>
                                    <div className="grid min-w-0 content-start gap-2">
                                        <Label>Pembimbing 2 (Opsional)</Label>
                                        <SearchableCombobox
                                            ariaLabel="Pilih pembimbing 2"
                                            options={lecturerOptions}
                                            value={formState.pembimbing2}
                                            onChange={(v) => setFormState(prev => ({ ...prev, pembimbing2: v }))}
                                            disabled={isClosedStatus(formState.originalStatus)}
                                            placeholder="Pilih pembimbing 2..."
                                            searchPlaceholder="Cari nama atau NIP..."
                                            emptyText="Dosen tidak ditemukan."
                                        />
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
