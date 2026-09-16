import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCurriculums,
    createCurriculum,
    updateCurriculum,
    deleteCurriculum,
    type CreateCurriculumPayload,
    type UpdateCurriculumPayload,
    type GetCurriculumsParams,
} from '@/services/master-data/curriculum.service';

const QUERY_KEY = ['curriculums'];

export function useCurriculum() {
    const queryClient = useQueryClient();
    const [params, setParams] = useState<GetCurriculumsParams>({
        search: '',
        page: 1,
        limit: 10,
    });

    const { data: curriculums, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...QUERY_KEY, params],
        queryFn: () => getCurriculums(params),
    });

    const createMutation = useMutation({
        mutationFn: createCurriculum,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Kurikulum berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCurriculumPayload }) =>
            updateCurriculum(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Kurikulum berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCurriculum,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Kurikulum berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        curriculums: curriculums?.data ?? [],
        total: curriculums?.total ?? 0,
        isLoading,
        isFetching,
        refetch,
        params,
        setParams,
        create: (data: CreateCurriculumPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateCurriculumPayload) => updateMutation.mutateAsync({ id, data }),
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
