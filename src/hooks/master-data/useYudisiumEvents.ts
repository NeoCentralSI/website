import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createYudisiumEvent,
    deleteYudisiumEvent,
    getYudisiumEvents,
    updateYudisiumEvent,
    type CreateYudisiumPayload,
    type UpdateYudisiumPayload,
} from '@/services/yudisium.service';

const QUERY_KEY = ['yudisium-events'];

export function useYudisiumEvents() {
    const queryClient = useQueryClient();

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getYudisiumEvents,
    });

    const createMutation = useMutation({
        mutationFn: createYudisiumEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data yudisium berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateYudisiumPayload }) =>
            updateYudisiumEvent(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data yudisium berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteYudisiumEvent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data yudisium berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        events: data ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (payload: CreateYudisiumPayload) => createMutation.mutateAsync(payload),
        update: (id: string, payload: UpdateYudisiumPayload) =>
            updateMutation.mutateAsync({ id, data: payload }),
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
