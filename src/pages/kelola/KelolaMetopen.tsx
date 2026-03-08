import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { TabsNav, type TabItem } from "@/components/ui/tabs-nav";
import {
    FileText, Users, BarChart3, Plus, Pencil, Trash2,
    CheckCircle2, AlertCircle, Search,
    Send, Eye, Paperclip, Upload, X,
    Rocket, Calendar, Clock, Info,
    Download, MessageSquare, RefreshCw, ChevronDown,
} from "lucide-react";
import { getApiUrl } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    useMetopenTemplates, useCreateMetopenTemplate, useUpdateMetopenTemplate,
    useDeleteMetopenTemplate,
    useUploadTemplateAttachment, useDeleteTemplateAttachment,
    useMetopenGradingQueue, useGradeMetopenMilestone,
    useMetopenMonitoring,
    useMetopenPublishStats,
    useUpdateMetopenPublishDeadline,
    useDeleteMetopenPublishedTasks,
} from "@/hooks/metopen/useMetopen";
import {
    useMetopenClasses,
    usePublishToClass,
    useAutoSyncMetopenClass,
    useMetopenAcademicYears,
} from "@/hooks/metopen/useMetopenClass";
import type {
    MetopenTemplate, CreateTemplateDto, UpdateTemplateDto,
    GradingQueueItem, MetopenMilestoneStatus,
    PublishStatItem,
    AcademicYear,
} from "@/types/metopen.types";
import { METOPEN_STATUS_CONFIG } from "@/types/metopen.types";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";

// Utility to build file download URL from filePath stored in DB
function buildFileUrl(filePath: string | null | undefined): string | null {
    if (!filePath) return null;
    if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
    if (filePath.startsWith("/uploads/") || filePath.startsWith("uploads/")) {
        return getApiUrl(`/${filePath.replace(/^\//, "")}`);
    }
    return getApiUrl(`/uploads/${filePath}`);
}

import { format } from "date-fns";

// ==================== Tab Configuration ====================

const TAB_ITEMS: TabItem[] = [
    { label: "Mahasiswa", to: "/kelola/metopen/mahasiswa" },
    { label: "Bank Template", to: "/kelola/metopen/template" },
    { label: "Publish Tugas", to: "/kelola/metopen/publish" },
    { label: "Antrian Penilaian", to: "/kelola/metopen/penilaian" },
    { label: "Monitoring", to: "/kelola/metopen/monitoring" },
];

// ==================== Template Form ====================

interface TemplateFormState {
    name: string;
    description: string;
    isActive: boolean;
    isGateToAdvisorSearch: boolean;
    weightPercentage: number | null;
}

const emptyForm: TemplateFormState = {
    name: "",
    description: "",
    isActive: true,
    isGateToAdvisorSearch: false,
    weightPercentage: null,
};

// ==================== Main Page ====================

export default function KelolaMetopen() {
    const { setTitle, setBreadcrumbs } = useOutletContext<LayoutContext>();
    const location = useLocation();

    const activeTab = useMemo(() => {
        return TAB_ITEMS.find((tab) => location.pathname.startsWith(tab.to)) || TAB_ITEMS[0];
    }, [location.pathname]);

    const breadcrumbs = useMemo(
        () => [
            { label: "Kelola", href: "/kelola" },
            { label: "Metode Penelitian", href: "/kelola/metopen" },
            { label: activeTab.label },
        ],
        [activeTab.label]
    );

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(activeTab.label);
    }, [activeTab.label, breadcrumbs, setBreadcrumbs, setTitle]);

    const renderContent = () => {
        switch (activeTab.label) {
            case "Mahasiswa":
                return <StudentsPanel />;
            case "Bank Template":
                return <TemplatePanel />;
            case "Publish Tugas":
                return <PublishPanel />;
            case "Antrian Penilaian":
                return <GradingPanel />;
            case "Monitoring":
                return <MonitoringPanel />;
            default:
                return null;
        }
    };

    return (
        <div className="p-4 space-y-4">
            <TabsNav tabs={TAB_ITEMS} />
            {renderContent()}
        </div>
    );
}

// ==================== Template Panel ====================

