import { useEffect, useState } from 'react';
import { CalendarClock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import StatusBadge from '@/components/thesis/StatusBadge';
import type { DevToolsGuidance, UpdateGuidanceScheduleDto } from '@/types/devTools.types';
import {
  buildGuidanceSchedulePatch,
  GUIDANCE_SCHEDULE_FIELDS as FIELDS,
  toGuidanceScheduleForm as toForm,
  type GuidanceScheduleForm as FormState,
} from './devToolsDate';

export function DevToolsGuidanceScheduleDialog({ guidance, open, onOpenChange, onSave, isSubmitting }: {
  guidance: DevToolsGuidance | null; open: boolean; onOpenChange: (o: boolean) => void;
  onSave: (id: string, data: UpdateGuidanceScheduleDto) => Promise<unknown>; isSubmitting: boolean;
}) {
  const [form, setForm] = useState<FormState | null>(null);
  useEffect(() => { setForm(guidance ? toForm(guidance) : null); }, [guidance]);

  if (!guidance || !form) return null;
  const patch = buildGuidanceSchedulePatch(toForm(guidance), form);
  const hasChanges = !!patch && Object.keys(patch).length > 0;
  const requestedMissing = form.requestedDate === '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Ubah Jadwal</DialogTitle>
          <DialogDescription>
            {guidance.studentName ?? '-'} ({guidance.studentNim ?? '-'}) · {guidance.supervisorName ?? 'Tanpa pembimbing'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Status sesi:</span>
            <StatusBadge status={guidance.status} />
            <span className="text-xs text-muted-foreground">(tidak berubah)</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`guidance-${key}`}>{label} (WIB)</Label>
                <Input
                  id={`guidance-${key}`}
                  type="datetime-local"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          {requestedMissing && <p className="text-xs text-destructive">Waktu diusulkan wajib diisi.</p>}
          <p className="text-xs text-muted-foreground">
            Jadwal efektif sesi adalah waktu disetujui, atau waktu diusulkan bila belum disetujui. Tanggal lampau
            diizinkan. Mengosongkan isian (selain waktu diusulkan) menghapus tanggalnya. Status tidak berubah dan
            tidak ada notifikasi yang dikirim.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Batal</Button>
          <Button
            disabled={isSubmitting || !hasChanges}
            onClick={async () => {
              if (!patch) return;
              const ok = await onSave(guidance.id, patch);
              if (ok !== null) onOpenChange(false);
            }}
          >
            {isSubmitting ? <><Spinner className="mr-2 h-4 w-4" />Menyimpan...</> : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
