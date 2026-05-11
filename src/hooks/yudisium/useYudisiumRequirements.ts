import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getYudisiumRequirements,
  createYudisiumRequirement,
  updateYudisiumRequirement,
  toggleYudisiumRequirement,
  deleteYudisiumRequirement,
} from '@/services/yudisium/requirement.service';

export const requirementKeys = {
  all: ['yudisium-requirements'] as const,
  lists: () => [...requirementKeys.all, 'list'] as const,
  detail: (id: string) => [...requirementKeys.all, 'detail', id] as const,
};

export function useYudisiumRequirements() {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: requirementKeys.lists(),
    queryFn: getYudisiumRequirements,
  });

  const createMutation = useMutation({
    mutationFn: createYudisiumRequirement,
    onSuccess: () => {
      toast.success('Persyaratan berhasil ditambahkan');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => updateYudisiumRequirement(id, payload),
    onSuccess: (_, { id }) => {
      toast.success('Persyaratan berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
      void queryClient.invalidateQueries({ queryKey: requirementKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleYudisiumRequirement(id),
    onSuccess: () => {
      toast.success('Status persyaratan berhasil diubah');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteYudisiumRequirement(id),
    onSuccess: () => {
      toast.success('Persyaratan berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });


  return {
    requirements: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    create: createMutation.mutateAsync,
    update: (id: string, payload: any) => updateMutation.mutateAsync({ id, payload }),
    toggle: toggleMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isToggling: toggleMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
