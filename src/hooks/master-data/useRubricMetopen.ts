import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmksWithRubrics,
    createCriteria,
    updateCriteria,
    deleteCriteria,
    removeCpmkMetopenConfig,
    createRubric,
    updateRubric,
    deleteRubric,
    getWeightSummary,
    reorderCriteria,
    reorderRubrics,
    type MetopenRole,
    type CreateCriteriaPayload,
    type UpdateCriteriaPayload,
    type CreateRubricPayload,
    type UpdateRubricPayload,
} from '@/services/rubricMetopen.service';

const CPMKS_KEY = 'rubric-metopen-cpmks';
const WEIGHT_KEY = 'rubric-metopen-weight';

export function useRubricMetopen(role: MetopenRole) {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: [CPMKS_KEY, role] });
        queryClient.invalidateQueries({ queryKey: [WEIGHT_KEY, role] });
        const otherRole: MetopenRole = role === 'supervisor' ? 'default' : 'supervisor';
        queryClient.invalidateQueries({ queryKey: [WEIGHT_KEY, otherRole] });
    };

    const {
        data: cpmks,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: [CPMKS_KEY, role],
        queryFn: () => getCpmksWithRubrics(role),
    });

    const {
        data: weightSummary,
        isLoading: isWeightLoading,
    } = useQuery({
        queryKey: [WEIGHT_KEY, role],
        queryFn: () => getWeightSummary(role),
    });

    const createCriteriaMutation = useMutation({
        mutationFn: createCriteria,
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria Metopel berhasil ditambahkan');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const updateCriteriaMutation = useMutation({
        mutationFn: ({ criteriaId, data }: { criteriaId: string; data: UpdateCriteriaPayload }) =>
            updateCriteria(criteriaId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria Metopel berhasil diubah');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const deleteCriteriaMutation = useMutation({
        mutationFn: deleteCriteria,
        onSuccess: () => {
            invalidateAll();
            toast.success('Kriteria Metopel berhasil dihapus');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const removeCpmkConfigMutation = useMutation({
        mutationFn: (cpmkId: string) => removeCpmkMetopenConfig(cpmkId, role),
        onSuccess: () => {
            invalidateAll();
            toast.success('Konfigurasi CPMK Metopel berhasil dihapus');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const createRubricMutation = useMutation({
        mutationFn: ({ criteriaId, data }: { criteriaId: string; data: CreateRubricPayload }) =>
            createRubric(criteriaId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik Metopel berhasil ditambahkan');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const updateRubricMutation = useMutation({
        mutationFn: ({ rubricId, data }: { rubricId: string; data: UpdateRubricPayload }) =>
            updateRubric(rubricId, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik Metopel berhasil diubah');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const deleteRubricMutation = useMutation({
        mutationFn: deleteRubric,
        onSuccess: () => {
            invalidateAll();
            toast.success('Rubrik Metopel berhasil dihapus');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const reorderCriteriaMutation = useMutation({
        mutationFn: ({ cpmkId, orderedIds }: { cpmkId: string; orderedIds: string[] }) =>
            reorderCriteria(cpmkId, orderedIds),
        onSuccess: () => { invalidateAll(); },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const reorderRubricsMutation = useMutation({
        mutationFn: ({ criteriaId, orderedIds }: { criteriaId: string; orderedIds: string[] }) =>
            reorderRubrics(criteriaId, orderedIds),
        onSuccess: () => { invalidateAll(); },
        onError: (error: Error) => { toast.error(error.message); },
    });

    return {
        cpmks: cpmks ?? [],
        weightSummary: weightSummary ?? null,
        isLoading,
        isWeightLoading,
        isFetching,
        refetch,

        createCriteria: (data: CreateCriteriaPayload) => createCriteriaMutation.mutateAsync(data),
        updateCriteria: (criteriaId: string, data: UpdateCriteriaPayload) =>
            updateCriteriaMutation.mutateAsync({ criteriaId, data }),
        deleteCriteria: deleteCriteriaMutation.mutate,
        removeCpmkConfig: removeCpmkConfigMutation.mutateAsync,
        isDeletingCriteria: deleteCriteriaMutation.isPending,
        isRemovingCpmkConfig: removeCpmkConfigMutation.isPending,

        createRubric: (criteriaId: string, data: CreateRubricPayload) =>
            createRubricMutation.mutateAsync({ criteriaId, data }),
        updateRubric: (rubricId: string, data: UpdateRubricPayload) =>
            updateRubricMutation.mutateAsync({ rubricId, data }),
        deleteRubric: deleteRubricMutation.mutate,
        isDeletingRubric: deleteRubricMutation.isPending,

        reorderCriteria: (cpmkId: string, orderedIds: string[]) =>
            reorderCriteriaMutation.mutateAsync({ cpmkId, orderedIds }),
        reorderRubrics: (criteriaId: string, orderedIds: string[]) =>
            reorderRubricsMutation.mutateAsync({ criteriaId, orderedIds }),
    };
}
