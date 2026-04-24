import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getRoomsAPI,
  createRoomAPI,
  updateRoomAPI,
  deleteRoomAPI,
} from '@/services/admin.service';
import type {
  Room,
  CreateRoomRequest,
  UpdateRoomRequest,
} from '@/services/admin.service';

const QUERY_KEY = ['rooms'];

export type GetRoomsParams = {
  status?: 'all' | 'available' | 'in_use';
  search?: string;
  page?: number;
  limit?: number;
};

export function useRooms() {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetRoomsParams>({
    status: 'all',
    search: '',
    page: 1,
    limit: 10,
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [...QUERY_KEY, params],
    queryFn: () => getRoomsAPI(params),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateRoomRequest) => createRoomAPI(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Ruangan berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRoomRequest }) =>
      updateRoomAPI(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Ruangan berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoomAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success('Ruangan berhasil dihapus');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    rooms: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    isFetching,
    refetch,
    params,
    setParams,
    create: (body: CreateRoomRequest) => createMutation.mutateAsync(body),
    update: (id: string, body: UpdateRoomRequest) =>
      updateMutation.mutateAsync({ id, body }),
    remove: (id: string) => deleteMutation.mutateAsync(id),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useRoomForm() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<CreateRoomRequest>({
    name: '',
    location: '',
    capacity: null,
  });

  const openCreateDialog = () => {
    setEditingRoom(null);
    setFormData({
      name: '',
      location: '',
      capacity: null,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      location: room.location ?? '',
      capacity: room.capacity,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  return {
    dialogOpen,
    setDialogOpen,
    editingRoom,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}
