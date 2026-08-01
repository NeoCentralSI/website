import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSeminarRubric } from '@/hooks/master-data/useSeminarRubric';
import { useThesisCpmk } from '@/hooks/master-data/useThesisCpmk';
import { getAcademicYearsAPI, getActiveAcademicYearAPI } from '@/services/admin.service';
import { CriteriaTable } from '@/components/master-data/seminar-rubric/CriteriaTable';
import { CriteriaFormDialog } from '@/components/master-data/seminar-rubric/CriteriaFormDialog';
import { MinimumScoreDialog } from '@/components/master-data/MinimumScoreDialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
} from '@/services/master-data/seminar-rubric.service';

export function SeminarRubricManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>();

    const { data: academicYearsData, isLoading: isAcademicYearsLoading } = useQuery({
        queryKey: ['seminar-rubric-academic-years'],
        queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    });
    const { data: activeAcademicYearData, isLoading: isActiveAcademicYearLoading } = useQuery({
        queryKey: ['seminar-rubric-active-academic-year'],
        queryFn: getActiveAcademicYearAPI,
    });

    const effectiveAcademicYearId = selectedAcademicYearId || activeAcademicYearData?.academicYear?.id;
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
        updateMinimumScore,
        isUpdatingMinimumScore,
    } = useSeminarRubric(effectiveAcademicYearId);

    const { thesisCpmks: allCpmks } = useThesisCpmk(effectiveAcademicYearId);

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);
    const [minScoreDialogOpen, setMinScoreDialogOpen] = useState(false);

    const currentTotalScore = weightSummary?.totalScore ?? 0;
    const remainingScore = 100 - currentTotalScore;

    const activeThesisCpmks = useMemo(
        () => allCpmks,
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
                    hasAssessmentDetails: false,
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
        <Card className="shadow-sm">
            <CardHeader>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Rubrik Seminar Hasil</CardTitle>
                        <CardDescription>
                            Kelola kriteria dan rubrik penilaian seminar hasil tugas akhir berdasarkan CPMK.
                        </CardDescription>
                        <div className="mt-3 w-full sm:w-[240px]">
                            <Select value={effectiveAcademicYearId || ''} onValueChange={setSelectedAcademicYearId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tahun ajaran" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(academicYearsData?.academicYears ?? []).map((item) => (
                                        <SelectItem key={item.id} value={item.id}>
                                            {(item.semester === 'ganjil' ? 'Ganjil' : 'Genap') + ' ' + (item.year || '')}
                                            {item.isActive ? ' (Aktif)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                        {weightSummary && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-fit py-2"
                                onClick={() => setMinScoreDialogOpen(true)}
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Min Lulus: {weightSummary.minimumScore || 0}
                            </Button>
                        )}
                        {weightSummary && (
                        <div className={`flex items-center gap-3 rounded-lg border px-4 py-2 text-sm h-fit ${weightSummary.totalScore === 100
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                            : weightSummary.totalScore > 100
                                ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                : 'bg-muted/30'
                            }`}>
                            <span className="text-muted-foreground font-medium">Total Skor:</span>
                            <span className={`text-lg font-bold ${weightSummary.totalScore === 100
                                ? 'text-green-600 dark:text-green-400'
                                : weightSummary.totalScore > 100
                                    ? 'text-red-600 dark:text-red-400'
                                    : ''
                                }`}>
                                {weightSummary.totalScore} / 100
                            </span>
                        </div>
                    )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <CriteriaTable
                    data={mergedCpmks}
                    isLoading={isLoading || isAcademicYearsLoading || isActiveAcademicYearLoading}
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
            <MinimumScoreDialog
                open={minScoreDialogOpen}
                onOpenChange={setMinScoreDialogOpen}
                currentScore={weightSummary?.minimumScore || 0}
                isLoading={isUpdatingMinimumScore}
                onSubmit={(score) => {
                    if (effectiveAcademicYearId) {
                        void updateMinimumScore({ academicYearId: effectiveAcademicYearId, minimumScore: score });
                    }
                }}
            />
        </Card>
    );
}
