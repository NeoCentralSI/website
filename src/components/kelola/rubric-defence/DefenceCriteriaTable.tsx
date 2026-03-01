import { useMemo, useState } from 'react';
import { ChevronDown, Pencil, Plus, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loading } from '@/components/ui/spinner';
import type {
    CpmkWithRubrics,
    AssessmentCriteria,
    AssessmentRubric,
    CreateRubricPayload,
    UpdateRubricPayload,
} from '@/services/rubricDefence.service';
import { DefenceRubricItemFormDialog } from './DefenceRubricItemFormDialog';

// ── Types ─────────────────────────────────────
interface DefenceCriteriaTableProps {
    data: CpmkWithRubrics[];
    isLoading: boolean;
    isFetching: boolean;
    onRefresh: () => void;
    onAddCriteria: (cpmkId: string) => void;
    onEditCriteria: (criteria: AssessmentCriteria, cpmk: CpmkWithRubrics) => void;
    onDeleteCriteria: (criteriaId: string) => void;
    onDeleteCpmk: (cpmkId: string) => Promise<unknown>;
    onCreateRubric: (criteriaId: string, data: CreateRubricPayload) => Promise<unknown>;
    onUpdateRubric: (rubricId: string, data: UpdateRubricPayload) => Promise<unknown>;
    onDeleteRubric: (id: string) => void;
    onToggleCriteriaActive: (criteriaId: string, isActive: boolean) => Promise<unknown>;
    onReorderCriteria: (cpmkId: string, orderedIds: string[]) => Promise<unknown>;
    onReorderRubrics: (criteriaId: string, orderedIds: string[]) => Promise<unknown>;
    isDeletingCriteria: boolean;
    isRemovingCpmk: boolean;
    isDeletingRubric: boolean;
    isTogglingCriteria: boolean;
}

