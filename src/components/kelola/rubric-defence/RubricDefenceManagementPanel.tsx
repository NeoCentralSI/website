import { useMemo, useState } from 'react';
import { useRubricDefence } from '@/hooks/master-data/useRubricDefence';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { DefenceCriteriaTable } from '@/components/kelola/rubric-defence/DefenceCriteriaTable';
import { DefenceCriteriaFormDialog } from '@/components/kelola/rubric-defence/DefenceCriteriaFormDialog';
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
    DefenceRole,
} from '@/services/rubricDefence.service';

const ROLE_OPTIONS: { value: DefenceRole; label: string }[] = [
    { value: 'examiner', label: 'Penguji' },
    { value: 'supervisor', label: 'Pembimbing' },
];

export function RubricDefenceManagementPanel() {
    const [selectedRole, setSelectedRole] = useState<DefenceRole>('examiner');

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
        reorderCriteria,
        reorderRubrics,
    } = useRubricDefence(selectedRole);

    const { cpmks: allCpmks } = useCpmk();

    const [addCpmkOpen, setAddCpmkOpen] = useState(false);
    const [selectedAddCpmkId, setSelectedAddCpmkId] = useState<string>('');

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);

    const [localCpmkIds, setLocalCpmkIds] = useState<Record<DefenceRole, string[]>>({
        examiner: [],
        supervisor: [],
    });

    const globalTotalScore = weightSummary?.globalTotalScore ?? 0;
    const roleTotalScore = weightSummary?.totalScore ?? 0;
    const remainingScore = 100 - globalTotalScore;

    const activeThesisCpmks = useMemo(
        () => allCpmks.filter((cpmk) => cpmk.type === 'thesis'),
        [allCpmks],
    );

    const currentLocalIds = localCpmkIds[selectedRole];

    const mergedCpmks = useMemo(() => {
        const backendIds = new Set(cpmks.map((cpmk) => cpmk.id));
        const localContainers = activeThesisCpmks
            .filter((cpmk) => currentLocalIds.includes(cpmk.id) && !backendIds.has(cpmk.id))
            .map((cpmk) => ({
                id: cpmk.id,
                code: cpmk.code,
                description: cpmk.description,
                displayOrder: 0,
                assessmentCriterias: [] as AssessmentCriteria[],
            }));

        return [...cpmks, ...localContainers].sort((a, b) =>
            a.code.localeCompare(b.code),
        );
    }, [activeThesisCpmks, cpmks, currentLocalIds]);

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
        setLocalCpmkIds((prev) => ({
            ...prev,
            [selectedRole]: [...prev[selectedRole], selectedAddCpmkId],
        }));
        setSelectedAddCpmkId('');
        setAddCpmkOpen(false);
    };

    const handleDeleteCpmk = async (cpmkId: string) => {
        const isLocalOnly = currentLocalIds.includes(cpmkId) && !cpmks.some((c) => c.id === cpmkId);

        if (isLocalOnly) {
            setLocalCpmkIds((prev) => ({
                ...prev,
                [selectedRole]: prev[selectedRole].filter((id) => id !== cpmkId),
            }));
            return;
        }

        await removeCpmkConfig(cpmkId);
        setLocalCpmkIds((prev) => ({
            ...prev,
            [selectedRole]: prev[selectedRole].filter((id) => id !== cpmkId),
        }));
    };

    const roleLabel = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label ?? selectedRole;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Rubrik Sidang</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola kriteria dan rubrik penilaian sidang berdasarkan CPMK dan role
                    </p>
                </div>
                <Button onClick={() => setAddCpmkOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah CPMK
                </Button>
            </div>

            {/* Role tabs */}
            <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
                {ROLE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setSelectedRole(opt.value)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedRole === opt.value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* Score summary */}
            {weightSummary && (
                <div className="space-y-2">
                    {/* Global total cap */}
                    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                        globalTotalScore === 100
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : globalTotalScore > 100
                              ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                              : 'bg-muted/30'
                    }`}>
                        <span className="text-muted-foreground">Total Skor Gabungan (Penguji + Pembimbing):</span>
                        <span className={`text-lg font-bold ${
                            globalTotalScore === 100
                                ? 'text-green-600 dark:text-green-400'
                                : globalTotalScore > 100
                                  ? 'text-red-600 dark:text-red-400'
                                  : ''
                        }`}>
                            {globalTotalScore} / 100
                        </span>
                        {globalTotalScore < 100 && (
                            <span className="text-xs text-muted-foreground">
                                (sisa: {100 - globalTotalScore})
                            </span>
                        )}
                    </div>
                    {/* Per-role total */}
                    <div className="flex items-center gap-3 rounded-lg border px-4 py-2 text-sm bg-muted/20">
                        <span className="text-muted-foreground">Skor {roleLabel}:</span>
                        <span className="font-semibold">{roleTotalScore}</span>
                        <span className="text-xs text-muted-foreground">
                            ({weightSummary.details.length} CPMK, {weightSummary.details.reduce((s, d) => s + d.criteriaCount, 0)} kriteria)
                        </span>
                    </div>
                </div>
            )}

            {/* CPMK + criteria + rubric tree */}
            <DefenceCriteriaTable
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
                onReorderCriteria={reorderCriteria}
                onReorderRubrics={reorderRubrics}
                isDeletingCriteria={isDeletingCriteria}
                isRemovingCpmk={isRemovingCpmkConfig}
                isDeletingRubric={isDeletingRubric}
            />

            {/* Criteria form dialog */}
            <DefenceCriteriaFormDialog
                open={criteriaDialogOpen}
                onOpenChange={setCriteriaDialogOpen}
                cpmkId={criteriaTargetCpmk?.id ?? ''}
                cpmkCode={criteriaTargetCpmk?.code ?? '-'}
                role={selectedRole}
                editData={editCriteria}
                remainingScore={
                    editCriteria
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
                        <DialogTitle>Tambah CPMK ke Sidang ({roleLabel})</DialogTitle>
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
                                Semua CPMK aktif sudah digunakan untuk role ini.
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
