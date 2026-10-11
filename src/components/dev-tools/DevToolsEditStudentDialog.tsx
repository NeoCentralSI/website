import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DevToolsStudent, StudentStatus, UpdateStudentDto } from '@/types/devTools.types';
import { STUDENT_STATUSES } from './DevToolsShared';

const FLAGS = [
  ['mandatoryCoursesCompleted', 'MK Wajib Selesai'],
  ['mkwuCompleted', 'MKWU Selesai'],
  ['internshipCompleted', 'KP Selesai'],
  ['kknCompleted', 'KKN Selesai'],
] as const;

export function DevToolsEditStudentDialog({ student, open, onOpenChange, onSave, isSubmitting }: {
  student: DevToolsStudent | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (id: string, data: UpdateStudentDto) => Promise<unknown>; isSubmitting: boolean;
}) {
  const [form, setForm] = useState<UpdateStudentDto>({});
  useEffect(() => {
    if (student) setForm({
      sksCompleted: student.sksCompleted, currentSemester: student.currentSemester ?? undefined,
      enrollmentYear: student.enrollmentYear ?? undefined, status: student.status,
      mandatoryCoursesCompleted: student.mandatoryCoursesCompleted, mkwuCompleted: student.mkwuCompleted,
      internshipCompleted: student.internshipCompleted, kknCompleted: student.kknCompleted,
    });
  }, [student]);

  if (!student) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" />Edit Mahasiswa</DialogTitle>
          <DialogDescription>{student.fullName} ({student.identityNumber})</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="sks">SKS Selesai</Label>
              <Input id="sks" type="number" min={0} max={200} value={form.sksCompleted ?? 0}
                onChange={(e) => setForm({ ...form, sksCompleted: Number(e.target.value) })} /></div>
            <div className="space-y-2"><Label htmlFor="semester">Semester Saat Ini</Label>
              <Input id="semester" type="number" min={1} max={14} value={form.currentSemester ?? ''}
                onChange={(e) => setForm({ ...form, currentSemester: Number(e.target.value) || undefined })} /></div>
            <div className="space-y-2"><Label htmlFor="enrollmentYear">Tahun Masuk</Label>
              <Input id="enrollmentYear" type="number" min={2000} max={2030} value={form.enrollmentYear ?? ''}
                onChange={(e) => setForm({ ...form, enrollmentYear: Number(e.target.value) || undefined })} /></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as StudentStatus })}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>{STUDENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select></div>
          </div>
          <div className="space-y-2"><Label className="text-sm font-medium">Eligibility Flags</Label>
            <div className="grid grid-cols-2 gap-3">
              {FLAGS.map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Checkbox id={key} checked={!!form[key]} onCheckedChange={(c) => setForm({ ...form, [key]: !!c })} />
                  <Label htmlFor={key} className="text-sm font-normal cursor-pointer">{label}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button onClick={async () => { const ok = await onSave(student.id, form); if (ok !== null) onOpenChange(false); }} disabled={isSubmitting}>
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
