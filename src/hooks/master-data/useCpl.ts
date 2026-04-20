import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpls,
    createCpl,
    updateCpl,
    toggleCpl,
    deleteCpl,
    type CreateCplPayload,
    type UpdateCplPayload,
} from '@/services/master-data/cpl.service';

const QUERY_KEY = ['cpls'];

export function useCpl() {
    const queryClient = useQueryClient();

    const { data: cpls, isLoading, isFetching, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getCpls,
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

    return {
        cpls: cpls ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (data: CreateCplPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateCplPayload) => updateMutation.mutateAsync({ id, data }),
        toggle: toggleMutation.mutate,
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
