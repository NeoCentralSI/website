import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDefenceRubric } from '@/hooks/master-data/useDefenceRubric';
import { useCpmk } from '@/hooks/master-data/useCpmk';
import { getActiveAcademicYearAPI } from '@/services/admin.service';
import { DefenceCriteriaTable } from '@/components/master-data/defence-rubric/DefenceCriteriaTable';
import { DefenceCriteriaFormDialog } from '@/components/master-data/defence-rubric/DefenceCriteriaFormDialog';
import { Badge } from '@/components/ui/badge';
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

function academicYearLabel(semester?: string, year?: string | null) {
    const semesterLabel = semester === 'ganjil' ? 'Ganjil' : 'Genap';
    return `${semesterLabel} ${year || '-'}`.trim();
}

export function DefenceRubricManagementPanel() {
    const [selectedRole, setSelectedRole] = useState<DefenceRole>('examiner');

    const { data: activeAcademicYearData } = useQuery({
        queryKey: ['defence-rubric-active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const activeAcademicYearId = activeAcademicYearData?.academicYear?.id;
    const activeAcademicYearText = academicYearLabel(
        activeAcademicYearData?.academicYear?.semester,
        activeAcademicYearData?.academicYear?.year,
    );

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
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-semibold">Rubrik Sidang</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Kelola kriteria dan rubrik penilaian sidang berdasarkan CPMK dan role
                    </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                    Tahun Ajaran Aktif: {activeAcademicYearText}
                </Badge>
            </div>

            <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
                {ROLE_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setSelectedRole(opt.value)}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedRole === opt.value
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {weightSummary && (
                <div className="space-y-2 sticky top-2 z-10">
                    <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${combinedTotal === 100
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                        : combinedTotal > 100
                            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                            : 'bg-muted/30'
                        }`}>
                        <span className="text-muted-foreground">Total Skor Gabungan (Penguji + Pembimbing):</span>
                        <span className={`text-lg font-bold ${combinedTotal === 100
                            ? 'text-green-600 dark:text-green-400'
                            : combinedTotal > 100
                                ? 'text-red-600 dark:text-red-400'
                                : ''
                            }`}>
                            {combinedTotal} / 100
                        </span>
                        {combinedTotal < 100 && (
                            <span className="text-xs text-muted-foreground">
                                (sisa: {100 - combinedTotal})
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border px-4 py-2 text-sm bg-muted/20">
                        <span className="text-muted-foreground">Skor {roleLabel}:</span>
                        <span className="font-semibold">{roleTotalScore}</span>
                        <span className="text-xs text-muted-foreground">
                            (Penguji: {examinerTotal}, Pembimbing: {supervisorTotal})
                        </span>
                        <span className="text-xs text-muted-foreground">
                            ({weightSummary.details.length} CPMK, {weightSummary.details.reduce((s, d) => s + d.criteriaCount, 0)} kriteria)
                        </span>
                    </div>
                </div>
            )}

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
                onReorderCriteria={reorderCriteria}
                onReorderRubrics={reorderRubrics}
                isDeletingCriteria={isDeletingCriteria}
                isDeletingRubric={isDeletingRubric}
            />

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
        </div>
    );
}
