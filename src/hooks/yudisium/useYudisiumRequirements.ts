import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getYudisiumRequirements,
  getYudisiumRequirementById,
  createYudisiumRequirement,
  updateYudisiumRequirement,
  toggleYudisiumRequirement,
  deleteYudisiumRequirement,
  moveYudisiumRequirementToTop,
  moveYudisiumRequirementToBottom,
} from '@/services/yudisium/yudisium-requirement.service';

export const requirementKeys = {
  all: ['yudisium-requirements'] as const,
  lists: () => [...requirementKeys.all, 'list'] as const,
  detail: (id: string) => [...requirementKeys.all, 'detail', id] as const,
};

export function useYudisiumRequirements() {
  return useQuery({
    queryKey: requirementKeys.lists(),
    queryFn: getYudisiumRequirements,
  });
}

export function useYudisiumRequirementDetail(id: string) {
  return useQuery({
    queryKey: requirementKeys.detail(id),
    queryFn: () => getYudisiumRequirementById(id),
    enabled: !!id,
  });
}

export function useCreateYudisiumRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createYudisiumRequirement,
    onSuccess: () => {
      toast.success('Persyaratan berhasil ditambahkan');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateYudisiumRequirement(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => updateYudisiumRequirement(id, payload),
    onSuccess: () => {
      toast.success('Persyaratan berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
      void queryClient.invalidateQueries({ queryKey: requirementKeys.detail(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleYudisiumRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleYudisiumRequirement(id),
    onSuccess: () => {
      toast.success('Status persyaratan berhasil diubah');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteYudisiumRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteYudisiumRequirement(id),
    onSuccess: () => {
      toast.success('Persyaratan berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMoveRequirementToTop() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moveYudisiumRequirementToTop(id),
    onSuccess: () => {
      toast.success('Berhasil memindahkan persyaratan ke urutan teratas');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMoveRequirementToBottom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moveYudisiumRequirementToBottom(id),
    onSuccess: () => {
      toast.success('Berhasil memindahkan persyaratan ke urutan terbawah');
      void queryClient.invalidateQueries({ queryKey: requirementKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
