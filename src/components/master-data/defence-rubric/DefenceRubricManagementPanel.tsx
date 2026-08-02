import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDefenceRubric } from '@/hooks/master-data/useDefenceRubric';
import { useThesisCpmk } from '@/hooks/master-data/useThesisCpmk';
import { getAcademicYearsAPI, getActiveAcademicYearAPI } from '@/services/admin.service';
import { DefenceCriteriaTable } from '@/components/master-data/defence-rubric/DefenceCriteriaTable';
import { DefenceCriteriaFormDialog } from '@/components/master-data/defence-rubric/DefenceCriteriaFormDialog';
import { MinimumScoreDialog } from '@/components/master-data/MinimumScoreDialog';
import { DefenceRubricPreviewDialog } from '@/components/master-data/defence-rubric/DefenceRubricPreviewDialog';
import { Button } from '@/components/ui/button';
import { Eye, Settings } from 'lucide-react';
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
    DefenceRole,
} from '@/services/master-data/defence-rubric.service';

const ROLE_OPTIONS: { value: DefenceRole; label: string }[] = [
    { value: 'examiner', label: 'Penguji' },
    { value: 'supervisor', label: 'Pembimbing' },
];

export function DefenceRubricManagementPanel() {
    const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>();
    const [selectedRole, setSelectedRole] = useState<DefenceRole>('examiner');

    const { data: academicYearsData, isLoading: isAcademicYearsLoading } = useQuery({
        queryKey: ['defence-rubric-academic-years'],
        queryFn: () => getAcademicYearsAPI({ page: 1, pageSize: 100 }),
    });

    const { data: activeAcademicYearData, isLoading: isActiveAcademicYearLoading } = useQuery({
        queryKey: ['defence-rubric-active-academic-year'],
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
    } = useDefenceRubric(selectedRole, effectiveAcademicYearId);

    const { thesisCpmks: allCpmks } = useThesisCpmk(effectiveAcademicYearId);

    const [criteriaDialogOpen, setCriteriaDialogOpen] = useState(false);
    const [criteriaTargetCpmk, setCriteriaTargetCpmk] = useState<CpmkWithRubrics | null>(null);
    const [editCriteria, setEditCriteria] = useState<AssessmentCriteria | null>(null);
    const [minScoreDialogOpen, setMinScoreDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);

    const examinerTotal = weightSummary?.examinerTotal ?? 0;
    const supervisorTotal = weightSummary?.supervisorTotal ?? 0;
    const combinedTotal = weightSummary?.combinedTotal ?? 0;
    const roleTotalScore = selectedRole === 'examiner' ? examinerTotal : supervisorTotal;
    const remainingScore = 100 - combinedTotal;

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
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-fit py-2"
                            onClick={() => setPreviewOpen(true)}
                            disabled={!mergedCpmks.some((cpmk) => cpmk.assessmentCriterias.length > 0)}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview Form Penilaian
                        </Button>
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
                    <div className="flex flex-col gap-2 items-end">
                        <div className="flex items-center gap-2">
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
                </div>
                <DefenceCriteriaTable
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
            <DefenceRubricPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                cpmks={mergedCpmks}
                role={selectedRole}
                minimumPassingScore={weightSummary?.minimumScore ?? 0}
            />
        </Card>
    );
}

