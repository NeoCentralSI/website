import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmksWithRubrics,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    removeCpmkSeminarConfig,
    createRubric,
    updateRubric,
    deleteRubric,
    getWeightSummary,
    reorderCriteria,
    reorderRubrics,
    type CreateCriteriaPayload,
    type UpdateCriteriaPayload,
    type CreateRubricPayload,
    type UpdateRubricPayload,
} from '@/services/rubricSeminar.service';

const CPMKS_KEY = ['rubric-seminar-cpmks'];
const WEIGHT_KEY = ['rubric-seminar-weight'];

export function useRubricSeminar() {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: CPMKS_KEY });
        queryClient.invalidateQueries({ queryKey: WEIGHT_KEY });
    };

    // ── CPMK + rubrics query ─────────────────
    const {
        data: cpmks,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: CPMKS_KEY,
        queryFn: getCpmksWithRubrics,
    });

    // ── Weight summary query ─────────────────
    const {
        data: weightSummary,
        isLoading: isWeightLoading,
    } = useQuery({
        queryKey: WEIGHT_KEY,
        queryFn: getWeightSummary,
    });

    // ── Criteria mutations ───────────────────
    const createCriteriaMutation = useMutation({
        mutationFn: createCriteria,
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria seminar berhasil ditambahkan');
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
        }) => updateCriteria(criteriaId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria seminar berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteCriteriaMutation = useMutation({
        mutationFn: deleteCriteria,
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria seminar berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const removeCpmkConfigMutation = useMutation({
        mutationFn: removeCpmkSeminarConfig,
        onSuccess: () => {
            invalidateAll();
            toast.success('Konfigurasi CPMK seminar berhasil dihapus');
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
        }) => createRubric(criteriaId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Update rubric mutation ───────────────
    const updateRubricMutation = useMutation({
        mutationFn: ({
            rubricId,
            data,
        }: {
            rubricId: string;
            data: UpdateRubricPayload;
        }) => updateRubric(rubricId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    // ── Delete rubric mutation ───────────────
    const deleteRubricMutation = useMutation({
        mutationFn: deleteRubric,
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik berhasil dihapus');
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
        }) => reorderCriteria(cpmkId, orderedIds),
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
        }) => reorderRubrics(criteriaId, orderedIds),
        onSuccess: () => {
            invalidateAll();
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
    };
}
