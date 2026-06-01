import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getSeminarRequirements,
    createSeminarRequirement,
    updateSeminarRequirement,
    deleteSeminarRequirement,
    reorderSeminarRequirements,
    
    type UpdateSeminarRequirementPayload,
} from '@/services/master-data/seminar-requirement.service';

export function useSeminarRequirement(academicYearId?: string) {
    const queryClient = useQueryClient();
    

    const queryKey = ['seminar-requirements', academicYearId];

    const { data: requirements = [], isLoading, isFetching, refetch } = useQuery({
        queryKey,
        queryFn: () => getSeminarRequirements({ academicYearId }),
        enabled: !!academicYearId,
    });

    const createMutation = useMutation({
        mutationFn: createSeminarRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seminar-requirements'] });
            toast.success('Persyaratan berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateSeminarRequirementPayload }) => updateSeminarRequirement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seminar-requirements'] });
            toast.success('Persyaratan berhasil diperbarui');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteSeminarRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['seminar-requirements'] });
            toast.success('Persyaratan berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    return {
        requirements,
        isLoading,
        isFetching,
        refetch,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
        reorder: async (orderedIds: string[]) => {
            await reorderSeminarRequirements(orderedIds);
            refetch();
        },
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}
