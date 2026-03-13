import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import type { Room, CreateRoomRequest, UpdateRoomRequest } from '@/services/admin.service';

interface RoomFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoom: Room | null;
  formData: CreateRoomRequest | UpdateRoomRequest;
  setFormData: (data: CreateRoomRequest | UpdateRoomRequest) => void;
  onSubmit: (e: FormEvent) => void;
  isSubmitting?: boolean;
}

export function RoomFormDialog({
  open,
  onOpenChange,
  editingRoom,
  formData,
  setFormData,
  onSubmit,
  isSubmitting = false,
}: RoomFormDialogProps) {
  const capacityValue = formData.capacity ?? '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan'}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? 'Ubah informasi ruangan'
                : 'Tambahkan data ruangan baru'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nama Ruangan</Label>
              <Input
                id="name"
                type="text"
                placeholder="Contoh: Lab Komputer 1"
                value={formData.name ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                type="text"
                placeholder="Contoh: Gedung A, Lantai 2"
                value={formData.location ?? ''}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="capacity">Kapasitas</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                placeholder="Contoh: 40"
                value={capacityValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    capacity: value === '' ? null : Number(value),
                  });
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Menyimpan...
                </>
              ) : editingRoom ? (
                'Simpan Perubahan'
              ) : (
                'Tambah'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
