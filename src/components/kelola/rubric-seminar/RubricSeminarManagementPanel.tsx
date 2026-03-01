import { useMemo, useState } from 'react';
import { useRubricSeminar } from '@/hooks/master-data/useRubricSeminar';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { CriteriaTable } from '@/components/kelola/rubric-seminar/CriteriaTable';
import { CriteriaFormDialog } from '@/components/kelola/rubric-seminar/CriteriaFormDialog';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type {
    AssessmentCriteria,
    CpmkWithRubrics,
    UpdateCriteriaPayload,
} from '@/services/rubricSeminar.service';

export function RubricSeminarManagementPanel() {
    const {
        cpmks,
        weightSummary,
        isLoading,
        isFetching,
        refetch,
        createCriteria,
        updateCriteria,
        deleteCriteria,
        removeCpmkConfig,
        createRubric,
        updateRubric,
        deleteRubric,
        isDeletingCriteria,
        isRemovingCpmkConfig,
        isDeletingRubric,
        toggleCriteriaActive,
        reorderCriteria,
        reorderRubrics,
        isTogglingCriteria,
    } = useRubricSeminar();

    const { cpmks: allCpmks } = useCpmk();

    const [addCpmkOpen, setAddCpmkOpen] = useState(false);
    const [selectedAddCpmkId, setSelectedAddCpmkId] = useState<string>('');

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);

    const [localCpmkIds, setLocalCpmkIds] = useState<string[]>([]);

    const currentTotalScore = weightSummary?.totalScore ?? 0;
    const remainingScore = 100 - currentTotalScore;

    const activeThesisCpmks = useMemo(
        () => allCpmks.filter((cpmk) => cpmk.isActive && cpmk.type === 'thesis'),
        [allCpmks],
    );

    const mergedCpmks = useMemo(() => {
        const backendIds = new Set(cpmks.map((cpmk) => cpmk.id));
        const localContainers = activeThesisCpmks
            .filter((cpmk) => localCpmkIds.includes(cpmk.id) && !backendIds.has(cpmk.id))
            .map((cpmk) => ({
                id: cpmk.id,
                code: cpmk.code,
                description: cpmk.description,
                isActive: cpmk.isActive,
                displayOrder: 0,
                assessmentCriterias: [],
            }));

        return [...cpmks, ...localContainers].sort((a, b) =>
            a.code.localeCompare(b.code),
        );
    }, [activeThesisCpmks, cpmks, localCpmkIds]);

    const usedCpmkIds = useMemo(
        () => new Set(mergedCpmks.map((cpmk) => cpmk.id)),
        [mergedCpmks],
    );

    const availableForAdd = useMemo(
        () => activeThesisCpmks.filter((cpmk) => !usedCpmkIds.has(cpmk.id)),
        [activeThesisCpmks, usedCpmkIds],
    );

    const handleOpenAddCriteria = (cpmkId: string) => {
        const target = mergedCpmks.find((cpmk) => cpmk.id === cpmkId) ?? null;
        setCriteriaTargetCpmk(target);
        setEditCriteria(null);
        setCriteriaDialogOpen(true);
    };

    const handleEditCriteria = (criteria: AssessmentCriteria, cpmk: CpmkWithRubrics) => {
        setCriteriaTargetCpmk(cpmk);
        setEditCriteria(criteria);
        setCriteriaDialogOpen(true);
    };

    const handleAddCpmk = () => {
        if (!selectedAddCpmkId) return;
        setLocalCpmkIds((prev) => [...prev, selectedAddCpmkId]);
        setSelectedAddCpmkId('');
        setAddCpmkOpen(false);
    };

    const handleDeleteCpmk = async (cpmkId: string) => {
        const isLocalOnly = localCpmkIds.includes(cpmkId) && !cpmks.some((c) => c.id === cpmkId);

        if (isLocalOnly) {
            setLocalCpmkIds((prev) => prev.filter((id) => id !== cpmkId));
            return;
        }

        await removeCpmkConfig(cpmkId);
        setLocalCpmkIds((prev) => prev.filter((id) => id !== cpmkId));
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Rubrik Seminar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola kriteria dan rubrik penilaian seminar berdasarkan CPMK
                    </p>
                </div>
                <Button onClick={() => setAddCpmkOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah CPMK
                </Button>
            </div>

            {/* Total score banner */}
            {weightSummary && (
                <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                    weightSummary.totalScore === 100
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : weightSummary.totalScore > 100
                          ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                          : 'bg-muted/30'
                }`}>
                    <span className="text-muted-foreground">Total Skor Kriteria Aktif:</span>
                    <span className={`text-lg font-bold ${
                        weightSummary.totalScore === 100
                            ? 'text-green-600 dark:text-green-400'
                            : weightSummary.totalScore > 100
                              ? 'text-red-600 dark:text-red-400'
                              : ''
                    }`}>
                        {weightSummary.totalScore} / 100
                    </span>
                    {weightSummary.totalScore < 100 && (
                        <span className="text-xs text-muted-foreground">
                            (sisa: {100 - weightSummary.totalScore})
                        </span>
                    )}
                </div>
            )}

            {/* CPMK + criteria + rubric tree */}
            <CriteriaTable
                data={mergedCpmks}
                isLoading={isLoading}
                isFetching={isFetching}
                onRefresh={() => refetch()}
                onAddCriteria={handleOpenAddCriteria}
                onEditCriteria={handleEditCriteria}
                onDeleteCriteria={deleteCriteria}
                onDeleteCpmk={handleDeleteCpmk}
                onCreateRubric={createRubric}
                onUpdateRubric={updateRubric}
                onDeleteRubric={deleteRubric}
                onToggleCriteriaActive={toggleCriteriaActive}
                onReorderCriteria={reorderCriteria}
                onReorderRubrics={reorderRubrics}
                isDeletingCriteria={isDeletingCriteria}
                isRemovingCpmk={isRemovingCpmkConfig}
                isDeletingRubric={isDeletingRubric}
                isTogglingCriteria={isTogglingCriteria}
            />

            {/* Criteria form dialog */}
            <CriteriaFormDialog
                open={criteriaDialogOpen}
                onOpenChange={setCriteriaDialogOpen}
                cpmkId={criteriaTargetCpmk?.id ?? ''}
                cpmkCode={criteriaTargetCpmk?.code ?? '-'}
                editData={editCriteria}
                remainingScore={
                    editCriteria && editCriteria.isActive
                        ? remainingScore + (editCriteria.maxScore || 0)
                        : remainingScore
                }
                onSubmit={editCriteria
                    ? (data: UpdateCriteriaPayload) => updateCriteria(editCriteria.id, data)
                    : createCriteria
                }
            />

            {/* Add CPMK dialog */}
            <Dialog open={addCpmkOpen} onOpenChange={setAddCpmkOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah CPMK ke Seminar</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-2">
                        <Select value={selectedAddCpmkId} onValueChange={setSelectedAddCpmkId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih CPMK aktif..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableForAdd.map((cpmk) => (
                                    <SelectItem key={cpmk.id} value={cpmk.id}>
                                        {cpmk.code} — {cpmk.description}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {availableForAdd.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                Semua CPMK aktif sudah digunakan.
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddCpmkOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleAddCpmk} disabled={!selectedAddCpmkId}>
                            <Plus className="mr-2 h-4 w-4" /> Tambahkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
