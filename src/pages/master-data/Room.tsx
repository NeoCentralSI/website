import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RoomFormDialog,
  RoomTable,
} from '@/components/master-data';

import { useRoomForm, useRooms } from '@/hooks/master-data';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import type { CreateRoomRequest, Room, UpdateRoomRequest } from '@/services/admin.service';

export default function RoomPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const {
    rooms,
    total,
    isLoading,
    isFetching,
    refetch,
    params,
    setParams,
    create,
    update,
    remove,
    isCreating,
    isUpdating,
    isDeleting,
  } = useRooms();

  const {
    dialogOpen,
    setDialogOpen,
    editingRoom,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  } = useRoomForm();

  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Kelola Ruangan' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Kelola Ruangan');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  const normalizePayload = (payload: CreateRoomRequest | UpdateRoomRequest) => ({
    ...payload,
    name: payload.name?.trim(),
    location: payload.location?.trim() ? payload.location.trim() : null,
    capacity: payload.capacity ?? null,
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const payload = normalizePayload(formData);

    try {
      if (editingRoom) {
        await update(editingRoom.id, payload as UpdateRoomRequest);
      } else {
        await create(payload as CreateRoomRequest);
      }
      closeDialog();
    } catch {
      // Toast handled in hook mutations
    }
  };

  const handleRequestDelete = (room: Room) => {
    if (!room.canDelete) {
      return;
    }
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      await remove(roomToDelete.id);
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch {
      // Toast handled in hook
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kelola Ruangan</h2>
          <p className="text-muted-foreground">Manajemen data master ruangan untuk penjadwalan kegiatan akademik</p>
        </div>
      </div>

      <RoomTable
        data={rooms}
        loading={isLoading}
        isFetching={isFetching}
        params={params}
        onParamsChange={setParams}
        total={total}
        onEdit={openEditDialog}
        onDelete={handleRequestDelete}
        onRefresh={() => refetch()}
        actions={
          <Button variant="outline" size="sm" onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" /> Tambah
          </Button>
        }
      />

      <RoomFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingRoom={editingRoom}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isCreating || isUpdating}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Ruangan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus ruangan <strong>{roomToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRoomToDelete(null)}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
