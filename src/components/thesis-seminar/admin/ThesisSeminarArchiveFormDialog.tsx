import { useState, useMemo, useEffect } from 'react';

import { DatePicker } from '@/components/ui/date-picker';

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
} from '@/services/thesis-seminar/admin.service';
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

function toIsoDate(value: Date | undefined) {
  if (!value) return '';
  const date = new Date(value);
  // Set to noon to avoid timezone shift to previous day during UTC conversion
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
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
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [roomId, setRoomId] = useState('');
  const [status, setStatus] = useState<SeminarResultStatus>('passed');
  const [examinerIds, setExaminerIds] = useState<string[]>([]);
  const [examinerSearch, setExaminerSearch] = useState('');

  // Populate form whenever the dialog opens or the editing target changes
  useEffect(() => {
    if (!open) return;

    if (editingSeminar) {
      setThesisId(editingSeminar.thesisId);
      setDate(editingSeminar.date ? new Date(editingSeminar.date) : undefined);
      setRoomId(editingSeminar.room?.id || '');
      setStatus(editingSeminar.status);
      setExaminerIds(editingSeminar.examiners.map((e) => e.lecturerId));
    } else {
      setThesisId('');
      setDate(undefined);
      setRoomId('');
      setStatus('passed');
      setExaminerIds([]);
    }
    setExaminerSearch('');
  }, [open, editingSeminar]);

  const isEditing = Boolean(editingSeminar);

  const selectedThesis = useMemo(
    () => thesisOptions.find((t) => t.id === thesisId),
    [thesisOptions, thesisId]
  );
  const supervisorIds = selectedThesis?.supervisorIds || [];

  const filteredLecturers = useMemo(
    () =>
      lecturerOptions.filter((item) => {
        // Supervisors cannot be examiners
        if (supervisorIds.includes(item.id)) return false;

        const q = examinerSearch.trim().toLowerCase();
        if (!q) return true;
        return (
          item.fullName.toLowerCase().includes(q) ||
          item.nip.toLowerCase().includes(q)
        );
      }),
    [lecturerOptions, supervisorIds, examinerSearch]
  );

  // Remove examiners if they become supervisors (unlikely but safe)
  useEffect(() => {
    setExaminerIds((prev) => {
      const next = prev.filter((id) => !supervisorIds.includes(id));
      if (next.length !== prev.length) return next;
      return prev;
    });
  }, [supervisorIds]);

  const isValid = Boolean(thesisId && date && roomId && status && examinerIds.length >= 1);

  const handleSubmit = () => {
    onSubmit({
      thesisId,
      date: toIsoDate(date),
      roomId,
      status,
      examinerLecturerIds: examinerIds,
    });
  };

  // Locked thesis label for edit mode
  const lockedThesisLabel = isEditing
    ? thesisOptions.find((t) => t.id === editingSeminar?.thesisId)
      ? `${thesisOptions.find((t) => t.id === editingSeminar?.thesisId)!.studentName} (${thesisOptions.find((t) => t.id === editingSeminar?.thesisId)!.studentNim}) — ${thesisOptions.find((t) => t.id === editingSeminar?.thesisId)!.title}`
      : `Thesis ID: ${editingSeminar?.thesisId}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Seminar Hasil' : 'Tambah Seminar Hasil'}</DialogTitle>
          <DialogDescription>
            Isi form berikut untuk menambah data arsip seminar hasil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tugas Akhir — locked when editing */}
          <div className="space-y-2">
            <Label>Tugas Akhir</Label>
            {isEditing ? (
              <div className="flex min-h-9 h-auto w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed whitespace-normal">
                {lockedThesisLabel ?? editingSeminar?.thesisTitle ?? '—'}
              </div>
            ) : (
              <ComboBox
                width="w-full"
                wrap={true}
                items={thesisOptions.map((t) => ({
                  value: t.id,
                  label: `${t.studentName} (${t.studentNim}) — ${t.title}`,
                  disabled: Boolean(t.hasSeminarResult && t.seminarResultId !== editingSeminar?.id),
                }))}
                placeholder="Pilih Tugas Akhir"
                defaultValue={thesisId}
                onChange={(value) => setThesisId(value)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Tanggal Seminar</Label>
              <DatePicker
                value={date}
                onChange={setDate}
                showPastDates={true}
              />
            </div>

            <div className="space-y-2">
              <Label>Ruangan</Label>
              <Select value={roomId} onValueChange={(value) => setRoomId(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ruangan" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-trigger-width)]">
                  {roomOptions.map((room) => (
                    <SelectItem key={room.id} value={room.id} className="max-w-full whitespace-normal">
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
            {isPending ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah Seminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
