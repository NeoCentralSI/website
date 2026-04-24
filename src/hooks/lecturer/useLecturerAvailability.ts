import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getMyAvailabilities,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    type CreateAvailabilityPayload,
    type UpdateAvailabilityPayload,
    type GetLecturerAvailabilitiesParams,
} from '@/services/master-data/lecturer-availability.service';

const QUERY_KEY = ['lecturer-availability'];

export function useLecturerAvailability() {
    const queryClient = useQueryClient();
    const [params, setParams] = useState<GetLecturerAvailabilitiesParams>({
        status: 'all',
        search: '',
        page: 1,
        limit: 10,
    });

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: [...QUERY_KEY, params],
        queryFn: () => getMyAvailabilities(params),
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
        availabilities: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        isFetching,
        refetch,
        params,
        setParams,
        create: (payload: CreateAvailabilityPayload) => createMutation.mutateAsync(payload),
        update: (id: string, payload: UpdateAvailabilityPayload) =>
            updateMutation.mutateAsync({ id, data: payload }),
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
