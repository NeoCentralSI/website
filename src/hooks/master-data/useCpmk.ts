import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getCpmks,
    createCpmk,
    updateCpmk,
    deleteCpmk,
    copyCpmkTemplate,
    type CreateCpmkPayload,
    type UpdateCpmkPayload,
    type CopyCpmkTemplatePayload,
} from '@/services/master-data/cpmk.service';

const QUERY_KEY = ['cpmks'];

export function useCpmk(academicYearId?: string) {
    const queryClient = useQueryClient();
    const queryKey = [...QUERY_KEY, academicYearId || 'active'];

    const { data: cpmks, isLoading, isFetching, refetch } = useQuery({
        queryKey,
        queryFn: () => getCpmks({ academicYearId }),
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

    const copyTemplateMutation = useMutation({
        mutationFn: copyCpmkTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Template CPMK berhasil disalin');
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
        remove: deleteMutation.mutate,
        copyTemplate: (payload: CopyCpmkTemplatePayload) => copyTemplateMutation.mutateAsync(payload),
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isCopyingTemplate: copyTemplateMutation.isPending,
    };
}
