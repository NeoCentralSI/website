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
import type { AdminThesisSeminarAudienceStudentOption } from '@/services/thesis-seminar/core.service';

interface AdminThesisSeminarAudienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentOptions: AdminThesisSeminarAudienceStudentOption[];
  isPending: boolean;
  onSubmit: (studentId: string) => void;
}

export function AdminThesisSeminarAudienceDialog({
  open,
  onOpenChange,
  studentOptions,
  isPending,
  onSubmit,
}: AdminThesisSeminarAudienceDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) setSelectedStudentId('');
    onOpenChange(isOpen);
  };

  const handleSubmit = () => {
    if (!selectedStudentId) return;
    onSubmit(selectedStudentId);
    setSelectedStudentId('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Tambah Mahasiswa Audience
          </DialogTitle>
          <DialogDescription>
            Pilih mahasiswa yang akan ditambahkan sebagai audience seminar ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="student-select">Mahasiswa</Label>
            <ComboBox
              width="w-full"
              items={studentOptions.map((s) => ({
                value: s.id,
                label: `${s.fullName} (${s.nim})`,
              }))}
              placeholder="Pilih mahasiswa..."
              defaultValue={selectedStudentId}
              onChange={(value) => setSelectedStudentId(value)}
            />
            {studentOptions.length === 0 && (
              <p className="text-xs text-muted-foreground">Semua mahasiswa sudah terdaftar sebagai audience.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedStudentId || isPending}>
            {isPending ? 'Menyimpan...' : 'Tambah Audience'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
