import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeminarRubric } from '@/hooks/master-data/useSeminarRubric';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { getActiveAcademicYearAPI } from '@/services/admin.service';
import { CriteriaTable } from '@/components/master-data/seminar-rubric/CriteriaTable';
import { CriteriaFormDialog } from '@/components/master-data/seminar-rubric/CriteriaFormDialog';
import type {
    AssessmentCriteria,
    CpmkWithRubrics,
    UpdateCriteriaPayload,
} from '@/services/master-data/seminar-rubric.service';

export function SeminarRubricManagementPanel() {
    const { data: activeAcademicYearData } = useQuery({
        queryKey: ['seminar-rubric-active-academic-year'],
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
    } = useSeminarRubric();

    const { cpmks: allCpmks } = useCpmk(activeAcademicYearId);

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);

    const currentTotalScore = weightSummary?.totalScore ?? 0;
    const remainingScore = 100 - currentTotalScore;

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

    return (
        <div className="space-y-4">
            <div>
                <div>
                    <h2 className="text-xl font-semibold">Rubrik Seminar</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola kriteria dan rubrik penilaian seminar berdasarkan CPMK
                    </p>
                </div>
            </div>

            {weightSummary && (
                <div className={`sticky top-2 z-10 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${weightSummary.totalScore === 100
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                    : weightSummary.totalScore > 100
                        ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                        : 'bg-muted/30'
                    }`}>
                    <span className="text-muted-foreground">Total Skor Kriteria Aktif:</span>
                    <span className={`text-lg font-bold ${weightSummary.totalScore === 100
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

            <CriteriaTable
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

            <CriteriaFormDialog
                open={criteriaDialogOpen}
                onOpenChange={setCriteriaDialogOpen}
                cpmkId={criteriaTargetCpmk?.id ?? ''}
                cpmkCode={criteriaTargetCpmk?.code ?? '-'}
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
        </div>
    );
}
