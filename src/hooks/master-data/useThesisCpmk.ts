import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getThesisCpmks,
    createThesisCpmk,
    updateThesisCpmk,
    deleteThesisCpmk,
    copyThesisCpmkTemplate,
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
        enabled: Boolean(academicYearId),
    });

    const createMutation = useMutation({
        mutationFn: createThesisCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPMK Tugas Akhir berhasil ditambahkan');
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
            toast.success('Data CPMK Tugas Akhir berhasil diubah');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteThesisCpmk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Data CPMK Tugas Akhir berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const copyTemplateMutation = useMutation({
        mutationFn: ({ sourceAcademicYearId, targetAcademicYearId }: { sourceAcademicYearId: string; targetAcademicYearId: string }) =>
            copyThesisCpmkTemplate(sourceAcademicYearId, targetAcademicYearId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            toast.success('Template CPMK Tugas Akhir berhasil disalin');
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
        copyTemplate: copyTemplateMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        isCopyingTemplate: copyTemplateMutation.isPending,
    };
}
