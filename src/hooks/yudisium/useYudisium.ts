import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getYudisiumEvents,
  getYudisiumEventById,
  createYudisiumEvent,
  updateYudisiumEvent,
  deleteYudisiumEvent,
  getYudisiumAnnouncements,
  getYudisiumRepository,
  type CreateYudisiumPayload,
  type UpdateYudisiumPayload,
} from '@/services/yudisium/yudisium.service';
import { toast } from 'sonner';

export const yudisiumKeys = {
  all: ['yudisium-events'] as const,
  lists: () => [...yudisiumKeys.all, 'list'] as const,
  detail: (id: string) => [...yudisiumKeys.all, 'detail', id] as const,
};

export function useYudisiumEvents() {
  return useQuery({
    queryKey: yudisiumKeys.lists(),
    queryFn: getYudisiumEvents,
  });
}

export function useYudisiumAnnouncements() {
  return useQuery({
    queryKey: [...yudisiumKeys.all, 'announcements'],
    queryFn: getYudisiumAnnouncements,
  });
}

export function useYudisiumRepository() {
  return useQuery({
    queryKey: [...yudisiumKeys.all, 'repository'],
    queryFn: () => getYudisiumRepository(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes — data doesn't change often
  });
}

export function useYudisiumEvent(id: string) {
  return useQuery({
    queryKey: yudisiumKeys.detail(id),
    queryFn: () => getYudisiumEventById(id),
    enabled: !!id,
  });
}

export function useCreateYudisiumEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateYudisiumPayload) => createYudisiumEvent(payload),
    onSuccess: () => {
      toast.success('Data yudisium berhasil ditambahkan');
      void queryClient.invalidateQueries({ queryKey: yudisiumKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateYudisiumEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateYudisiumPayload }) => updateYudisiumEvent(id, data),
    onSuccess: (_, { id }) => {
      toast.success('Data yudisium berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: yudisiumKeys.all });
      void queryClient.invalidateQueries({ queryKey: yudisiumKeys.detail(id) });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteYudisiumEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteYudisiumEvent(id),
    onSuccess: () => {
      toast.success('Data yudisium berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: yudisiumKeys.all });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}
