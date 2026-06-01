import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getThesisCpmks,
    createThesisCpmk,
    updateThesisCpmk,
    deleteThesisCpmk,
    type CreateThesisCpmkPayload,
    type UpdateThesisCpmkPayload,
} from '@/services/master-data/thesis-cpmk.service';

const QUERY_KEY = ['thesis-cpmks'];

export function useThesisCpmk(academicYearId?: string) {
    const queryClient = useQueryClient();
    const queryKey = [...QUERY_KEY, academicYearId || 'active'];

    const { data: thesisCpmks, isLoading, isFetching, refetch } = useQuery({
        queryKey,
        queryFn: () => getThesisCpmks({ academicYearId }),
    });

    const createMutation = useMutation({
        mutationFn: createThesisCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Thesis CPMK berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateThesisCpmkPayload }) =>
            updateThesisCpmk(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Thesis CPMK berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteThesisCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data Thesis CPMK berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        thesisCpmks: thesisCpmks ?? [],
        isLoading,
        isFetching,
        refetch,
        create: (data: CreateThesisCpmkPayload) => createMutation.mutateAsync(data),
        update: (id: string, data: UpdateThesisCpmkPayload) => updateMutation.mutateAsync({ id, data }),
        remove: deleteMutation.mutate,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
