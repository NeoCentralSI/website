import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

type RoomsQueryResult = Awaited<ReturnType<typeof getRoomsAPI>>;

interface UseRoomsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useRooms(options: UseRoomsOptions = {}) {
  const { page = 1, pageSize = 10, search = '' } = options;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['rooms', { page, pageSize, search }],
    queryFn: () => getRoomsAPI({ page, pageSize, search }),
    placeholderData: (previousData: RoomsQueryResult | undefined) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateRooms = () => {
    queryClient.invalidateQueries({ queryKey: ['rooms'] });
  };

  const createRoom = async (formData: CreateRoomRequest) => {
    setIsSubmitting(true);
    try {
      await createRoomAPI(formData);
      toast.success('Ruangan berhasil ditambahkan');
      invalidateRooms();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan ruangan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRoom = async (id: string, formData: UpdateRoomRequest) => {
    setIsSubmitting(true);
    try {
      await updateRoomAPI(id, formData);
      toast.success('Ruangan berhasil diperbarui');
      invalidateRooms();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui ruangan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteRoom = async (room: Room) => {
    if (!room.canDelete) {
      toast.warning('Data ruangan tidak dapat dihapus karena sudah memiliki relasi');
      return false;
    }

    setIsSubmitting(true);
    try {
      await deleteRoomAPI(room.id);
      toast.success('Ruangan berhasil dihapus');
      invalidateRooms();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus ruangan');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    rooms: data?.rooms || [],
    meta: data?.meta,
    total: data?.meta?.total || 0,
    isLoading,
    isSubmitting,
    error,
    createRoom,
    updateRoom,
    deleteRoom,
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
