import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getMyAvailabilities,
    createAvailability,
    updateAvailability,
    toggleAvailability,
    deleteAvailability,
    type CreateAvailabilityPayload,
    type UpdateAvailabilityPayload,
} from '@/services/lecturerAvailability.service';

const QUERY_KEY = ['lecturer-availability'];

export function useLecturerAvailability() {
    const queryClient = useQueryClient();

    const { data: availabilities, isLoading, isFetching, refetch } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: getMyAvailabilities,
    });

    const createMutation = useMutation({
        mutationFn: createAvailability,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Jadwal ketersediaan berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAvailabilityPayload }) =>
            updateAvailability(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Jadwal ketersediaan berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const toggleMutation = useMutation({
        mutationFn: toggleAvailability,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success(data.isActive ? 'Jadwal berhasil diaktifkan' : 'Jadwal berhasil dinonaktifkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAvailability,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Jadwal ketersediaan berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        availabilities: availabilities ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (data: CreateAvailabilityPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateAvailabilityPayload) => updateMutation.mutateAsync({ id, data }),
        toggle: toggleMutation.mutate,
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isToggling: toggleMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