export function DefenceCriteriaTable({
    data,
    isLoading,
    isFetching,
    onRefresh,
    onAddCriteria,
    onEditCriteria,
    onDeleteCriteria,
    onDeleteCpmk,
    onCreateRubric,
    onUpdateRubric,
    onDeleteRubric,
    onToggleCriteriaActive,
    onReorderCriteria,
    onReorderRubrics,
    isDeletingCriteria,
    isRemovingCpmk,
    isDeletingRubric,
    isTogglingCriteria,
}: DefenceCriteriaTableProps) {
    const [deleteCpmkId, setDeleteCpmkId] = useState<string | null>(null);
    const [deleteCriteriaId, setDeleteCriteriaId] = useState<string | null>(null);
    const [deleteRubricId, setDeleteRubricId] = useState<string | null>(null);
    const [openCpmks, setOpenCpmks] = useState<string[]>([]);
    const [rubricFormOpen, setRubricFormOpen] = useState(false);
    const [rubricFormCriteriaId, setRubricFormCriteriaId] = useState<string>('');
    const [rubricFormCriteriaMaxScore, setRubricFormCriteriaMaxScore] = useState<number | null>(null);
    const [editRubric, setEditRubric] = useState<AssessmentRubric | null>(null);

    const totalSkorKriteria = (cpmk: CpmkWithRubrics): number =>
        cpmk.assessmentCriterias
            .filter((c) => c.isActive)
            .reduce((s, c) => s + (c.maxScore || 0), 0);

    const totalRubrik = (cpmk: CpmkWithRubrics): number =>
        cpmk.assessmentCriterias.reduce((s, c) => s + c.assessmentRubrics.length, 0);

    const configuredCount = useMemo(
        () => data.filter((c) => c.assessmentCriterias.length > 0).length,
        [data],
    );

    const toggleCpmk = (cpmkId: string) => {
        setOpenCpmks((prev) =>
            prev.includes(cpmkId)
                ? prev.filter((id) => id !== cpmkId)
                : [...prev, cpmkId],
        );
    };

    const handleAddRubric = (criteria: AssessmentCriteria) => {
        setEditRubric(null);
        setRubricFormCriteriaId(criteria.id);
        setRubricFormCriteriaMaxScore(criteria.maxScore);
        setRubricFormOpen(true);
    };

    const handleEditRubric = (rubric: AssessmentRubric, criteriaMaxScore: number | null) => {
        setEditRubric(rubric);
        setRubricFormCriteriaId('');
        setRubricFormCriteriaMaxScore(criteriaMaxScore);
        setRubricFormOpen(true);
    };

    const handleConfirmDeleteCriteria = () => {
        if (deleteCriteriaId) {
            onDeleteCriteria(deleteCriteriaId);
            setDeleteCriteriaId(null);
        }
    };

    const handleConfirmDeleteRubric = () => {
        if (deleteRubricId) {
            onDeleteRubric(deleteRubricId);
            setDeleteRubricId(null);
        }
    };

    const handleConfirmDeleteCpmk = async () => {
        if (deleteCpmkId) {
            await onDeleteCpmk(deleteCpmkId);
            setDeleteCpmkId(null);
        }
    };

    const handleMoveCriteria = (cpmk: CpmkWithRubrics, criteriaId: string, direction: 'up' | 'down') => {
        const ids = cpmk.assessmentCriterias.map((c) => c.id);
        const idx = ids.indexOf(criteriaId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= ids.length) return;
        [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
        onReorderCriteria(cpmk.id, ids);
    };

    const handleMoveRubric = (criteria: AssessmentCriteria, rubricId: string, direction: 'up' | 'down') => {
        const ids = criteria.assessmentRubrics.map((r) => r.id);
        const idx = ids.indexOf(rubricId);
        if (idx < 0) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= ids.length) return;
        [ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
        onReorderRubrics(criteria.id, ids);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loading size="lg" text="Memuat data rubrik sidang..." />
            </div>
        );
    }

    return (
        <>
            {/* Subjudul dan tombol refresh */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">
                    {configuredCount} dari {data.length} CPMK sudah dikonfigurasi
                </p>
                <RefreshButton
                    onClick={onRefresh}
                    isRefreshing={isFetching && !isLoading}
                />
            </div>

            {data.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    Belum ada CPMK bertipe thesis yang aktif.
                    Tambahkan CPMK terlebih dahulu di menu &quot;Kelola CPMK&quot;.
                </div>
            ) : (
                <div className="space-y-3">
                    {data.map((cpmk) => {
                        const skor = totalSkorKriteria(cpmk);
                        const jmlRubrik = totalRubrik(cpmk);
                        const isOpen = openCpmks.includes(cpmk.id);

                        return (
                            <Collapsible
                                key={cpmk.id}
                                open={isOpen}
                                onOpenChange={() => toggleCpmk(cpmk.id)}
                            >
                                <div className="rounded-lg border bg-card">
                                    {/* ── CPMK Header ── */}
                                    <CollapsibleTrigger asChild>
                                        <button className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors rounded-lg">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <ChevronDown
                                                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                                                        isOpen ? 'rotate-180' : ''
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-semibold text-sm">
                                                            {cpmk.code}
                                                        </span>
                                                        {cpmk.assessmentCriterias.length > 0 ? (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Skor: {skor}
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                                Belum dikonfigurasi
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {cpmk.description}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
                                                <span>{cpmk.assessmentCriterias.length} kriteria</span>
                                                <span>{jmlRubrik} rubrik</span>
                                            </div>
                                        </button>
                                    </CollapsibleTrigger>

                                    {/* ── CPMK Content ── */}
                                    <CollapsibleContent>
                                        <div className="border-t px-4 pb-4 pt-3 space-y-3">
                                            <div className="flex items-center justify-between flex-wrap gap-2">
                                                <p className="text-xs text-muted-foreground">
                                                    Total skor kriteria: <strong>{skor}</strong>
                                                </p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onAddCriteria(cpmk.id);
                                                        }}
                                                    >
                                                        <Plus className="mr-1 h-3 w-3" /> Kriteria
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteCpmkId(cpmk.id)}
                                                        disabled={cpmk.assessmentCriterias.length === 0}
                                                    >
                                                        <Trash2 className="mr-1 h-3 w-3" /> Hapus CPMK
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Daftar kriteria */}
                                            {cpmk.assessmentCriterias.length === 0 ? (
                                                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                                                    Belum ada kriteria. Gunakan tombol &quot;Kriteria&quot; untuk menambah kriteria terlebih dahulu,
                                                    lalu tambahkan rubrik pada kriteria tersebut.
                                                </div>
                                            ) : (
                                                cpmk.assessmentCriterias.map((criteria, criteriaIdx) => (
                                                    <div key={criteria.id} className={`rounded-md border p-3 space-y-3 ${
                                                        !criteria.isActive ? 'opacity-60 bg-muted/30' : ''
                                                    }`}>
                                                        {/* Header kriteria */}
                                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5"
                                                                        title="Pindah ke atas"
                                                                        disabled={criteriaIdx === 0}
                                                                        onClick={() => handleMoveCriteria(cpmk, criteria.id, 'up')}
                                                                    >
                                                                        <ArrowUp className="h-3 w-3" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-5 w-5"
                                                                        title="Pindah ke bawah"
                                                                        disabled={criteriaIdx === cpmk.assessmentCriterias.length - 1}
                                                                        onClick={() => handleMoveCriteria(cpmk, criteria.id, 'down')}
                                                                    >
                                                                        <ArrowDown className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                                <span className="text-sm font-medium">
                                                                    {criteria.name || 'Tanpa Nama'}
                                                                </span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Maks: {criteria.maxScore ?? '-'}
                                                                </Badge>
                                                                {!criteria.isActive && (
                                                                    <Badge variant="secondary" className="text-xs text-muted-foreground">
                                                                        Nonaktif
                                                                    </Badge>
                                                                )}
                                                                {criteria.isActive && criteria.assessmentRubrics.length === 0 && (
                                                                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                                                                        Belum ada rubrik
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    title={criteria.isActive ? 'Nonaktifkan kriteria' : 'Aktifkan kriteria'}
                                                                    disabled={isTogglingCriteria}
                                                                    onClick={() => onToggleCriteriaActive(criteria.id, !criteria.isActive)}
                                                                >
                                                                    {criteria.isActive ? (
                                                                        <Eye className="h-3.5 w-3.5" />
                                                                    ) : (
                                                                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    title="Ubah kriteria"
                                                                    onClick={() => onEditCriteria(criteria, cpmk)}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 text-destructive"
                                                                    title="Hapus kriteria"
                                                                    onClick={() => setDeleteCriteriaId(criteria.id)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs"
                                                                    onClick={() => handleAddRubric(criteria)}
                                                                >
                                                                    <Plus className="mr-1 h-3 w-3" /> Rubrik
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Tabel rubrik */}
                                                        {criteria.assessmentRubrics.length > 0 ? (
                                                            <div className="rounded-md border">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead className="w-16">Urutan</TableHead>
                                                                            <TableHead className="w-32">Rentang Skor</TableHead>
                                                                            <TableHead>Deskripsi</TableHead>
                                                                            <TableHead className="w-20 text-right">Aksi</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {criteria.assessmentRubrics.map((rubric, rubricIdx) => (
                                                                            <TableRow key={rubric.id}>
                                                                                <TableCell>
                                                                                    <div className="flex items-center gap-0.5">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-5 w-5"
                                                                                            title="Pindah ke atas"
                                                                                            disabled={rubricIdx === 0}
                                                                                            onClick={() => handleMoveRubric(criteria, rubric.id, 'up')}
                                                                                        >
                                                                                            <ArrowUp className="h-3 w-3" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-5 w-5"
                                                                                            title="Pindah ke bawah"
                                                                                            disabled={rubricIdx === criteria.assessmentRubrics.length - 1}
                                                                                            onClick={() => handleMoveRubric(criteria, rubric.id, 'down')}
                                                                                        >
                                                                                            <ArrowDown className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                                <TableCell className="text-sm">
                                                                                    {rubric.minScore}–{rubric.maxScore}
                                                                                </TableCell>
                                                                                <TableCell className="text-sm whitespace-pre-wrap">
                                                                                    {rubric.description}
                                                                                </TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-7 w-7"
                                                                                            title="Ubah rubrik"
                                                                                            onClick={() => handleEditRubric(rubric, criteria.maxScore)}
                                                                                        >
                                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-7 w-7 text-destructive"
                                                                                            title="Hapus rubrik"
                                                                                            onClick={() => setDeleteRubricId(rubric.id)}
                                                                                        >
                                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        ) : (
                                                            <div className="p-3 text-center text-xs text-muted-foreground border rounded-md border-dashed">
                                                                Belum ada rubrik untuk kriteria ini.
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </CollapsibleContent>
                                </div>
                            </Collapsible>
                        );
                    })}
                </div>
            )}

            {/* Dialog form rubrik */}
            <DefenceRubricItemFormDialog
                open={rubricFormOpen}
                onOpenChange={setRubricFormOpen}
                criteriaMaxScore={rubricFormCriteriaMaxScore}
                editData={editRubric}
                onSubmit={
                    editRubric
                        ? (d: UpdateRubricPayload) => onUpdateRubric(editRubric.id, d)
                        : (d: CreateRubricPayload) => onCreateRubric(rubricFormCriteriaId, d)
                }
            />

            {/* Konfirmasi hapus kriteria */}
            <AlertDialog
                open={!!deleteCriteriaId}
                onOpenChange={(open: boolean) => !open && setDeleteCriteriaId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kriteria Sidang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kriteria beserta seluruh rubrik di dalamnya akan dihapus secara permanen.
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteCriteria}
                            disabled={isDeletingCriteria}
                            className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingCriteria ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Konfirmasi hapus CPMK */}
            <AlertDialog
                open={!!deleteCpmkId}
                onOpenChange={(open: boolean) => !open && setDeleteCpmkId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Konfigurasi CPMK Sidang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Semua kriteria dan rubrik sidang pada CPMK ini akan dihapus untuk role yang dipilih.
                            Data master CPMK tetap tersimpan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteCpmk}
                            disabled={isRemovingCpmk}
                            className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRemovingCpmk ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Konfirmasi hapus rubrik */}
            <AlertDialog
                open={!!deleteRubricId}
                onOpenChange={(open: boolean) => !open && setDeleteRubricId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Rubrik Sidang</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus level rubrik ini?
                            Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDeleteRubric}
                            disabled={isDeletingRubric}
                            className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingRubric ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
