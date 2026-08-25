import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmksWithRubrics,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    removeCpmkDefenceConfig,
    createRubric,
    updateRubric,
    deleteRubric,
    getWeightSummary,
    reorderCriteria,
    reorderRubrics,
    updateMinimumScore,
    type DefenceRole,
    type CreateCriteriaPayload,
    type UpdateCriteriaPayload,
    type CreateRubricPayload,
    type UpdateRubricPayload,
} from '@/services/master-data/defence-rubric.service';

const CPMKS_KEY = 'defence-rubric-cpmks';
const WEIGHT_KEY = 'defence-rubric-weight';

export function useDefenceRubric(role: DefenceRole, academicYearId?: string) {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: [CPMKS_KEY, role] });
        queryClient.invalidateQueries({ queryKey: [WEIGHT_KEY, role] });
        // Also invalidate other role's weight since cap is shared
        const otherRole = role === 'examiner' ? 'supervisor' : 'examiner';
        queryClient.invalidateQueries({ queryKey: [WEIGHT_KEY, otherRole] });
    };

    // ── CPMK + rubrics query (per role) ──────
    const {
        data: cpmks,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: [CPMKS_KEY, role, academicYearId],
        queryFn: () => getCpmksWithRubrics(role, { academicYearId }),
        enabled: Boolean(academicYearId),
    });

    // ── Weight summary query (per role) ──────
    const {
        data: weightSummary,
        isLoading: isWeightLoading,
    } = useQuery({
        queryKey: [WEIGHT_KEY, role, academicYearId],
        queryFn: () => getWeightSummary(role, { academicYearId }),
        enabled: Boolean(academicYearId),
    });

    // ── Criteria mutations ───────────────────
    const createCriteriaMutation = useMutation({
        mutationFn: createCriteria,
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria sidang berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateCriteriaMutation = useMutation({
        mutationFn: ({
            criteriaId,
            data,
        }: {
            criteriaId: string;
            data: UpdateCriteriaPayload;
        }) => updateCriteria(criteriaId, data, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria sidang berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteCriteriaMutation = useMutation({
        mutationFn: (criteriaId: string) => deleteCriteria(criteriaId, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria sidang berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const removeCpmkConfigMutation = useMutation({
        mutationFn: (cpmkId: string) => removeCpmkDefenceConfig(cpmkId, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Konfigurasi CPMK sidang berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Rubric mutations ─────────────────────
    const createRubricMutation = useMutation({
        mutationFn: ({
            criteriaId,
            data,
        }: {
            criteriaId: string;
            data: CreateRubricPayload;
        }) => createRubric(criteriaId, data, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik sidang berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateRubricMutation = useMutation({
        mutationFn: ({
            rubricId,
            data,
        }: {
            rubricId: string;
            data: UpdateRubricPayload;
        }) => updateRubric(rubricId, data, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik sidang berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteRubricMutation = useMutation({
        mutationFn: (rubricId: string) => deleteRubric(rubricId, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik sidang berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Reorder criteria mutation ────────────
    const reorderCriteriaMutation = useMutation({
        mutationFn: ({
            cpmkId,
            orderedIds,
        }: {
            cpmkId: string;
            orderedIds: string[];
        }) => reorderCriteria(cpmkId, orderedIds, role),
        onSuccess: () => {
            invalidateAll();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Reorder rubrics mutation ─────────────
    const reorderRubricsMutation = useMutation({
        mutationFn: ({
            criteriaId,
            orderedIds,
        }: {
            criteriaId: string;
            orderedIds: string[];
        }) => reorderRubrics(criteriaId, orderedIds, role),
        onSuccess: () => {
            invalidateAll();
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Update minimum score mutation ────────
    const updateMinimumScoreMutation = useMutation({
        mutationFn: updateMinimumScore,
        onSuccess: () => {
            invalidateAll();
            toast.success('Skor minimum sidang berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        // Data
        cpmks: cpmks ?? [],
        weightSummary: weightSummary ?? null,
        isLoading,
        isWeightLoading,
        isFetching,
        refetch,

        // Criteria actions
        createCriteria: (data: CreateCriteriaPayload) =>
            createCriteriaMutation.mutateAsync(data),
        updateCriteria: (criteriaId: string, data: UpdateCriteriaPayload) =>
            updateCriteriaMutation.mutateAsync({ criteriaId, data }),
        deleteCriteria: deleteCriteriaMutation.mutate,
        removeCpmkConfig: removeCpmkConfigMutation.mutateAsync,
        isCreatingCriteria: createCriteriaMutation.isPending,
        isUpdatingCriteria: updateCriteriaMutation.isPending,
        isDeletingCriteria: deleteCriteriaMutation.isPending,
        isRemovingCpmkConfig: removeCpmkConfigMutation.isPending,

        // Rubric actions
        createRubric: (criteriaId: string, data: CreateRubricPayload) =>
            createRubricMutation.mutateAsync({ criteriaId, data }),
        updateRubric: (rubricId: string, data: UpdateRubricPayload) =>
            updateRubricMutation.mutateAsync({ rubricId, data }),
        deleteRubric: deleteRubricMutation.mutate,
        isCreatingRubric: createRubricMutation.isPending,
        isUpdatingRubric: updateRubricMutation.isPending,
        isDeletingRubric: deleteRubricMutation.isPending,

        // Reorder actions
        reorderCriteria: (cpmkId: string, orderedIds: string[]) =>
            reorderCriteriaMutation.mutateAsync({ cpmkId, orderedIds }),
        reorderRubrics: (criteriaId: string, orderedIds: string[]) =>
            reorderRubricsMutation.mutateAsync({ criteriaId, orderedIds }),
            
        // Settings actions
        updateMinimumScore: updateMinimumScoreMutation.mutateAsync,
        isUpdatingMinimumScore: updateMinimumScoreMutation.isPending,
    };
}
