import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmks,
    createCpmk,
    updateCpmk,
    toggleCpmk,
    deleteCpmk,
    type CreateCpmkPayload,
    type UpdateCpmkPayload,
} from '@/services/cpmk.service';

const QUERY_KEY = ['cpmks'];

export function useCpmk() {
    const queryClient = useQueryClient();

    const { data: cpmks, isLoading, isFetching, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getCpmks,
    });

    const createMutation = useMutation({
        mutationFn: createCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPMK berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateCpmkPayload }) =>
            updateCpmk(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPMK berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: toggleCpmk,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(data.isActive ? 'CPMK berhasil diaktifkan' : 'CPMK berhasil dinonaktifkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPMK berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        cpmks: cpmks ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (data: CreateCpmkPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateCpmkPayload) => updateMutation.mutateAsync({ id, data }),
        toggle: toggleMutation.mutate,
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
