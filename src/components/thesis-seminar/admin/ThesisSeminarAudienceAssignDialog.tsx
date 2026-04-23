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
import type { SeminarResult, SeminarResultStudentOption } from '@/services/thesis-seminar/admin-seminar.service';

interface ThesisSeminarAudienceAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentOptions: SeminarResultStudentOption[];
  seminarOptions: SeminarResult[];
  isPending: boolean;
  onSubmit: (payload: { studentId: string; seminarIds: string[] }) => void;
}

export function ThesisSeminarAudienceAssignDialog({
  open,
  onOpenChange,
  studentOptions,
  seminarOptions,
  isPending,
  onSubmit,
}: ThesisSeminarAudienceAssignDialogProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedSeminarIds, setSelectedSeminarIds] = useState<string[]>([]);
  const [seminarSearch, setSeminarSearch] = useState('');

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setSelectedStudentId('');
      setSelectedSeminarIds([]);
      setSeminarSearch('');
    }
    onOpenChange(isOpen);
  };

  const selectedStudent = studentOptions.find((s) => s.id === selectedStudentId);

  // Filter out seminars owned by the selected student
  const selectableSeminars = seminarOptions.filter((s) => {
    if (!selectedStudent) return true;
    return s.student.id !== selectedStudent.id;
  });

  const filteredSeminars = selectableSeminars.filter((s) => {
    const q = seminarSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.thesisTitle.toLowerCase().includes(q)
      || s.student.fullName.toLowerCase().includes(q)
      || s.student.nim.toLowerCase().includes(q)
    );
  });

  const isValid = Boolean(selectedStudentId && selectedSeminarIds.length >= 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kaitkan Mahasiswa ke Seminar Hasil</DialogTitle>
          <DialogDescription>
            Pilih mahasiswa audience lalu pilih satu atau banyak seminar hasil milik mahasiswa lain.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Mahasiswa Audience</Label>
            <ComboBox
              width="w-full"
              items={studentOptions.map((s) => ({ value: s.id, label: `${s.fullName} (${s.nim})` }))}
              placeholder="Pilih mahasiswa"
              defaultValue={selectedStudentId}
              onChange={(value) => {
                setSelectedStudentId(value);
                setSelectedSeminarIds([]);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Seminar Hasil (multi-select)</Label>
            <Input
              placeholder="Cari seminar hasil..."
              value={seminarSearch}
              onChange={(e) => setSeminarSearch(e.target.value)}
            />
            <div className="max-h-[260px] overflow-y-auto rounded-md border p-3 space-y-2">
              {filteredSeminars.map((row) => {
                const checked = selectedSeminarIds.includes(row.id);
                return (
                  <label key={row.id} className="flex items-start gap-3 text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const isChecked = value === true;
                        setSelectedSeminarIds((prev) =>
                          isChecked ? [...prev, row.id] : prev.filter((id) => id !== row.id)
                        );
                      }}
                    />
                    <span>
                      <span className="font-medium">{row.thesisTitle}</span>
                      <span className="block text-xs text-muted-foreground">
                        Pemilik: {row.student.fullName} ({row.student.nim})
                      </span>
                    </span>
                  </label>
                );
              })}
              {filteredSeminars.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada seminar yang dapat dipilih.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Dipilih: {selectedSeminarIds.length} seminar</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Batal</Button>
          <Button
            onClick={() => onSubmit({ studentId: selectedStudentId, seminarIds: selectedSeminarIds })}
            disabled={!isValid || isPending}
          >
            {isPending ? 'Menyimpan...' : 'Kaitkan Audience'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
