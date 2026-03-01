import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createYudisiumRequirement,
    deleteYudisiumRequirement,
    getYudisiumRequirements,
    moveYudisiumRequirementToBottom,
    moveYudisiumRequirementToTop,
    toggleYudisiumRequirement,
    updateYudisiumRequirement,
    type CreateYudisiumRequirementPayload,
    type UpdateYudisiumRequirementPayload,
} from '@/services/yudisiumRequirement.service';

const QUERY_KEY = ['yudisium-requirements'];

export function useYudisiumRequirements() {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getYudisiumRequirements,
    });

    const createMutation = useMutation({
        mutationFn: createYudisiumRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Persyaratan yudisium berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateYudisiumRequirementPayload }) =>
            updateYudisiumRequirement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Persyaratan yudisium berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: toggleYudisiumRequirement,
        onSuccess: (item) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(
                item.isActive
                    ? 'Persyaratan yudisium berhasil diaktifkan'
                    : 'Persyaratan yudisium berhasil dinonaktifkan',
            );
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteYudisiumRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Persyaratan yudisium berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const moveTopMutation = useMutation({
        mutationFn: moveYudisiumRequirementToTop,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Persyaratan berhasil dipindahkan ke urutan teratas');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const moveBottomMutation = useMutation({
        mutationFn: moveYudisiumRequirementToBottom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Persyaratan berhasil dipindahkan ke urutan terbawah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        requirements: data ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (payload: CreateYudisiumRequirementPayload) => createMutation.mutateAsync(payload),
        update: (id: string, payload: UpdateYudisiumRequirementPayload) =>
            updateMutation.mutateAsync({ id, data: payload }),
        toggle: toggleMutation.mutate,
        remove: deleteMutation.mutate,
        moveTop: moveTopMutation.mutate,
        moveBottom: moveBottomMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isMoving: moveTopMutation.isPending || moveBottomMutation.isPending,
    };
}
