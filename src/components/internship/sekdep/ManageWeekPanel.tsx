import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import { Plus, Pencil, Trash2, BookOpen, GraduationCap, Loader2, GripVertical, ArrowLeft } from 'lucide-react';
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
} from '@/services/internship';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ==================== Student Questions Section ====================

interface StudentQuestionsWeekCardProps {
    academicYearId: string;
    weekNumber: number;
    questions: GuidanceQuestion[];
}

function StudentQuestionsWeekCard({ academicYearId, weekNumber, questions }: StudentQuestionsWeekCardProps) {
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<GuidanceQuestion | null>(null);
    const [form, setForm] = useState({ questionText: '' });

    // Reorder state
    const [orderedItems, setOrderedItems] = useState<GuidanceQuestion[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [hasReordered, setHasReordered] = useState(false);

    useEffect(() => {
        const sorted = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);
        setOrderedItems(sorted);
        setDraggingId(null);
        setHasReordered(false);
    }, [questions]);

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
        setForm({ questionText: '' });
        setDialogOpen(true);
    };

    const openEdit = (item: GuidanceQuestion) => {
        setEditingItem(item);
        setForm({
            questionText: item.questionText,
        });
        setDialogOpen(true);
    };

    const closeDialog = () => {
        setDialogOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = () => {
        const payload = {
            weekNumber: weekNumber,
            questionText: form.questionText,
        };
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            const nextOrder = questions.length;
            createMutation.mutate({ ...payload, orderIndex: nextOrder, academicYearId: academicYearId !== 'all' ? academicYearId : undefined });
        }
    };

    // Drag & drop handlers
    const handleDragStart = (id: string) => {
        setDraggingId(id);
    };

    const handleDragOver = (event: React.DragEvent, targetId: string) => {
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

    const handleDragEnd = async () => {
        setDraggingId(null);
        if (!hasReordered) return;
        
        try {
            await Promise.all(
                orderedItems.map((item, idx) => {
                    if (item.orderIndex === idx) return Promise.resolve();
                    return updateGuidanceQuestion(item.id, { orderIndex: idx });
                })
            );
            toast.success("Urutan berhasil diperbarui");
            setHasReordered(false);
            qc.invalidateQueries({ queryKey: ['guidance-questions', academicYearId] });
        } catch (err) {
            toast.error((err as Error).message || "Gagal menyimpan urutan");
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Card className="border border-slate-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        Laporan Mahasiswa
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Pertanyaan laporan mingguan yang harus dijawab mahasiswa.
                    </p>
                </div>
                <Badge variant="secondary" className="font-semibold">{orderedItems.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-end">
                    <Button size="sm" onClick={openCreate} className="h-8 gap-1">
                        <Plus className="size-3.5" />
                        Tambah
                    </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {orderedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-slate-50/50 text-center opacity-60">
                            <BookOpen className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 italic">Belum ada pertanyaan mahasiswa untuk minggu ini</p>
                        </div>
                    ) : (
                        orderedItems.map((item, index) => (
                            <div 
                                key={item.id}
                                className={cn(
                                    "flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                                    draggingId === item.id && "opacity-50 bg-muted"
                                )}
                                draggable
                                onDragStart={() => handleDragStart(item.id)}
                                onDragOver={(e) => handleDragOver(e, item.id)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex items-start gap-2.5">
                                    <GripVertical className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            Pertanyaan {index + 1}
                                        </span>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                            {item.questionText}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={() => openEdit(item)}>
                                        <Pencil className="size-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Pertanyaan" : "Tambah Pertanyaan"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Perbarui pertanyaan bimbingan mahasiswa." : "Tambahkan pertanyaan baru untuk bimbingan mahasiswa minggu ini."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
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
                        <Button onClick={handleSubmit} disabled={isPending || !form.questionText}>
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
        </Card>
    );
}

// ==================== Lecturer Criteria Section ====================

interface LecturerCriteriaWeekCardProps {
    academicYearId: string;
    weekNumber: number;
    criteria: GuidanceCriteria[];
}

function LecturerCriteriaWeekCard({ academicYearId, weekNumber, criteria }: LecturerCriteriaWeekCardProps) {
    const qc = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<GuidanceCriteria | null>(null);
    const [form, setForm] = useState({
        criteriaName: '',
        inputType: 'EVALUATION' as 'EVALUATION' | 'TEXT',
        options: [] as string[]
    });

    // Reorder state
    const [orderedItems, setOrderedItems] = useState<GuidanceCriteria[]>([]);
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [draggingOptionIndex, setDraggingOptionIndex] = useState<number | null>(null);
    const [hasReordered, setHasReordered] = useState(false);

    useEffect(() => {
        const sorted = [...criteria].sort((a, b) => a.orderIndex - b.orderIndex);
        setOrderedItems(sorted);
        setDraggingId(null);
        setHasReordered(false);
    }, [criteria]);

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
            criteriaName: '',
            inputType: 'EVALUATION',
            options: []
        });
        setDialogOpen(true);
    };

    const openEdit = (item: GuidanceCriteria) => {
        setEditingItem(item);
        setForm({
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
        const filteredOptions = form.inputType === 'EVALUATION'
            ? form.options.filter(o => o.trim() !== '')
            : [];

        if (form.inputType === 'EVALUATION' && filteredOptions.length === 0) {
            toast.error("Setidaknya harus ada satu opsi pilihan untuk tipe Evaluasi");
            return;
        }

        const payload = {
            weekNumber: weekNumber,
            criteriaName: form.criteriaName,
            inputType: form.inputType,
            options: form.inputType === 'EVALUATION' ? filteredOptions : undefined
        };
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
            const nextOrder = criteria.length;
            createMutation.mutate({ ...payload, orderIndex: nextOrder, academicYearId: academicYearId !== 'all' ? academicYearId : undefined });
        }
    };

    // Drag & drop handlers
    const handleDragStart = (id: string) => {
        setDraggingId(id);
    };

    const handleDragOver = (event: React.DragEvent, targetId: string) => {
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

    const handleDragEnd = async () => {
        setDraggingId(null);
        if (!hasReordered) return;
        
        try {
            await Promise.all(
                orderedItems.map((item, idx) => {
                    if (item.orderIndex === idx) return Promise.resolve();
                    return updateGuidanceCriteria(item.id, { orderIndex: idx });
                })
            );
            toast.success("Urutan berhasil diperbarui");
            setHasReordered(false);
            qc.invalidateQueries({ queryKey: ['guidance-criteria', academicYearId] });
        } catch (err) {
            toast.error((err as Error).message || "Gagal menyimpan urutan");
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    const inputTypeBadge = (type: 'EVALUATION' | 'TEXT') => {
        if (type === 'EVALUATION') return <Badge variant="default" className="bg-purple-100 text-purple-700 border-purple-200">Evaluasi</Badge>;
        return <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">Teks</Badge>;
    };

    return (
        <Card className="border border-slate-200 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-purple-500" />
                        Kriteria Penilaian Dosen
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                        Kriteria dan formulir penilaian bimbingan bagi Dosen Pembimbing.
                    </p>
                </div>
                <Badge variant="secondary" className="font-semibold">{orderedItems.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-end">
                    <Button size="sm" onClick={openCreate} className="h-8 gap-1">
                        <Plus className="size-3.5" />
                        Tambah
                    </Button>
                </div>

                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {orderedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-slate-50/50 text-center opacity-60">
                            <GraduationCap className="h-8 w-8 text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500 italic">Belum ada kriteria penilaian dosen untuk minggu ini</p>
                        </div>
                    ) : (
                        orderedItems.map((item, index) => (
                            <div 
                                key={item.id}
                                className={cn(
                                    "flex items-start justify-between p-3.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                                    draggingId === item.id && "opacity-50 bg-muted"
                                )}
                                draggable
                                onDragStart={() => handleDragStart(item.id)}
                                onDragOver={(e) => handleDragOver(e, item.id)}
                                onDragEnd={handleDragEnd}
                            >
                                <div className="flex items-start gap-2.5">
                                    <GripVertical className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Kriteria {index + 1}
                                            </span>
                                            {inputTypeBadge(item.inputType)}
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                                            {item.criteriaName}
                                        </p>
                                        {item.inputType === 'EVALUATION' && item.options?.length > 0 && (
                                            <div className="flex flex-wrap gap-4 mt-1">
                                                {item.options.map(opt => (
                                                    <Badge key={opt.id} variant="secondary" className="px-1.5 py-0 font-normal opacity-85">
                                                        {opt.optionText}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-1 shrink-0 ml-4">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-900" onClick={() => openEdit(item)}>
                                        <Pencil className="size-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(item.id)}>
                                        <Trash2 className="size-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Kriteria" : "Tambah Kriteria"}</DialogTitle>
                        <DialogDescription>
                            {editingItem ? "Perbarui kriteria penilaian dosen." : "Tambahkan kriteria baru untuk penilaian dosen minggu ini."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="space-y-2">
                            <Label>Nama Kriteria</Label>
                            <Input
                                placeholder="Contoh: Kehadiran dan Kedisiplinan"
                                value={form.criteriaName}
                                onChange={e => setForm(f => ({ ...f, criteriaName: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tipe Input</Label>
                            <Select value={form.inputType} onValueChange={(v) => setForm(f => ({ ...f, inputType: v as 'EVALUATION' | 'TEXT' }))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EVALUATION">Evaluasi (Pilihan Ganda)</SelectItem>
                                    <SelectItem value="TEXT">Teks bebas</SelectItem>
                                </SelectContent>
                            </Select>
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
                                <div className="grid grid-cols-1 gap-2 max-h-[30vh] overflow-y-auto pr-1">
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
                                                    onDragStart={e => e.preventDefault()}
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
                        <Button onClick={handleSubmit} disabled={isPending || !form.criteriaName}>
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
        </Card>
    );
}

// ==================== Main ManageWeekPanel Component ====================

interface ManageWeekPanelProps {
    academicYearId: string;
    activeWeek: number;
    onBack: () => void;
}

export function ManageWeekPanel({ academicYearId, activeWeek, onBack }: ManageWeekPanelProps) {
    const { data: questions = [], isLoading: loadingQuestions } = useQuery({
        queryKey: ['guidance-questions', academicYearId],
        queryFn: () => getGuidanceQuestions(academicYearId),
    });

    const { data: criteria = [], isLoading: loadingCriteria } = useQuery({
        queryKey: ['guidance-criteria', academicYearId],
        queryFn: () => getGuidanceCriteria(academicYearId),
    });

    const isLoading = loadingQuestions || loadingCriteria;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0" 
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">
                            Konfigurasi Bimbingan Minggu {activeWeek}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Kelola pertanyaan untuk mahasiswa dan kriteria penilaian untuk dosen di minggu ini.
                        </p>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground mt-2">Memuat data instrumen...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    <StudentQuestionsWeekCard 
                        academicYearId={academicYearId}
                        weekNumber={activeWeek}
                        questions={questions.filter(q => q.weekNumber === activeWeek)}
                    />
                    <LecturerCriteriaWeekCard 
                        academicYearId={academicYearId}
                        weekNumber={activeWeek}
                        criteria={criteria.filter(c => c.weekNumber === activeWeek)}
                    />
                </div>
            )}
        </div>
    );
}
