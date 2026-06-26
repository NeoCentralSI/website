import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getDefenceRequirements,
    createDefenceRequirement,
    updateDefenceRequirement,
    deleteDefenceRequirement,
    reorderDefenceRequirements,
    copyDefenceRequirementTemplate,
    type UpdateDefenceRequirementPayload,
} from '@/services/master-data/defence-requirement.service';

export function useDefenceRequirement(academicYearId?: string) {
    const queryClient = useQueryClient();
    

    const queryKey = ['defence-requirements', academicYearId];

    const { data: requirements = [], isLoading, isFetching, refetch } = useQuery({
        queryKey,
        queryFn: () => getDefenceRequirements({ academicYearId }),
        enabled: !!academicYearId,
    });

    const createMutation = useMutation({
        mutationFn: createDefenceRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defence-requirements'] });
            toast.success('Persyaratan berhasil ditambahkan');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateDefenceRequirementPayload }) => updateDefenceRequirement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defence-requirements'] });
            toast.success('Persyaratan berhasil diperbarui');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteDefenceRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defence-requirements'] });
            toast.success('Persyaratan berhasil dihapus');
        },
        onError: (error: Error) => {
            toast.error(error.message);
        },
    });

    const copyTemplateMutation = useMutation({
        mutationFn: ({ sourceAcademicYearId, targetAcademicYearId }: { sourceAcademicYearId: string; targetAcademicYearId: string }) => 
            copyDefenceRequirementTemplate(sourceAcademicYearId, targetAcademicYearId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['defence-requirements'] });
            toast.success('Template persyaratan berhasil disalin');
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
            await reorderDefenceRequirements(orderedIds);
            refetch();
        },
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
        copyTemplate: copyTemplateMutation.mutateAsync,
        isCopyingTemplate: copyTemplateMutation.isPending,
    };
}
