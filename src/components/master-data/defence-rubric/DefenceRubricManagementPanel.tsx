import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDefenceRubric } from '@/hooks/master-data/useDefenceRubric';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { getActiveAcademicYearAPI } from '@/services/admin.service';
import { DefenceCriteriaTable } from '@/components/master-data/defence-rubric/DefenceCriteriaTable';
import { DefenceCriteriaFormDialog } from '@/components/master-data/defence-rubric/DefenceCriteriaFormDialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import type {
    AssessmentCriteria,
    CpmkWithRubrics,
    UpdateCriteriaPayload,
    DefenceRole,
} from '@/services/master-data/defence-rubric.service';

const ROLE_OPTIONS: { value: DefenceRole; label: string }[] = [
    { value: 'examiner', label: 'Penguji' },
    { value: 'supervisor', label: 'Pembimbing' },
];

export function DefenceRubricManagementPanel() {
    const [selectedRole, setSelectedRole] = useState<DefenceRole>('examiner');

    const { data: activeAcademicYearData } = useQuery({
        queryKey: ['defence-rubric-active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const activeAcademicYearId = activeAcademicYearData?.academicYear?.id;
    const {
        cpmks,
        weightSummary,
        isLoading,
        isFetching,
        refetch,
        createCriteria,
        updateCriteria,
        deleteCriteria,
        createRubric,
        updateRubric,
        deleteRubric,
        isDeletingCriteria,
        isDeletingRubric,
        reorderCriteria,
        reorderRubrics,
        removeCpmkConfig,
        isRemovingCpmkConfig,
    } = useDefenceRubric(selectedRole);

    const { cpmks: allCpmks } = useCpmk(activeAcademicYearId);

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);

    const examinerTotal = weightSummary?.examinerTotal ?? 0;
    const supervisorTotal = weightSummary?.supervisorTotal ?? 0;
    const combinedTotal = weightSummary?.combinedTotal ?? 0;
    const roleTotalScore = selectedRole === 'examiner' ? examinerTotal : supervisorTotal;
    const remainingScore = 100 - combinedTotal;

    const activeThesisCpmks = useMemo(
        () => allCpmks.filter((cpmk) => cpmk.type === 'thesis'),
        [allCpmks],
    );

    const mergedCpmks = useMemo(() => {
        const configuredMap = new Map(cpmks.map((item) => [item.id, item]));

        return activeThesisCpmks
            .map((cpmk) => {
                const configured = configuredMap.get(cpmk.id);
                if (configured) return configured;

                return {
                    id: cpmk.id,
                    code: cpmk.code,
                    description: cpmk.description,
                    displayOrder: 0,
                    hasAssessmentDetails: cpmk.hasAssessmentDetails,
                    assessmentCriterias: [],
                } as CpmkWithRubrics;
            })
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [activeThesisCpmks, cpmks]);

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

    const roleLabel = ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label ?? selectedRole;

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Rubrik Sidang Tugas Akhir</CardTitle>
                        <CardDescription>
                            Kelola kriteria dan rubrik penilaian sidang tugas akhir berdasarkan CPMK dan peran.
                        </CardDescription>
                    </div>
                    {weightSummary && (
                        <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 text-sm h-fit ${combinedTotal === 100
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : combinedTotal > 100
                                ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                : 'bg-muted/30'
                            }`}>
                            <span className="text-muted-foreground font-medium">Total Skor Gabungan:</span>
                            <span className={`text-lg font-bold ${combinedTotal === 100
                                ? 'text-green-600 dark:text-green-400'
                                : combinedTotal > 100
                                    ? 'text-red-600 dark:text-red-400'
                                    : ''
                                }`}>
                                {combinedTotal} / 100
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-muted/20 p-4 rounded-lg border">
                    <div className="flex gap-1 rounded-lg border bg-background p-1 w-fit shadow-sm">
                        {ROLE_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setSelectedRole(opt.value)}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedRole === opt.value
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {weightSummary && (
                        <div className="flex items-center gap-3 text-sm">
                            <span className="text-muted-foreground">Skor {roleLabel}:</span>
                            <span className="font-bold text-primary">{roleTotalScore}</span>
                            <span className="text-xs text-muted-foreground border-l pl-3">
                                Penguji: {examinerTotal} | Pembimbing: {supervisorTotal}
                            </span>
                        </div>
                    )}
                </div>

                <DefenceCriteriaTable
                    data={mergedCpmks}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onRefresh={() => refetch()}
                    onAddCriteria={handleOpenAddCriteria}
                    onEditCriteria={handleEditCriteria}
                    onDeleteCriteria={deleteCriteria}
                    onCreateRubric={createRubric}
                    onUpdateRubric={updateRubric}
                    onDeleteRubric={deleteRubric}
                    onRemoveCpmkConfig={removeCpmkConfig}
                    onReorderCriteria={reorderCriteria}
                    onReorderRubrics={reorderRubrics}
                    isDeletingCriteria={isDeletingCriteria}
                    isDeletingRubric={isDeletingRubric}
                    isRemovingCpmkConfig={isRemovingCpmkConfig}
                />
            </CardContent>

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
        </Card>
    );
}
