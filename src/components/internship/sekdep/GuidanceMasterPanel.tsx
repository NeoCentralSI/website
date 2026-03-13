import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, BookOpen, GraduationCap, Loader2, MoveVertical, GripVertical } from 'lucide-react';
import {
    getGuidanceQuestions,
    createGuidanceQuestion,
    updateGuidanceQuestion,
    deleteGuidanceQuestion,
    getGuidanceCriteria,
    createGuidanceCriteria,
    updateGuidanceCriteria,
    deleteGuidanceCriteria,
    type GuidanceQuestion,
    type GuidanceCriteria,
} from '@/services/internship.service';
import { getAcademicYearsAPI } from '@/services/admin.service';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { cn } from '@/lib/utils';

// ==================== Student Questions Section ====================

interface SectionProps {
    academicYearId: string;
    setAcademicYearId: (id: string) => void;
    academicYears: any[];
}

function StudentQuestionsSection({ academicYearId, setAcademicYearId, academicYears }: SectionProps) {
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<GuidanceQuestion | null>(null);
    const [form, setForm] = useState({ weekNumber: '', questionText: '' });

    // Reorder state
    const [orderedItems, setOrderedItems] = useState<GuidanceQuestion[]>([]);
    const [reorderEnabled, setReorderEnabled] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hasReordered, setHasReordered] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const { data: questions = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['guidance-questions', academicYearId],
        queryFn: () => getGuidanceQuestions(academicYearId),
    });

    useEffect(() => {
        const sorted = [...questions].sort((a, b) => a.weekNumber - b.weekNumber || a.orderIndex - b.orderIndex);
        setOrderedItems(sorted);
        if (!reorderEnabled) {
            setDraggingId(null);
            setHasReordered(false);
        }
    }, [questions, reorderEnabled]);

    const createMutation = useMutation({
        mutationFn: (data: { weekNumber: number; questionText: string; orderIndex: number; academicYearId?: string }) =>
            createGuidanceQuestion(data),
        onSuccess: () => {
            toast.success("Pertanyaan berhasil ditambahkan");
            qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
            closeDialog();
        },
        onError: (e: any) => toast.error(e.message || "Gagal menambahkan pertanyaan"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<GuidanceQuestion> }) =>
            updateGuidanceQuestion(id, data),
        onSuccess: () => {
            toast.success("Pertanyaan berhasil diperbarui");
            qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
            closeDialog();
        },
        onError: (e: any) => toast.error(e.message || "Gagal memperbarui pertanyaan"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteGuidanceQuestion(id),
        onSuccess: () => {
            toast.success("Pertanyaan berhasil dihapus");
            qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
            setDeleteId(null);
        },
        onError: (e: any) => toast.error(e.message || "Gagal menghapus pertanyaan"),
    });

    const openCreate = () => {
        setEditingItem(null);
        setForm({ weekNumber: '', questionText: '' });
        setDialogOpen(true);
    };

    const openEdit = (item: GuidanceQuestion) => {
        setEditingItem(item);
        setForm({
            weekNumber: String(item.weekNumber),
            questionText: item.questionText,
        });
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = () => {
        const weekNum = parseInt(form.weekNumber);
        const payload = {
            weekNumber: weekNum,
            questionText: form.questionText,
        };
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            const nextOrder = questions.filter(q => q.weekNumber === weekNum).length;
            createMutation.mutate({ ...payload, orderIndex: nextOrder, academicYearId: academicYearId !== 'all' ? academicYearId : undefined });
        }
    };

    // Drag & drop handlers
    const handleDragStart = (id: string) => {
        if (!reorderEnabled) return;
        setDraggingId(id);
    };

    const handleDragOver = (event: React.DragEvent, targetId: string) => {
        if (!reorderEnabled) return;
        event.preventDefault();
        if (!draggingId || draggingId === targetId) return;

        setOrderedItems(prev => {
            const currentIndex = prev.findIndex(t => t.id === draggingId);
            const targetIndex = prev.findIndex(t => t.id === targetId);
            if (currentIndex === -1 || targetIndex === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(currentIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setHasReordered(true);
    };

    const handleSaveOrder = async () => {
        if (!hasReordered) return;
        setIsSavingOrder(true);
        try {
            const newIndexes = new Map<string, number>();
            const weekCounts = new Map<number, number>();

            orderedItems.forEach((item) => {
                const count = weekCounts.get(item.weekNumber) || 0;
                newIndexes.set(item.id, count);
                weekCounts.set(item.weekNumber, count + 1);
            });

            await Promise.all(
                orderedItems.map((item) => {
                    const newIdx = newIndexes.get(item.id)!;
                    if (item.orderIndex === newIdx) return Promise.resolve();
                    return updateGuidanceQuestion(item.id, { orderIndex: newIdx });
                })
            );
            toast.success("Urutan berhasil disimpan");
            setHasReordered(false);
            setReorderEnabled(false);
            qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
        } catch (err) {
            toast.error((err as Error).message || "Gagal menyimpan urutan");
        } finally {
            setIsSavingOrder(false);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const columns: Column<GuidanceQuestion>[] = useMemo(() => [
        ...(reorderEnabled ? [{
            key: 'drag',
            header: '' as React.ReactNode,
            width: 40,
            render: () => <GripVertical className="size-4 text-muted-foreground cursor-grab" />,
        }] : []),
        {
            key: 'orderIndex',
            header: '#',
            width: 50,
            render: (row: GuidanceQuestion) => {
                const sourceArray = reorderEnabled ? orderedItems : questions;
                const weekIdx = sourceArray.filter(i => i.weekNumber === row.weekNumber).findIndex(i => i.id === row.id) + 1;
                return <span className="text-muted-foreground font-medium">{weekIdx}</span>;
            },
        },
        {
            key: 'weekNumber',
            header: 'Minggu',
            width: 90,
            sortable: !reorderEnabled,
            render: (row: GuidanceQuestion) => (
                <Badge variant="outline">Minggu {row.weekNumber}</Badge>
            ),
        },
        {
            key: 'questionText',
            header: 'Pertanyaan',
            render: (row: GuidanceQuestion) => (
                <span className="text-sm leading-relaxed">{row.questionText}</span>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 100,
            className: 'text-center',
            render: (row: GuidanceQuestion) => (
                <div className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)} disabled={reorderEnabled}>
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(row.id)} disabled={reorderEnabled}>
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            ),
        },
    ], [reorderEnabled, orderedItems, questions]);

    return (
        <div className="space-y-4">
            <InternshipTable
                columns={columns as any}
                data={orderedItems}
                loading={isLoading}
                isRefreshing={!reorderEnabled && isFetching && !isLoading}
                total={orderedItems.length}
                page={1}
                pageSize={orderedItems.length || 10}
                onPageChange={() => { }}
                emptyText="Belum ada pertanyaan. Klik &quot;Tambah Pertanyaan&quot; untuk memulai."
                rowKey={(row) => row.id}
                rowProps={(row) => {
                    if (!reorderEnabled) return {};
                    return {
                        draggable: true,
                        onDragStart: () => handleDragStart(row.id),
                        onDragOver: (e) => handleDragOver(e as any, row.id),
                        onDragEnd: () => setDraggingId(null),
                        onDrop: (e) => { e.preventDefault(); setDraggingId(null); },
                        className: cn(
                            "cursor-grab hover:bg-muted/30 transition-colors",
                            draggingId === row.id && "opacity-50 bg-muted"
                        ),
                    };
                }}
                actions={
                    <div className="flex items-center gap-2">
                        <Select value={academicYearId} onValueChange={setAcademicYearId}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                {academicYears.map((ay) => (
                                    <SelectItem key={ay.id} value={ay.id}>
                                        <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                            {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {reorderEnabled ? (
                            <>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSaveOrder}
                                    disabled={!hasReordered || isSavingOrder}
                                    className="gap-1"
                                >
                                    {isSavingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Simpan Urutan
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReorderEnabled(false)}
                                    disabled={isSavingOrder}
                                >
                                    Selesai
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReorderEnabled(true)}
                                    disabled={orderedItems.length < 2}
                                    className="gap-1"
                                >
                                    <MoveVertical className="size-4" />
                                    Atur Urutan
                                </Button>
                                <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
                                <Button size="sm" onClick={openCreate} className="gap-1">
                                    <Plus className="size-4" />
                                    Tambah Pertanyaan
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Pertanyaan" : "Tambah Pertanyaan"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Perbarui pertanyaan bimbingan mahasiswa." : "Tambahkan pertanyaan baru untuk bimbingan mahasiswa."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label>Minggu</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="1"
                                    value={form.weekNumber}
                                    onChange={e => setForm(f => ({ ...f, weekNumber: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Teks Pertanyaan</Label>
                            <Textarea
                                placeholder="Tuliskan pertanyaan bimbingan..."
                                value={form.questionText}
                                onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={isPending}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isPending || !form.weekNumber || !form.questionText}>
                            {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                            {editingItem ? "Simpan" : "Tambah"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Pertanyaan?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Pertanyaan ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ==================== Lecturer Criteria Section ====================

function LecturerCriteriaSection({ academicYearId, setAcademicYearId, academicYears }: SectionProps) {
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<GuidanceCriteria | null>(null);
    const [form, setForm] = useState({
        weekNumber: '',
        criteriaName: '',
        inputType: 'EVALUATION' as 'EVALUATION' | 'TEXT',
        options: [] as string[]
    });

    // Reorder state
    const [orderedItems, setOrderedItems] = useState<GuidanceCriteria[]>([]);
    const [reorderEnabled, setReorderEnabled] = useState(false);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingOptionIndex, setDraggingOptionIndex] = useState<number | null>(null);
    const [hasReordered, setHasReordered] = useState(false);
    const [isSavingOrder, setIsSavingOrder] = useState(false);

    const { data: criteria = [], isLoading, isFetching, refetch } = useQuery({
        queryKey: ['guidance-criteria', academicYearId],
        queryFn: () => getGuidanceCriteria(academicYearId),
    });

    useEffect(() => {
        const sorted = [...criteria].sort((a, b) => a.weekNumber - b.weekNumber || a.orderIndex - b.orderIndex);
        setOrderedItems(sorted);
        if (!reorderEnabled) {
            setDraggingId(null);
            setHasReordered(false);
        }
    }, [criteria, reorderEnabled]);

    const createMutation = useMutation({
        mutationFn: (data: { criteriaName: string; weekNumber: number; inputType: 'EVALUATION' | 'TEXT'; orderIndex: number; options?: string[]; academicYearId?: string }) =>
            createGuidanceCriteria(data),
        onSuccess: () => {
            toast.success("Kriteria berhasil ditambahkan");
            qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
            closeDialog();
        },
        onError: (e: any) => toast.error(e.message || "Gagal menambahkan kriteria"),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<{ criteriaName: string; weekNumber: number; inputType: 'EVALUATION' | 'TEXT'; orderIndex: number; options?: string[] }> }) =>
            updateGuidanceCriteria(id, data),
        onSuccess: () => {
            toast.success("Kriteria berhasil diperbarui");
            qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
            closeDialog();
        },
        onError: (e: any) => toast.error(e.message || "Gagal memperbarui kriteria"),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteGuidanceCriteria(id),
        onSuccess: () => {
            toast.success("Kriteria berhasil dihapus");
            qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
            setDeleteId(null);
        },
        onError: (e: any) => toast.error(e.message || "Gagal menghapus kriteria"),
    });

    const openCreate = () => {
        setEditingItem(null);
        setForm({
            weekNumber: '',
            criteriaName: '',
            inputType: 'EVALUATION',
            options: []
        });
        setDialogOpen(true);
    };

    const openEdit = (item: GuidanceCriteria) => {
        setEditingItem(item);
        setForm({
            weekNumber: String(item.weekNumber),
            criteriaName: item.criteriaName,
            inputType: item.inputType,
            options: item.options?.map(o => o.optionText) || []
        });
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = () => {
        const weekNum = parseInt(form.weekNumber);

        const filteredOptions = form.inputType === 'EVALUATION'
            ? form.options.filter(o => o.trim() !== '')
            : [];

        if (form.inputType === 'EVALUATION' && filteredOptions.length === 0) {
            toast.error("Setidaknya harus ada satu opsi pilihan untuk tipe Evaluasi");
            return;
        }

        const payload = {
            weekNumber: weekNum,
            criteriaName: form.criteriaName,
            inputType: form.inputType,
            options: form.inputType === 'EVALUATION' ? filteredOptions : undefined
        };
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            const nextOrder = criteria.filter(c => c.weekNumber === weekNum).length;
            createMutation.mutate({ ...payload, orderIndex: nextOrder, academicYearId: academicYearId !== 'all' ? academicYearId : undefined });
        }
    };

    // Drag & drop handlers
    const handleDragStart = (id: string) => {
        if (!reorderEnabled) return;
        setDraggingId(id);
    };

    const handleDragOver = (event: React.DragEvent, targetId: string) => {
        if (!reorderEnabled) return;
        event.preventDefault();
        if (!draggingId || draggingId === targetId) return;

        setOrderedItems(prev => {
            const currentIndex = prev.findIndex(t => t.id === draggingId);
            const targetIndex = prev.findIndex(t => t.id === targetId);
            if (currentIndex === -1 || targetIndex === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(currentIndex, 1);
            next.splice(targetIndex, 0, moved);
            return next;
        });
        setHasReordered(true);
    };

    const handleSaveOrder = async () => {
        if (!hasReordered) return;
        setIsSavingOrder(true);
        try {
            const newIndexes = new Map<string, number>();
            const weekCounts = new Map<number, number>();

            orderedItems.forEach((item) => {
                const count = weekCounts.get(item.weekNumber) || 0;
                newIndexes.set(item.id, count);
                weekCounts.set(item.weekNumber, count + 1);
            });

            await Promise.all(
                orderedItems.map((item) => {
                    const newIdx = newIndexes.get(item.id)!;
                    if (item.orderIndex === newIdx) return Promise.resolve();
                    return updateGuidanceCriteria(item.id, { orderIndex: newIdx });
                })
            );
            toast.success("Urutan berhasil disimpan");
            setHasReordered(false);
            setReorderEnabled(false);
            qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
        } catch (err) {
            toast.error((err as Error).message || "Gagal menyimpan urutan");
        } finally {
            setIsSavingOrder(false);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const inputTypeBadge = (type: 'EVALUATION' | 'TEXT') => {
        if (type === 'EVALUATION') return <Badge variant="default" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800">Evaluasi</Badge>;
        return <Badge variant="default" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">Teks</Badge>;
    };

    const columns: Column<GuidanceCriteria>[] = useMemo(() => [
        {
            key: 'orderIndex',
            header: '#',
            width: 50,
            render: (row: GuidanceCriteria) => {
                const sourceArray = reorderEnabled ? orderedItems : criteria;
                const weekIdx = sourceArray.filter(i => i.weekNumber === row.weekNumber).findIndex(i => i.id === row.id) + 1;
                return <span className="text-muted-foreground font-medium">{weekIdx}</span>;
            },
        },
        {
            key: 'weekNumber',
            header: 'Minggu',
            width: 90,
            sortable: true,
            render: (row: GuidanceCriteria) => (
                <Badge variant="outline">Minggu {row.weekNumber}</Badge>
            ),
        },
        {
            key: 'criteriaName',
            header: 'Nama Kriteria',
            render: (row: GuidanceCriteria) => (
                <div className="flex flex-col gap-1 py-1">
                    <span className="text-sm font-medium">{row.criteriaName}</span>
                    {row.inputType === 'EVALUATION' && row.options?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {row.options.map(opt => (
                                <Badge key={opt.id} variant="secondary" className="px-1.5 py-0 text-[10px] font-normal opacity-80">
                                    {opt.optionText}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'inputType',
            header: 'Tipe Input',
            width: 120,
            render: (row: GuidanceCriteria) => inputTypeBadge(row.inputType),
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 100,
            className: 'text-center',
            render: (row: GuidanceCriteria) => (
                <div className="flex gap-1 justify-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)} disabled={reorderEnabled}>
                        <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(row.id)} disabled={reorderEnabled}>
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            ),
        },
    ], [reorderEnabled, orderedItems, criteria]);

    return (
        <div className="space-y-4">
            <InternshipTable
                columns={columns as any}
                data={orderedItems}
                loading={isLoading}
                isRefreshing={!reorderEnabled && isFetching && !isLoading}
                total={orderedItems.length}
                page={1}
                pageSize={orderedItems.length || 10}
                onPageChange={() => { }}
                emptyText="Belum ada kriteria. Klik &quot;Tambah Kriteria&quot; untuk memulai."
                rowKey={(row) => row.id}
                rowProps={(row) => {
                    if (!reorderEnabled) return {};
                    return {
                        draggable: true,
                        onDragStart: () => handleDragStart(row.id),
                        onDragOver: (e) => handleDragOver(e as any, row.id),
                        onDragEnd: () => setDraggingId(null),
                        onDrop: (e) => { e.preventDefault(); setDraggingId(null); },
                        className: cn(
                            "cursor-grab hover:bg-muted/30 transition-colors",
                            draggingId === row.id && "opacity-50 bg-muted"
                        ),
                    };
                }}
                actions={
                    <div className="flex items-center gap-2">
                        <Select value={academicYearId} onValueChange={setAcademicYearId}>
                            <SelectTrigger className="w-[180px] h-9">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                {academicYears.map((ay) => (
                                    <SelectItem key={ay.id} value={ay.id}>
                                        <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                            {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {reorderEnabled ? (
                            <>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleSaveOrder}
                                    disabled={!hasReordered || isSavingOrder}
                                    className="gap-1"
                                >
                                    {isSavingOrder && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Simpan Urutan
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReorderEnabled(false)}
                                    disabled={isSavingOrder}
                                >
                                    Selesai
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReorderEnabled(true)}
                                    disabled={orderedItems.length < 2}
                                    className="gap-1"
                                >
                                    <MoveVertical className="size-4" />
                                    Atur Urutan
                                </Button>
                                <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
                                <Button size="sm" onClick={openCreate} className="gap-1">
                                    <Plus className="size-4" />
                                    Tambah Kriteria
                                </Button>
                            </>
                        )}
                    </div>
                }
            />

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Kriteria" : "Tambah Kriteria"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Perbarui kriteria penilaian dosen." : "Tambahkan kriteria baru untuk penilaian dosen."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Minggu</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    placeholder="1"
                                    value={form.weekNumber}
                                    onChange={e => setForm(f => ({ ...f, weekNumber: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipe Input</Label>
                                <Select value={form.inputType} onValueChange={(v) => setForm(f => ({ ...f, inputType: v as 'EVALUATION' | 'TEXT' }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EVALUATION">Evaluasi</SelectItem>
                                        <SelectItem value="TEXT">Teks</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Nama Kriteria</Label>
                            <Input
                                placeholder="Contoh: Kehadiran dan Kedisiplinan"
                                value={form.criteriaName}
                                onChange={e => setForm(f => ({ ...f, criteriaName: e.target.value }))}
                            />
                        </div>
                        {form.inputType === 'EVALUATION' && (
                            <div className="space-y-3 pt-2 border-t border-dashed">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs uppercase tracking-wider opacity-60">Opsi Pilihan (Evaluasi)</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 px-2 text-xs gap-1"
                                        onClick={() => setForm(f => ({ ...f, options: [...f.options, ''] }))}
                                    >
                                        <Plus className="size-3" /> Tambah Opsi
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {form.options.length === 0 ? (
                                        <div className="py-4 text-center border-2 border-dashed rounded-md bg-muted/20">
                                            <p className="text-xs text-muted-foreground">Belum ada opsi. Silakan klik &quot;Tambah Opsi&quot;.</p>
                                        </div>
                                    ) : (
                                        form.options.map((opt, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "flex gap-2 items-center group",
                                                    draggingOptionIndex === idx && "opacity-50"
                                                )}
                                                draggable
                                                onDragStart={() => setDraggingOptionIndex(idx)}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    if (draggingOptionIndex === null || draggingOptionIndex === idx) return;
                                                    const newOpts = [...form.options];
                                                    const [moved] = newOpts.splice(draggingOptionIndex, 1);
                                                    newOpts.splice(idx, 0, moved);
                                                    setForm(f => ({ ...f, options: newOpts }));
                                                    setDraggingOptionIndex(idx);
                                                }}
                                                onDragEnd={() => setDraggingOptionIndex(null)}
                                            >
                                                <GripVertical className="size-4 text-muted-foreground cursor-grab active:cursor-grabbing group-hover:text-foreground transition-colors shrink-0" />
                                                <Input
                                                    placeholder={`Opsi ${idx + 1}`}
                                                    value={opt}
                                                    onChange={e => {
                                                        const newOpts = [...form.options];
                                                        newOpts[idx] = e.target.value;
                                                        setForm(f => ({ ...f, options: newOpts }));
                                                    }}
                                                    className="h-8 text-sm"
                                                    onDragStart={e => e.preventDefault()} // Prevent text selection drag
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive shrink-0"
                                                    onClick={() => setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }))}
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground italic">
                                    Dosen akan memilih salah satu dari opsi di atas.
                                </p>
                            </div>
                        )}
                        {form.inputType === 'TEXT' && (
                            <p className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-md">
                                Tipe <strong>Teks</strong>: Dosen mengisi catatan/komentar secara bebas.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog} disabled={isPending}>Batal</Button>
                        <Button onClick={handleSubmit} disabled={isPending || !form.weekNumber || !form.criteriaName}>
                            {isPending ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                            {editingItem ? "Simpan" : "Tambah"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kriteria?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kriteria ini akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                            disabled={deleteMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ==================== Main Panel ====================

export function GuidanceMasterPanel() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'questions';
    const academicYearId = searchParams.get('academicYearId') || 'all';

    const updateParams = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
    };

    const setAcademicYearId = (id: string) => updateParams({ academicYearId: id });

    const { data: ayData } = useQuery({
        queryKey: ['academic-years-all'],
        queryFn: () => getAcademicYearsAPI({ pageSize: 100 }),
    });
    const academicYears = ayData?.academicYears || [];

    useEffect(() => {
        if (academicYears.length > 0 && academicYearId === 'all') {
            const active = academicYears.find(ay => ay.isActive);
            if (active) setAcademicYearId(active.id);
        }
    }, [academicYears, academicYearId]);

    const handleTabChange = (val: string) => {
        updateParams({ tab: val });
    };

    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger
                        value="questions"
                        className="px-6 relative"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <BookOpen className="size-4" />
                            <span className="font-semibold">Pertanyaan Mahasiswa</span>
                        </div>
                    </TabsTrigger>
                    <TabsTrigger
                        value="criteria"
                        className="px-6 relative"
                    >
                        <div className="flex items-center gap-2 px-1">
                            <GraduationCap className="size-4" />
                            <span className="font-semibold">Kriteria Penilaian Dosen</span>
                        </div>
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="questions">
                        <StudentQuestionsSection
                            academicYearId={academicYearId}
                            setAcademicYearId={setAcademicYearId}
                            academicYears={academicYears}
                        />
                    </TabsContent>
                    <TabsContent value="criteria">
                        <LecturerCriteriaSection
                            academicYearId={academicYearId}
                            setAcademicYearId={setAcademicYearId}
                            academicYears={academicYears}
                        />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
