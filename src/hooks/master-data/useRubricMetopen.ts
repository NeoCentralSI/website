import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmksWithRubrics,
    getAllMetopenCpmks,
    createMetopenCpmk,
    updateMetopenCpmk,
    deleteMetopenCpmk,
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
    type CreateMetopenCpmkPayload,
    type UpdateMetopenCpmkPayload,
} from '@/services/rubricMetopen.service';

const CPMKS_KEY = 'rubric-metopen-cpmks';
const ALL_CPMKS_KEY = 'rubric-metopen-all-cpmks';
const WEIGHT_KEY = 'rubric-metopen-weight';

export function useRubricMetopen(role: MetopenRole) {
    const queryClient = useQueryClient();

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: [CPMKS_KEY, role] });
        queryClient.invalidateQueries({ queryKey: [ALL_CPMKS_KEY] });
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

    const {
        data: allMetopenCpmks,
    } = useQuery({
        queryKey: [ALL_CPMKS_KEY],
        queryFn: getAllMetopenCpmks,
    });

    const createCpmkMutation = useMutation({
        mutationFn: createMetopenCpmk,
        onSuccess: () => {
            invalidateAll();
            toast.success('CPMK Metopel berhasil ditambahkan');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const updateCpmkMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateMetopenCpmkPayload }) =>
            updateMetopenCpmk(id, data),
        onSuccess: () => {
            invalidateAll();
            toast.success('CPMK Metopel berhasil diubah');
        },
        onError: (error: Error) => { toast.error(error.message); },
    });

    const deleteCpmkMutation = useMutation({
        mutationFn: deleteMetopenCpmk,
        onSuccess: () => {
            invalidateAll();
            toast.success('CPMK Metopel berhasil dihapus dari katalog');
        },
        onError: (error: Error) => { toast.error(error.message); },
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

    const cpmkList = Array.isArray(cpmks) ? cpmks : [];
    const allMetopenCpmkList = Array.isArray(allMetopenCpmks) ? allMetopenCpmks : [];

    return {
        cpmks: cpmkList,
        allMetopenCpmks: allMetopenCpmkList,
        weightSummary: weightSummary ?? null,
        isLoading,
        isWeightLoading,
        isFetching,
        refetch,

        createCpmk: (data: CreateMetopenCpmkPayload) => createCpmkMutation.mutateAsync(data),
        isCreatingCpmk: createCpmkMutation.isPending,
        updateCpmk: (id: string, data: UpdateMetopenCpmkPayload) =>
            updateCpmkMutation.mutateAsync({ id, data }),
        isUpdatingCpmk: updateCpmkMutation.isPending,
        deleteCpmkMaster: deleteCpmkMutation.mutateAsync,
        isDeletingCpmkMaster: deleteCpmkMutation.isPending,

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
