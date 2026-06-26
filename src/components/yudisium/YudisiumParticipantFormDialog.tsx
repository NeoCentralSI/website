import { useState } from 'react';

import { ComboBox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ArchiveYudisiumParticipantOption } from '@/types/admin-yudisium.types';

interface YudisiumParticipantFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  thesisOptions: ArchiveYudisiumParticipantOption[];
  isLoading?: boolean;
  isPending: boolean;
  onSubmit: (thesisId: string) => Promise<void> | void;
}

export function YudisiumParticipantFormDialog({
  open,
  onOpenChange,
  thesisOptions,
  isLoading = false,
  isPending,
  onSubmit,
}: YudisiumParticipantFormDialogProps) {
  const [selectedThesisId, setSelectedThesisId] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setSelectedThesisId('');
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!selectedThesisId) return;
    await onSubmit(selectedThesisId);
    setSelectedThesisId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Tambah Peserta Yudisium</DialogTitle>
          <DialogDescription>
            Pilih mahasiswa yang akan ditambahkan sebagai peserta arsip yudisium.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="participant-select">Peserta</Label>
            <ComboBox
              width="w-full"
              wrap
              disabled={isLoading || isPending}
              items={thesisOptions.map((option) => ({
                value: option.thesisId,
                label: `${option.studentName} (${option.studentNim})`,
              }))}
              placeholder={isLoading ? 'Memuat peserta...' : 'Pilih peserta...'}
              defaultValue={selectedThesisId}
              onChange={(value) => setSelectedThesisId(value)}
            />
            {!isLoading && thesisOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Semua peserta yang tersedia sudah terdaftar pada yudisium ini.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedThesisId || isPending}>
            {isPending ? 'Menyimpan...' : 'Tambah Peserta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
