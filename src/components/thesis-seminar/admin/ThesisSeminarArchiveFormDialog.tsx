import { useState } from 'react';

import { ComboBox } from '@/components/ui/combobox';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  SeminarResult,
  SeminarResultStatus,
  SeminarResultLecturerOption,
  SeminarResultThesisOption,
} from '@/services/thesis-seminar/admin-seminar.service';
import type { Room } from '@/services/admin.service';

interface ThesisSeminarArchiveFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSeminar: SeminarResult | null;
  thesisOptions: SeminarResultThesisOption[];
  lecturerOptions: SeminarResultLecturerOption[];
  roomOptions: Room[];
  isPending: boolean;
  onSubmit: (payload: {
    thesisId: string;
    date: string;
    roomId: string;
    status: SeminarResultStatus;
    examinerLecturerIds: string[];
  }) => void;
}

function toIsoDateStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

export function ThesisSeminarArchiveFormDialog({
  open,
  onOpenChange,
  editingSeminar,
  thesisOptions,
  lecturerOptions,
  roomOptions,
  isPending,
  onSubmit,
}: ThesisSeminarArchiveFormDialogProps) {
  const [thesisId, setThesisId] = useState('');
  const [date, setDate] = useState('');
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState<SeminarResultStatus>('passed');
  const [examinerIds, setExaminerIds] = useState<string[]>([]);
  const [examinerSearch, setExaminerSearch] = useState('');

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      if (editingSeminar) {
        setThesisId(editingSeminar.thesisId);
        setDate(editingSeminar.date ? new Date(editingSeminar.date).toISOString().slice(0, 10) : '');
        setRoomId(editingSeminar.room?.id || '');
        setStatus(editingSeminar.status);
        setExaminerIds(editingSeminar.examiners.map((e) => e.lecturerId));
      } else {
        setThesisId('');
        setDate('');
        setRoomId('');
        setStatus('passed');
        setExaminerIds([]);
      }
      setExaminerSearch('');
    }
    onOpenChange(isOpen);
  };

  const filteredLecturers = lecturerOptions.filter((item) => {
    const q = examinerSearch.trim().toLowerCase();
    if (!q) return true;
    return item.fullName.toLowerCase().includes(q) || item.nip.toLowerCase().includes(q);
  });

  const isValid = Boolean(thesisId && date && roomId && status && examinerIds.length >= 1);

  const handleSubmit = () => {
    onSubmit({
      thesisId,
      date: toIsoDateStart(date),
      roomId,
      status,
      examinerLecturerIds: examinerIds,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingSeminar ? 'Edit Seminar Hasil' : 'Tambah Seminar Hasil'}</DialogTitle>
          <DialogDescription>
            Isi data seminar hasil. Dosen penguji minimal 1 orang dan tidak boleh merupakan pembimbing thesis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Thesis</Label>
            <ComboBox
              width="w-full"
              items={thesisOptions.map((t) => ({
                value: t.id,
                label: `${t.studentName} (${t.studentNim}) - ${t.title}`,
                disabled: Boolean(t.hasSeminarResult && t.seminarResultId !== editingSeminar?.id),
              }))}
              placeholder="Pilih thesis"
              defaultValue={thesisId}
              onChange={(value) => setThesisId(value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tanggal Seminar</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ruangan</Label>
              <Select value={roomId} onValueChange={(value) => setRoomId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruangan" />
                </SelectTrigger>
                <SelectContent>
                  {roomOptions.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}{room.location ? ` (${room.location})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status Seminar</Label>
              <Select value={status} onValueChange={(value: SeminarResultStatus) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passed">Lulus</SelectItem>
                  <SelectItem value="passed_with_revision">Lulus dengan Revisi</SelectItem>
                  <SelectItem value="failed">Tidak Lulus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dosen Penguji (multi-select)</Label>
            <Input
              placeholder="Cari dosen penguji..."
              value={examinerSearch}
              onChange={(e) => setExaminerSearch(e.target.value)}
            />
            <div className="max-h-[220px] overflow-y-auto rounded-md border p-3 space-y-2">
              {filteredLecturers.map((lec) => {
                const checked = examinerIds.includes(lec.id);
                return (
                  <label key={lec.id} className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const isChecked = value === true;
                        setExaminerIds((prev) =>
                          isChecked
                            ? [...prev, lec.id]
                            : prev.filter((id) => id !== lec.id)
                        );
                      }}
                    />
                    <span>{lec.fullName} ({lec.nip})</span>
                  </label>
                );
              })}
              {filteredLecturers.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada dosen ditemukan.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dipilih: {examinerIds.length} dosen
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
          <Button onClick={handleSubmit} disabled={!isValid || isPending}>
            {isPending ? 'Menyimpan...' : editingSeminar ? 'Simpan Perubahan' : 'Tambah Seminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
