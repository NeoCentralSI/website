import { useMemo, useState } from 'react';
import { useRubricMetopen } from '@/hooks/master-data/useRubricMetopen';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { MetopenCriteriaTable } from '@/components/kelola/rubric-metopen/MetopenCriteriaTable';
import { MetopenCriteriaFormDialog } from '@/components/kelola/rubric-metopen/MetopenCriteriaFormDialog';
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type {
    AssessmentCriteria, CpmkWithRubrics, UpdateCriteriaPayload, MetopenRole,
} from '@/services/rubricMetopen.service';

const ROLE_OPTIONS: { value: MetopenRole; label: string; cap: number }[] = [
    { value: 'supervisor', label: 'Pembimbing (TA-03A)', cap: 75 },
    { value: 'default', label: 'Koordinator Metopen (TA-03B)', cap: 25 },
];

export function RubricMetopenManagementPanel() {
    const [selectedRole, setSelectedRole] = useState<MetopenRole>('supervisor');

    const {
        cpmks, weightSummary, isLoading, isFetching, refetch,
        createCriteria, updateCriteria, deleteCriteria, removeCpmkConfig,
        createRubric, updateRubric, deleteRubric,
        isDeletingCriteria, isRemovingCpmkConfig, isDeletingRubric,
        reorderCriteria, reorderRubrics,
    } = useRubricMetopen(selectedRole);

    const { cpmks: allCpmks } = useCpmk();

    const [addCpmkOpen, setAddCpmkOpen] = useState(false);
    const [selectedAddCpmkId, setSelectedAddCpmkId] = useState<string>('');
    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);
    const [localCpmkIds, setLocalCpmkIds] = useState<Record<MetopenRole, string[]>>({
        supervisor: [],
        default: [],
    });

    const roleOption = ROLE_OPTIONS.find((r) => r.value === selectedRole)!;
    const globalTotalScore = weightSummary?.globalTotalScore ?? 0;
    const roleTotalScore = weightSummary?.totalScore ?? 0;
    const remainingScore = roleOption.cap - roleTotalScore;

    const activeResearchCpmks = useMemo(
        () => allCpmks.filter((cpmk) => cpmk.type === 'research_method'),
        [allCpmks],
    );

    const currentLocalIds = localCpmkIds[selectedRole];

    const mergedCpmks = useMemo(() => {
        const backendIds = new Set(cpmks.map((cpmk) => cpmk.id));
        const localContainers = activeResearchCpmks
            .filter((cpmk) => currentLocalIds.includes(cpmk.id) && !backendIds.has(cpmk.id))
            .map((cpmk) => ({
                id: cpmk.id,
                code: cpmk.code,
                description: cpmk.description,
                displayOrder: 0,
                assessmentCriterias: [] as AssessmentCriteria[],
            }));
        return [...cpmks, ...localContainers].sort((a, b) => a.code.localeCompare(b.code));
    }, [activeResearchCpmks, cpmks, currentLocalIds]);

    const usedCpmkIds = useMemo(() => new Set(mergedCpmks.map((c) => c.id)), [mergedCpmks]);
    const availableForAdd = useMemo(
        () => activeResearchCpmks.filter((c) => !usedCpmkIds.has(c.id)),
        [activeResearchCpmks, usedCpmkIds],
    );

    const handleOpenAddCriteria = (cpmkId: string) => {
        setCriteriaTargetCpmk(mergedCpmks.find((c) => c.id === cpmkId) ?? null);
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

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Rubrik Penilaian Metode Penelitian</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola kriteria dan rubrik penilaian TA-03A (Pembimbing, maks 75) dan TA-03B (Koordinator Metopen, maks 25)
                    </p>
                </div>
                <Button onClick={() => setAddCpmkOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Tambah CPMK
                </Button>
            </div>

            <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
                {ROLE_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => setSelectedRole(opt.value)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                            selectedRole === opt.value
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}>
                        {opt.label}
                    </button>
                ))}
            </div>

            {weightSummary && (
                <div className="space-y-2">
                    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                        globalTotalScore === 100
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : globalTotalScore > 100
                              ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                              : 'bg-muted/30'
                    }`}>
                        <span className="text-muted-foreground">Total Skor Gabungan (TA-03A + TA-03B):</span>
                        <span className={`text-lg font-bold ${
                            globalTotalScore === 100 ? 'text-green-600 dark:text-green-400'
                            : globalTotalScore > 100 ? 'text-red-600 dark:text-red-400' : ''
                        }`}>{globalTotalScore} / 100</span>
                        {globalTotalScore < 100 && (
                            <span className="text-xs text-muted-foreground">(sisa: {100 - globalTotalScore})</span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border px-4 py-2 text-sm bg-muted/20">
                        <span className="text-muted-foreground">Skor {roleOption.label}:</span>
                        <span className="font-semibold">{roleTotalScore} / {roleOption.cap}</span>
                        <span className="text-xs text-muted-foreground">
                            ({weightSummary.details.length} CPMK, {weightSummary.details.reduce((s, d) => s + d.criteriaCount, 0)} kriteria)
                        </span>
                    </div>
                </div>
            )}

            <MetopenCriteriaTable
                data={mergedCpmks} isLoading={isLoading} isFetching={isFetching}
                onRefresh={() => refetch()} onAddCriteria={handleOpenAddCriteria}
                onEditCriteria={handleEditCriteria} onDeleteCriteria={deleteCriteria}
                onDeleteCpmk={handleDeleteCpmk} onCreateRubric={createRubric}
                onUpdateRubric={updateRubric} onDeleteRubric={deleteRubric}
                onReorderCriteria={reorderCriteria} onReorderRubrics={reorderRubrics}
                isDeletingCriteria={isDeletingCriteria} isRemovingCpmk={isRemovingCpmkConfig}
                isDeletingRubric={isDeletingRubric}
            />

            <MetopenCriteriaFormDialog
                open={criteriaDialogOpen} onOpenChange={setCriteriaDialogOpen}
                cpmkId={criteriaTargetCpmk?.id ?? ''} cpmkCode={criteriaTargetCpmk?.code ?? '-'}
                role={selectedRole} editData={editCriteria}
                remainingScore={editCriteria ? remainingScore + (editCriteria.maxScore || 0) : remainingScore}
                onSubmit={editCriteria
                    ? (data: UpdateCriteriaPayload) => updateCriteria(editCriteria.id, data)
                    : createCriteria}
            />

            <Dialog open={addCpmkOpen} onOpenChange={setAddCpmkOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Tambah CPMK ke Metopel ({roleOption.label})</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Select value={selectedAddCpmkId} onValueChange={setSelectedAddCpmkId}>
                            <SelectTrigger><SelectValue placeholder="Pilih CPMK Metode Penelitian..." /></SelectTrigger>
                            <SelectContent>
                                {availableForAdd.map((cpmk) => (
                                    <SelectItem key={cpmk.id} value={cpmk.id}>{cpmk.code} — {cpmk.description}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {availableForAdd.length === 0 && (
                            <p className="text-xs text-muted-foreground">Semua CPMK Metode Penelitian sudah digunakan untuk role ini.</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddCpmkOpen(false)}>Batal</Button>
                        <Button onClick={handleAddCpmk} disabled={!selectedAddCpmkId}>
                            <Plus className="mr-2 h-4 w-4" /> Tambahkan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
