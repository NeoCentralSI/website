import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpls,
    createCpl,
    updateCpl,
    toggleCpl,
    deleteCpl,
    exportAllCplStudentScores,
    type CreateCplPayload,
    type UpdateCplPayload,
    type GetCplsParams,
} from '@/services/master-data/cpl.service';

const QUERY_KEY = ['cpls'];

export function useCpl() {
    const queryClient = useQueryClient();
    const [params, setParams] = useState<GetCplsParams>({
        status: 'active',
        search: '',
        page: 1,
        limit: 10,
    });

    const { data: cpls, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...QUERY_KEY, params],
        queryFn: () => getCpls(params),
    });

    const createMutation = useMutation({
        mutationFn: createCpl,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPL berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCplPayload }) =>
            updateCpl(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPL berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: toggleCpl,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(data.isActive ? 'CPL berhasil diaktifkan' : 'CPL berhasil dinonaktifkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCpl,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPL berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const exportAllMutation = useMutation({
        mutationFn: exportAllCplStudentScores,
        onSuccess: () => {
            toast.success('Export semua nilai CPL berhasil diunduh');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        cpls: cpls?.data ?? [],
        total: cpls?.total ?? 0,
        isLoading,
        isFetching,
        refetch,
        params,
        setParams,
        create: (data: CreateCplPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateCplPayload) => updateMutation.mutateAsync({ id, data }),
        toggle: toggleMutation.mutate,
        remove: deleteMutation.mutate,
        exportAllScores: () => exportAllMutation.mutateAsync(),
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isExportingAllScores: exportAllMutation.isPending,
    };
}