function TemplatePanel() {
    const { data: templates, isLoading } = useMetopenTemplates();
    const createMutation = useCreateMetopenTemplate();
    const updateMutation = useUpdateMetopenTemplate();
    const deleteMutation = useDeleteMetopenTemplate();
    const uploadAttachment = useUploadTemplateAttachment();
    const deleteAttachmentMutation = useDeleteTemplateAttachment();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<TemplateFormState>(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState<MetopenTemplate | null>(null);
    const [search, setSearch] = useState("");
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const filtered = useMemo(() => {
        if (!templates) return [];
        if (!search) return templates;
        const q = search.toLowerCase();
        return templates.filter(
            (t) => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
        );
    }, [templates, search]);

    const stats = useMemo(() => {
        if (!templates) return { total: 0, active: 0, gates: 0 };
        return {
            total: templates.length,
            active: templates.filter((t) => t.isActive).length,
            gates: templates.filter((t) => t.isGateToAdvisorSearch).length,
        };
    }, [templates]);

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setPendingFiles([]);
        setDialogOpen(true);
    };

    const openEdit = (t: MetopenTemplate) => {
        setEditingId(t.id);
        setForm({
            name: t.name,
            description: t.description || "",
            isActive: t.isActive,
            isGateToAdvisorSearch: t.isGateToAdvisorSearch,
            weightPercentage: t.weightPercentage,
        });
        setPendingFiles([]);
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) {
            toast.error("Nama template wajib diisi");
            return;
        }
        try {
            if (editingId) {
                const data: UpdateTemplateDto = {
                    name: form.name,
                    description: form.description || undefined,
                    isActive: form.isActive,
                    isGateToAdvisorSearch: form.isGateToAdvisorSearch,
                    weightPercentage: form.weightPercentage ?? undefined,
                };
                await updateMutation.mutateAsync({ id: editingId, data });
                setDialogOpen(false);
            } else {
                const data: CreateTemplateDto = {
                    name: form.name,
                    description: form.description || undefined,
                    isActive: form.isActive,
                    isGateToAdvisorSearch: form.isGateToAdvisorSearch,
                    weightPercentage: form.weightPercentage ?? undefined,
                };
                const created = await createMutation.mutateAsync(data);

                // Upload pending files to the newly created template
                if (pendingFiles.length > 0 && created?.id) {
                    for (const file of pendingFiles) {
                        try {
                            await uploadAttachment.mutateAsync({ templateId: created.id, file });
                        } catch {
                            // individual upload failure already shows toast from hook
                        }
                    }
                }
                setPendingFiles([]);
                setDialogOpen(false);
            }
        } catch {
            // handled by hook
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
        } catch {
            // handled by hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="border-blue-100 bg-blue-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Template</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-100 bg-green-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Aktif</p>
                            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-orange-100 bg-orange-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Gate Milestone</p>
                            <p className="text-2xl font-bold text-orange-700">{stats.gates}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari template..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button onClick={openCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tambah Template
                </Button>
            </div>

            {/* Template Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium text-muted-foreground w-10">#</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Nama Template</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Deadline</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Bobot</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Gate</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        {search ? "Tidak ada template yang cocok" : "Belum ada template"}
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t, idx) => (
                                    <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                        <td className="p-3">
                                            <div>
                                                <p className="font-medium">{t.name}</p>
                                                {t.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {t.defaultDueDays ? `${t.defaultDueDays} hari` : "—"}
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {t.weightPercentage != null ? `${t.weightPercentage}%` : "—"}
                                        </td>
                                        <td className="p-3 text-center">
                                            {t.isGateToAdvisorSearch ? (
                                                <Badge variant="destructive" className="text-xs">Gate</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant={t.isActive ? "default" : "secondary"} className="text-xs">
                                                {t.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={() => openEdit(t)} className="h-8 w-8">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(t)} className="h-8 w-8 text-destructive hover:text-destructive">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Template" : "Tambah Template"}</DialogTitle>
                        <DialogDescription>
                            {editingId ? "Perbarui informasi template milestone metopen." : "Buat template milestone baru untuk metopen."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Template *</Label>
                            <Input id="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Mis: Judul & Latar Belakang" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Deskripsi</Label>
                            <Textarea id="desc" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi tugas..." rows={3} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="weight">Bobot (%)</Label>
                            <Input id="weight" type="number" min={0} max={100} value={form.weightPercentage ?? ""} onChange={(e) => setForm((p) => ({ ...p, weightPercentage: e.target.value ? Number(e.target.value) : null }))} placeholder="20" />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label className="text-sm font-medium">Gate to Advisor Search</Label>
                                <p className="text-xs text-muted-foreground">Mahasiswa harus menyelesaikan tugas ini sebelum mencari pembimbing</p>
                            </div>
                            <Switch checked={form.isGateToAdvisorSearch} onCheckedChange={(v) => setForm((p) => ({ ...p, isGateToAdvisorSearch: v }))} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <Label className="text-sm font-medium">Status Aktif</Label>
                                <p className="text-xs text-muted-foreground">Template aktif dapat di-publish ke mahasiswa</p>
                            </div>
                            <Switch checked={form.isActive} onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))} />
                        </div>

                        {/* Attachment Section — available in both create and edit */}
                        {(() => {
                            const isEditMode = !!editingId;
                            const editingTemplate = isEditMode ? templates?.find(t => t.id === editingId) : null;
                            const existingAttachments = editingTemplate?.attachments || [];

                            return (
                                <div className="space-y-3 rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                                            <Label className="text-sm font-medium">Lampiran Dokumen</Label>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadAttachment.isPending}
                                        >
                                            {uploadAttachment.isPending ? (
                                                <Spinner className="mr-1 h-3 w-3" />
                                            ) : (
                                                <Upload className="mr-1 h-3 w-3" />
                                            )}
                                            Upload
                                        </Button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
                                                if (file.size > MAX_SIZE) {
                                                    toast.error(`File terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimal 100 MB.`);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                    return;
                                                }
                                                if (isEditMode && editingId) {
                                                    // Edit mode: upload immediately
                                                    uploadAttachment.mutate({ templateId: editingId, file });
                                                } else {
                                                    // Create mode: queue file
                                                    setPendingFiles(prev => [...prev, file]);
                                                }
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                                        />
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        Format: PDF, Word, Excel, PowerPoint, TXT, ZIP, RAR — Maks. 100 MB/file
                                    </p>

                                    {/* Show existing attachments (edit mode) */}
                                    {existingAttachments.length > 0 && (
                                        <div className="space-y-2">
                                            {existingAttachments.map((att) => (
                                                <div
                                                    key={att.id}
                                                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                        <span className="text-sm truncate">
                                                            {att.document?.fileName || 'Dokumen'}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() => deleteAttachmentMutation.mutate({ templateId: editingId!, attachmentId: att.id })}
                                                        disabled={deleteAttachmentMutation.isPending}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Show pending files (create mode) */}
                                    {pendingFiles.length > 0 && (
                                        <div className="space-y-2">
                                            {pendingFiles.map((file, idx) => (
                                                <div
                                                    key={`pending-${idx}`}
                                                    className="flex items-center justify-between rounded-md bg-blue-50 dark:bg-blue-950/30 px-3 py-2"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                                                        <span className="text-sm truncate">{file.name}</span>
                                                        <Badge variant="outline" className="text-[10px] shrink-0">Baru</Badge>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                                        onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {existingAttachments.length === 0 && pendingFiles.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            Belum ada lampiran. Upload file untuk menambahkan.
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                            {(createMutation.isPending || updateMutation.isPending) && <Spinner className="mr-2 h-4 w-4" />}
                            {editingId ? "Simpan" : "Buat Template"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus template "{deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleteMutation.isPending ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ==================== Students Panel ====================

function StudentsPanel() {
    const { data: academicYears, isLoading: loadingYears } = useMetopenAcademicYears();
    const syncMutation = useAutoSyncMetopenClass();
    const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

    // Determine active year ID once years are loaded
    const activeYearId = useMemo(
        () => academicYears?.find((y: AcademicYear) => y.isActive)?.id ?? null,
        [academicYears]
    );

    const [selectedYearId, setSelectedYearId] = useState<string | null>(null);

    // Auto-select active year on first load
    useEffect(() => {
        if (activeYearId && selectedYearId === null) {
            setSelectedYearId(activeYearId);
        }
    }, [activeYearId, selectedYearId]);

    const isActiveYear = selectedYearId === activeYearId;

    // Fetch classes for selected year to get enrolled students
    const { data: classes, isLoading: loadingClasses } = useMetopenClasses(
        selectedYearId ?? undefined
    );

    const [search, setSearch] = useState("");

    // Collect all enrolled students from the class(es) of the selected year
    const students = useMemo(() => {
        if (!classes || classes.length === 0) return [];
        const seen = new Set<string>();
        const list: Array<{ studentId: string; studentName: string; studentNim: string; className: string }> = [];
        for (const cls of classes) {
            if (!cls.enrollments) continue;
            for (const e of cls.enrollments) {
                if (!e.student || seen.has(e.studentId)) continue;
                seen.add(e.studentId);
                list.push({
                    studentId: e.studentId,
                    studentName: e.student.user?.fullName ?? "—",
                    studentNim: e.student.user?.identityNumber ?? "—",
                    className: cls.name,
                });
            }
        }
        return list;
    }, [classes]);

    const filtered = useMemo(() => {
        if (!search.trim()) return students;
        const q = search.toLowerCase();
        return students.filter(
            (s) =>
                s.studentName.toLowerCase().includes(q) ||
                s.studentNim.toLowerCase().includes(q) ||
                s.className.toLowerCase().includes(q)
        );
    }, [students, search]);

    const classExists = (classes?.length ?? 0) > 0;

    const handleSync = async () => {
        try {
            const result = await syncMutation.mutateAsync();
            setLastSyncedAt(result.syncedAt);
        } catch {
            // handled by hook
        }
    };

    const selectedYear = useMemo(
        () => academicYears?.find((y: AcademicYear) => y.id === selectedYearId),
        [academicYears, selectedYearId]
    );

    const semLabel = (year: AcademicYear) =>
        `${year.semester === "genap" ? "Genap" : "Ganjil"} ${year.year}${year.isActive ? " (Aktif)" : ""}`;

    if (loadingYears) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header: year selector + sync button */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Select
                            value={selectedYearId ?? ""}
                            onValueChange={(v) => { setSelectedYearId(v); setSearch(""); }}
                        >
                            <SelectTrigger className="w-[220px]">
                                <SelectValue placeholder="Pilih semester..." />
                            </SelectTrigger>
                            <SelectContent>
                                {(academicYears ?? []).map((y: AcademicYear) => (
                                    <SelectItem key={y.id} value={y.id}>{semLabel(y)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {selectedYear && (
                        <Badge variant={isActiveYear ? "default" : "secondary"} className="text-xs">
                            {isActiveYear ? "Semester Berjalan" : "Riwayat"}
                        </Badge>
                    )}
                </div>

                {/* Sync button — only for active semester */}
                {isActiveYear && (
                    <Button
                        onClick={handleSync}
                        disabled={syncMutation.isPending}
                        variant="outline"
                        className="gap-2"
                    >
                        {syncMutation.isPending
                            ? <Spinner className="h-4 w-4" />
                            : <RefreshCw className="h-4 w-4" />
                        }
                        Sync dari SIA
                    </Button>
                )}
            </div>

            {/* Context banner */}
            {isActiveYear ? (
                classExists ? (
                    <Card className="border-green-200 bg-green-50/50">
                        <CardContent className="p-4 flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-green-800">
                                    Kelas semester ini sudah tersinkron
                                </p>
                                <p className="text-sm text-green-600 mt-0.5">
                                    {students.length} mahasiswa terdaftar.
                                    {lastSyncedAt && ` Terakhir disync: ${new Date(lastSyncedAt).toLocaleString("id-ID")}.`}
                                    {" "}Klik "Sync dari SIA" untuk memperbarui data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="p-4 flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-amber-800">Belum ada data kelas</p>
                                <p className="text-sm text-amber-600 mt-0.5">
                                    Klik "Sync dari SIA" untuk membuat kelas dan mendaftarkan mahasiswa semester ini secara otomatis.
                                    Data mahasiswa diambil dari sistem informasi akademik.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )
            ) : (
                <Card className="border-blue-100 bg-blue-50/30">
                    <CardContent className="p-4 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700">
                            Menampilkan data mahasiswa semester{" "}
                            <strong>{selectedYear ? semLabel(selectedYear) : ""}</strong>.
                            Data riwayat bersifat read-only.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Search + count */}
            {classExists && (
                <>
                    <div className="flex items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari nama atau NIM..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Badge variant="outline" className="text-sm shrink-0">
                            {filtered.length} mahasiswa
                        </Badge>
                    </div>

                    <Card>
                        {loadingClasses ? (
                            <CardContent className="flex justify-center py-12">
                                <Spinner className="h-6 w-6" />
                            </CardContent>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 font-medium text-muted-foreground w-10">#</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Nama</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">NIM</th>
                                            <th className="text-left p-3 font-medium text-muted-foreground">Kelas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center p-8 text-muted-foreground">
                                                    {search ? "Tidak ada mahasiswa yang cocok" : "Belum ada mahasiswa terdaftar"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filtered.map((s, idx) => (
                                                <tr key={s.studentId} className="border-b hover:bg-muted/30 transition-colors">
                                                    <td className="p-3 text-muted-foreground">{idx + 1}</td>
                                                    <td className="p-3 font-medium">{s.studentName}</td>
                                                    <td className="p-3 text-muted-foreground">{s.studentNim}</td>
                                                    <td className="p-3">
                                                        <Badge variant="secondary" className="text-xs font-normal">
                                                            {s.className}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </>
            )}
        </div>
    );
}

// ==================== Publish Panel ====================

function PublishPanel() {
    const { data: templates, isLoading: loadingTemplates } = useMetopenTemplates({ isActive: "true" });
    const { data: classes, isLoading: loadingClasses } = useMetopenClasses();
    const { data: publishStats, isLoading: loadingStats } = useMetopenPublishStats();

    const publishMutation = usePublishToClass();
    const updateDeadlineMutation = useUpdateMetopenPublishDeadline();
    const deleteMutation = useDeleteMetopenPublishedTasks();

    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [deadline, setDeadline] = useState<Date | undefined>(undefined);
    const [confirmOpen, setConfirmOpen] = useState(false);

    // For editing existing publish
    const [editDeadlineTarget, setEditDeadlineTarget] = useState<PublishStatItem | null>(null);
    const [newDeadline, setNewDeadline] = useState<Date | undefined>(undefined);

    // For deleting published tasks
    const [deleteTarget, setDeleteTarget] = useState<PublishStatItem | null>(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const activeTemplates = templates ?? [];
    const classesList = classes ?? [];

    // Jumlah mahasiswa ter-enroll di kelas yang dipilih
    const selectedStudentsCount = useMemo(() => {
        if (!selectedClassId) return 0;
        const cls = classesList.find((c: { id: string }) => c.id === selectedClassId);
        return cls?._count?.enrollments ?? 0;
    }, [selectedClassId, classesList]);

    // Check if current combination is already assigned
    const alreadyAssigned = useMemo(() => {
        if (!selectedTemplateId || !selectedClassId || !publishStats) return false;
        return publishStats.some(s => s.templateId === selectedTemplateId && (s.classId || "none") === selectedClassId);
    }, [selectedTemplateId, selectedClassId, publishStats]);

    const isConfigValid = !!selectedTemplateId && !!selectedClassId && !!deadline && selectedStudentsCount > 0 && !alreadyAssigned;

    const handlePublish = async () => {
        try {
            if (!isConfigValid || !deadline) return;
            await publishMutation.mutateAsync({
                classId: selectedClassId,
                data: {
                    templateIds: [selectedTemplateId],
                    templateDeadlines: { [selectedTemplateId]: deadline.toISOString() },
                },
            });
            setConfirmOpen(false);
            setSelectedClassId("");
            setDeadline(undefined);
        } catch {
            // handled by hook
        }
    };

    const handleUpdateDeadline = async () => {
        if (!editDeadlineTarget || !newDeadline) return;
        try {
            await updateDeadlineMutation.mutateAsync({
                templateId: editDeadlineTarget.templateId,
                classId: editDeadlineTarget.classId,
                deadline: newDeadline.toISOString(),
            });
            setEditDeadlineTarget(null);
        } catch {
            // handled by hook
        }
    };

    const openEditDeadline = (stat: PublishStatItem) => {
        setEditDeadlineTarget(stat);
        setNewDeadline(stat.deadline ? new Date(stat.deadline) : new Date());
    };

    const openDeleteTarget = (stat: PublishStatItem) => {
        setDeleteTarget(stat);
        setDeleteConfirmText("");
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync({
                templateId: deleteTarget.templateId,
                classId: deleteTarget.classId,
            });
            setDeleteTarget(null);
            setDeleteConfirmText("");
        } catch {
            // handled by hook
        }
    };

    if (loadingTemplates || loadingClasses || loadingStats) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-4 flex items-start gap-3">
                    <Send className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-medium text-blue-800">Assign Template ke Kelas</p>
                        <p className="text-sm text-blue-600 mt-1">
                            Pilih satu template dan assign ke satu kelas spesifik dengan target deadline. Mahasiswa yang sudah memiliki tugas ini tidak akan menerima tugas baru untuk template yang sama.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* SETTING PUBLISH */}
                <Card className="lg:col-span-1 shadow-sm border-muted h-fit">
                    <CardHeader className="bg-muted/30 pb-4 border-b">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Rocket className="h-4 w-4 text-primary" /> Pengaturan Publish
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-5">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Pilih Template</label>
                            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih Template" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Pilih Kelas</label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={classesList.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder={classesList.length === 0 ? "Belum ada kelas aktif" : "Pilih Kelas"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classesList.map((c: { id: string; name: string; _count?: { enrollments: number } }) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name} ({(c._count?.enrollments ?? 0)} mhs)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {classesList.length === 0 && (
                                <p className="text-xs text-amber-600 flex items-start gap-1 mt-1 bg-amber-50 border border-amber-100 rounded-md p-2">
                                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                    Belum ada kelas semester ini. Sync mahasiswa terlebih dahulu di tab <strong className="mx-1">Mahasiswa</strong>.
                                </p>
                            )}
                            {selectedClassId && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Users className="h-3 w-3" /> Akan dikirim ke {selectedStudentsCount} mahasiswa
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold">Deadline untuk Kelas Ini</label>
                            <DatePicker
                                value={deadline}
                                onChange={setDeadline}
                                placeholder="Pilih tanggal deadline"
                                className="w-full"
                            />
                        </div>

                        {alreadyAssigned && (
                            <div className="p-3 bg-amber-50 border border-amber-100 rounded-md flex items-start gap-2 text-amber-800 text-xs">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">Sudah Ter-assign</p>
                                    Template ini sudah pernah di-publish ke kelas yang dipilih. Gunakan fitur edit deadline jika ingin mengubah batas waktu.
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full gap-2 mt-2"
                            disabled={!isConfigValid || alreadyAssigned}
                            onClick={() => setConfirmOpen(true)}
                        >
                            <Send className="h-4 w-4" />
                            Publish Tugas
                        </Button>
                    </CardContent>
                </Card>

                {/* TEMPLATE STATUS LIST */}
                <Card className="lg:col-span-2 shadow-sm border-muted">
                    <CardHeader className="bg-muted/30 pb-4 border-b flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Daftar Template & Status Publish</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {activeTemplates.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">Tidak ada template aktif</div>
                        ) : (
                            <div className="divide-y overflow-hidden rounded-b-lg">
                                {activeTemplates.map(template => {
                                    const templateStats = publishStats?.filter(s => s.templateId === template.id) || [];

                                    return (
                                        <div key={template.id} className="p-5 hover:bg-muted/5 transition-colors">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                                                        {template.name}
                                                        {template.isGateToAdvisorSearch && (
                                                            <Badge variant="outline" className="text-[10px] h-5 bg-amber-50 text-amber-700 border-amber-200">Gate</Badge>
                                                        )}
                                                    </h4>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>
                                                </div>
                                            </div>

                                            {templateStats.length === 0 ? (
                                                <div className="text-xs text-muted-foreground bg-muted/20 border border-dashed rounded-md p-3 mt-2 flex items-center gap-2 italic">
                                                    <Info className="h-3.5 w-3.5" /> Belum di-publish ke kelas manapun
                                                </div>
                                            ) : (
                                                <div className="space-y-2 mt-3">
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status Publish Per Kelas</p>
                                                    <div className="grid gap-2">
                                                        {templateStats.map((stat, idx) => (
                                                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border bg-white/50 text-xs shadow-sm hover:border-blue-200 transition-all group">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="secondary" className="font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 py-0 h-6">
                                                                        {stat.className}
                                                                    </Badge>
                                                                    <div className="text-muted-foreground flex items-center gap-1.5 font-medium">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {stat.deadline ? format(new Date(stat.deadline), 'dd MMM yyyy') : '-'}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                                                    <div className="flex items-center gap-3 text-muted-foreground">
                                                                        <span title="Total Tugas" className="flex items-center gap-1">
                                                                            <Users className="h-3 w-3" /> <b>{stat.total}</b>
                                                                        </span>
                                                                        <div className="w-px h-3 bg-border" />
                                                                        <span title="Telah Disubmit" className="flex items-center gap-1 text-emerald-600">
                                                                            <CheckCircle2 className="h-3 w-3" /> <b>{stat.submitted}</b>
                                                                        </span>
                                                                        <div className="w-px h-3 bg-border" />
                                                                        <span title="Terlambat" className="flex items-center gap-1 text-red-600">
                                                                            <Clock className="h-3 w-3" /> <b>{stat.late}</b>
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/5 transition-all"
                                                                            onClick={() => openEditDeadline(stat)}
                                                                            title="Edit Deadline"
                                                                        >
                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/5 transition-all"
                                                                            onClick={() => openDeleteTarget(stat)}
                                                                            title="Hapus Tugas dari Kelas ini"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Publish Template</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda akan men-assign template ini ke <strong className="text-foreground">{selectedStudentsCount} mahasiswa</strong>.
                            {deadline && (
                                <span className="block mt-2">
                                    Batas waktu: <strong className="text-foreground">{format(deadline, 'dd MMM yyyy')}</strong>
                                </span>
                            )}
                            <br />Lanjutkan?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePublish} disabled={publishMutation.isPending}>
                            {publishMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                            Publish Sekarang
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Deadline Dialog */}
            <Dialog open={!!editDeadlineTarget} onOpenChange={(open) => !open && setEditDeadlineTarget(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Ubah Deadline</DialogTitle>
                        <DialogDescription>
                            Ubah batas waktu pengerjaan untuk template ini di <strong>{editDeadlineTarget?.className}</strong>.
                            Ini akan memperbarui deadline mahasiswa yang belum selesai.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Deadline Baru</Label>
                            <DatePicker
                                value={newDeadline}
                                onChange={setNewDeadline}
                                placeholder="Pilih tanggal..."
                                className="w-full"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDeadlineTarget(null)}>Batal</Button>
                        <Button
                            onClick={handleUpdateDeadline}
                            disabled={updateDeadlineMutation.isPending || !newDeadline}
                        >
                            {updateDeadlineMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Published Tasks Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
                if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); }
            }}>
                <AlertDialogContent className="sm:max-w-[460px]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <Trash2 className="h-5 w-5" /> Hapus Tugas dari Kelas
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm">
                                <p>
                                    Anda akan menghapus semua tugas template{" "}
                                    <strong className="text-foreground">
                                        {activeTemplates.find(t => t.id === deleteTarget?.templateId)?.name}
                                    </strong>{" "}
                                    dari kelas{" "}
                                    <strong className="text-foreground">{deleteTarget?.className}</strong>.
                                    Total{" "}
                                    <strong className="text-foreground">{deleteTarget?.total ?? 0} tugas</strong>{" "}
                                    akan dihapus.
                                </p>
                                {(deleteTarget?.submitted ?? 0) > 0 && (
                                    <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                                        <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                        <p className="text-destructive">
                                            <strong>{deleteTarget?.submitted} mahasiswa</strong> sudah menyubmit tugas ini.
                                            Semua submisi beserta file yang diunggah akan ikut{" "}
                                            <strong>terhapus permanen</strong> dan tidak bisa dikembalikan.
                                        </p>
                                    </div>
                                )}
                                <div className="pt-1 space-y-1.5">
                                    <p className="text-muted-foreground text-xs">
                                        Ketik <strong className="text-foreground font-mono">HAPUS</strong> untuk mengkonfirmasi:
                                    </p>
                                    <Input
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Ketik HAPUS di sini..."
                                        className="border-destructive/40 focus-visible:ring-destructive/30"
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>
                            Batal
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleteConfirmText !== "HAPUS" || deleteMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {deleteMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                            Hapus Permanen
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}

// ==================== Grading Panel ====================

function GradingPanel() {
    const [statusFilter, setStatusFilter] = useState<string>("pending_review");
    const [classFilter, setClassFilter] = useState<string>("all");
    const [templateFilter, setTemplateFilter] = useState<string>("all");
    const { data: queue, isLoading } = useMetopenGradingQueue({ status: statusFilter });
    const gradeMutation = useGradeMetopenMilestone();
    const [gradeTarget, setGradeTarget] = useState<GradingQueueItem | null>(null);
    const [detailTarget, setDetailTarget] = useState<GradingQueueItem | null>(null);
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState("");

    // Daftar kelas unik dari queue
    const classOptions = useMemo(() => {
        if (!queue) return [];
        const seen = new Map<string, string>();
        queue.forEach(item => {
            const key = item.metopenClassId ?? "none";
            if (!seen.has(key)) seen.set(key, item.className ?? "Tanpa Kelas");
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [queue]);

    // Daftar template unik dari queue (sesuai filter kelas)
    const templateOptions = useMemo(() => {
        if (!queue) return [];
        const filtered = classFilter === "all" ? queue : queue.filter(i => (i.metopenClassId ?? "none") === classFilter);
        const seen = new Map<string, string>();
        filtered.forEach(item => {
            if (item.milestoneTemplateId) seen.set(item.milestoneTemplateId, item.templateName ?? item.title);
        });
        return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
    }, [queue, classFilter]);

    // Data setelah filter
    const filteredQueue = useMemo(() => {
        if (!queue) return [];
        return queue.filter(item => {
            const classOk = classFilter === "all" || (item.metopenClassId ?? "none") === classFilter;
            const tmplOk = templateFilter === "all" || item.milestoneTemplateId === templateFilter;
            return classOk && tmplOk;
        });
    }, [queue, classFilter, templateFilter]);

    const openGrading = (item: GradingQueueItem) => {
        setGradeTarget(item);
        setScore(0);
        setFeedback("");
    };

    const handleGrade = async () => {
        if (!gradeTarget) return;
        if (score < 0 || score > 100) {
            toast.error("Skor harus antara 0-100");
            return;
        }
        try {
            await gradeMutation.mutateAsync({
                milestoneId: gradeTarget.id,
                data: { status: "completed", score, feedback: feedback || undefined },
            });
            setGradeTarget(null);
        } catch {
            // handled by hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3">
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setClassFilter("all"); setTemplateFilter("all"); }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="pending_review">Menunggu Penilaian</SelectItem>
                        <SelectItem value="completed">Sudah Dinilai</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={classFilter} onValueChange={(v) => { setClassFilter(v); setTemplateFilter("all"); }}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kelas</SelectItem>
                        {classOptions.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={templateFilter} onValueChange={setTemplateFilter}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Semua Tugas" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tugas</SelectItem>
                        {templateOptions.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Badge variant="outline" className="text-sm">
                    {filteredQueue.length} tugas
                </Badge>
            </div>

            {/* Queue Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium text-muted-foreground">Mahasiswa</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Kelas</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Tugas</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Submitted</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Skor</th>
                                <th className="text-right p-3 font-medium text-muted-foreground">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQueue.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 text-muted-foreground">
                                        Tidak ada tugas dalam antrian
                                    </td>
                                </tr>
                            ) : (
                                filteredQueue.map((item) => {
                                    const statusConfig = METOPEN_STATUS_CONFIG[item.status as MetopenMilestoneStatus];
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                <div>
                                                    <p className="font-medium">{item.studentName || "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{item.studentNim || ""}</p>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="secondary" className="text-xs font-normal">
                                                    {item.className ?? "Tanpa Kelas"}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <p className="font-medium">{item.templateName ?? item.title}</p>
                                                <Badge className={cn("text-xs mt-0.5", statusConfig?.bgColor, statusConfig?.color)} variant="outline">
                                                    {statusConfig?.label || item.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-muted-foreground text-xs">
                                                {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                                                {item.isLate && <Badge variant="destructive" className="ml-1 text-[10px] px-1 py-0">Terlambat</Badge>}
                                            </td>
                                            <td className="p-3 text-center">
                                                {item.totalScore != null ? (
                                                    <Badge variant="outline" className="font-mono font-bold text-green-700 border-green-300 bg-green-50">{item.totalScore}</Badge>
                                                ) : "—"}
                                            </td>
                                            <td className="p-3 text-right">
                                                {item.status === "pending_review" ? (
                                                    <Button size="sm" variant="outline" onClick={() => openGrading(item)} className="gap-1.5">
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Nilai
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" onClick={() => setDetailTarget(item)} className="gap-1.5">
                                                        <Eye className="h-3.5 w-3.5" />
                                                        Detail
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Grading Dialog */}
            <Dialog open={!!gradeTarget} onOpenChange={(o) => !o && setGradeTarget(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Penilaian Tugas</DialogTitle>
                        <DialogDescription>
                            {gradeTarget?.studentName} — {gradeTarget?.templateName ?? gradeTarget?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {gradeTarget?.studentNotes && (
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Catatan Mahasiswa</p>
                                <p className="text-sm">{gradeTarget.studentNotes}</p>
                            </div>
                        )}

                        {/* File yang dikumpulkan */}
                        {(() => {
                            const docs = gradeTarget?.milestoneDocuments;
                            if (!docs || docs.length === 0) return null;
                            return (
                                <div className="space-y-1.5">
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">File Dikumpulkan</p>
                                    <div className="space-y-2">
                                        {docs.map((doc: any) => {
                                            const url = buildFileUrl(doc.filePath);
                                            return (
                                                <a
                                                    key={doc.id}
                                                    href={url ?? "#"}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2.5 p-2 rounded-lg border bg-muted/20 hover:bg-muted/50 transition-colors group"
                                                >
                                                    <FileText className="w-4 h-4 text-primary shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">{doc.fileName || "Dokumen"}</p>
                                                        {doc.isLatest && <span className="text-[9px] text-green-600 font-bold uppercase tracking-tighter">Terbaru</span>}
                                                    </div>
                                                    <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-transform group-hover:-translate-y-0.5" />
                                                </a>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}
                        <div className="space-y-2">
                            <Label htmlFor="score">Skor (0-100) *</Label>
                            <Input id="score" type="number" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Feedback untuk Mahasiswa</Label>
                            <Textarea id="feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Tulis feedback untuk mahasiswa..." rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGradeTarget(null)}>Batal</Button>
                        <Button onClick={handleGrade} disabled={gradeMutation.isPending}>
                            {gradeMutation.isPending && <Spinner className="mr-2 h-4 w-4" />}
                            Simpan Nilai
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog (for completed tasks) */}
            <Dialog open={!!detailTarget} onOpenChange={(o) => !o && setDetailTarget(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detail Penilaian</DialogTitle>
                        <DialogDescription className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-foreground">{detailTarget?.studentName}</span>
                            <span className="text-muted-foreground">({detailTarget?.studentNim})</span>
                            <span>—</span>
                            <span>{detailTarget?.templateName ?? detailTarget?.title}</span>
                            <Badge variant="secondary" className="text-[10px]">{detailTarget?.className ?? "Tanpa Kelas"}</Badge>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        {/* Skor + tanggal row */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1 flex flex-col items-center justify-center rounded-lg border bg-green-50/50 p-3">
                                <span className="text-[10px] font-medium text-muted-foreground mb-1">Skor Akhir</span>
                                <span className="text-2xl font-bold text-green-700">{detailTarget?.totalScore ?? "—"}</span>
                                <span className="text-[10px] text-green-500">/100</span>
                            </div>
                            <div className="col-span-2 grid grid-rows-2 gap-2">
                                <div className="rounded-lg border p-2.5">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">Dikumpulkan</p>
                                    <p className="font-medium text-xs">
                                        {detailTarget?.submittedAt
                                            ? new Date(detailTarget.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                            : "—"}
                                    </p>
                                    {detailTarget?.isLate && <Badge variant="destructive" className="mt-0.5 text-[9px] h-4">Terlambat</Badge>}
                                </div>
                                <div className="rounded-lg border p-2.5">
                                    <p className="text-[10px] text-muted-foreground mb-0.5">Tanggal Penilaian</p>
                                    <p className="font-medium text-xs">
                                        {detailTarget?.assessedAt
                                            ? new Date(detailTarget.assessedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* File yang dikumpulkan */}
                        {(() => {
                            const docs = detailTarget?.milestoneDocuments;
                            if (!docs || docs.length === 0) return null;
                            return (
                                <div className="space-y-1">
                                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">File Dikumpulkan</p>
                                    {docs.map((doc: any) => {
                                        const url = buildFileUrl(doc.filePath);
                                        return (
                                            <a
                                                key={doc.id}
                                                href={url ?? "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors group"
                                            >
                                                <FileText className="w-4 h-4 text-primary shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium truncate">{doc.fileName || "Dokumen"}</p>
                                                    {doc.isLatest && <span className="text-[10px] text-green-600 font-medium">Terbaru</span>}
                                                </div>
                                                <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                                            </a>
                                        );
                                    })}
                                </div>
                            );
                        })()}

                        {/* Catatan mahasiswa */}
                        {detailTarget?.studentNotes && (
                            <div className="rounded-lg bg-muted/50 p-3">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Catatan Mahasiswa</p>
                                <p className="text-xs leading-relaxed">{detailTarget.studentNotes}</p>
                            </div>
                        )}

                        {/* Feedback dosen */}
                        {detailTarget?.feedback && (
                            <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3">
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 mb-1">
                                    <MessageSquare className="w-3 h-3" /> Feedback Dosen
                                </div>
                                <p className="text-xs text-blue-900 leading-relaxed">{detailTarget.feedback}</p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDetailTarget(null)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}


// ==================== Monitoring Panel ====================

function MonitoringPanel() {
    const { data, isLoading } = useMetopenMonitoring();
    const [search, setSearch] = useState("");

    const filteredStudents = useMemo(() => {
        if (!data?.students) return [];
        if (!search) return data.students;
        const q = search.toLowerCase();
        return data.students.filter(
            (s) => s.studentName.toLowerCase().includes(q) || s.studentNim.toLowerCase().includes(q)
        );
    }, [data?.students, search]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    const overview = data?.overview;

    return (
        <div className="space-y-4">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="border-blue-100 bg-blue-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total Mahasiswa</p>
                            <p className="text-2xl font-bold text-blue-700">{overview?.totalStudents ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-100 bg-green-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Gate Terbuka</p>
                            <p className="text-2xl font-bold text-green-700">{overview?.gateOpenCount ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-purple-100 bg-purple-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100">
                            <BarChart3 className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">% Gate Terbuka</p>
                            <p className="text-2xl font-bold text-purple-700">{overview?.gateOpenPercentage ?? 0}%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-100 bg-red-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Belum Mulai</p>
                            <p className="text-2xl font-bold text-red-700">{overview?.stuckCount ?? 0}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari mahasiswa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Student Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="text-left p-3 font-medium text-muted-foreground">Mahasiswa</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Progress</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Selesai</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Menunggu</th>
                                <th className="text-center p-3 font-medium text-muted-foreground">Gate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 text-muted-foreground">
                                        Belum ada data mahasiswa
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s.thesisId} className="border-b hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <div>
                                                <p className="font-medium">{s.studentName}</p>
                                                <p className="text-xs text-muted-foreground">{s.studentNim}</p>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all",
                                                            s.progress >= 100 ? "bg-green-500" :
                                                                s.progress >= 50 ? "bg-blue-500" :
                                                                    s.progress > 0 ? "bg-yellow-500" : "bg-gray-300"
                                                        )}
                                                        style={{ width: `${Math.min(s.progress, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium w-8 text-right">{s.progress}%</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className="font-medium">{s.completedTasks}/{s.totalTasks}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            {s.pendingReview > 0 ? (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    {s.pendingReview}
                                                </Badge>
                                            ) : "—"}
                                        </td>
                                        <td className="p-3 text-center">
                                            <Badge variant={s.gateOpen ? "default" : "secondary"} className="text-xs">
                                                {s.gateOpen ? "Terbuka" : "Tertutup"}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
