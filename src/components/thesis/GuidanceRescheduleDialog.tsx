import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Spinner } from '@/components/ui/spinner';
import type { SupervisorBusySlot } from '@/services/studentGuidance.service';
import { getSupervisorAvailability } from '@/services/studentGuidance.service';

interface GuidanceRescheduleDialogProps {
  onReschedule: (data: { requestedDate: string; studentNotes: string }) => Promise<boolean>;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  supervisorId?: string;
}

const DURATION_OPTIONS = [
  { value: '30', label: '30 menit' },
  { value: '60', label: '1 jam' },
  { value: '90', label: '1 jam 30 menit' },
  { value: '120', label: '2 jam' },
];

export function GuidanceRescheduleDialog({ onReschedule, trigger, open: externalOpen, onOpenChange, supervisorId }: GuidanceRescheduleDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [when, setWhen] = useState<Date | null>(null);
  const [duration, setDuration] = useState('60');
  const [studentNotes, setStudentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busySlots, setBusySlots] = useState<SupervisorBusySlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [slotConflict, setSlotConflict] = useState<string | null>(null);

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const minDate = new Date(Date.now() + 60 * 1000);
  const durationMinutes = parseInt(duration, 10);

  useEffect(() => {
    if (!open) {
      setWhen(null);
      setDuration('60');
      setStudentNotes('');
      setBusySlots([]);
      setSlotConflict(null);
      setAvailabilityError(null);
    }
  }, [open]);

  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };
  const addMinutes = (d: Date, mins: number) => new Date(d.getTime() + mins * 60000);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!when || !supervisorId) {
        setBusySlots([]);
        setSlotConflict(null);
        return;
      }
      setCheckingAvailability(true);
      setAvailabilityError(null);
      try {
        const res = await getSupervisorAvailability(supervisorId, {
          start: startOfDay(when).toISOString(),
          end: endOfDay(when).toISOString(),
        });
        setBusySlots(res.busySlots || []);

        const selectedStart = when;
        const selectedEnd = addMinutes(when, durationMinutes);
        const conflict = res.busySlots?.find((slot) => {
          const slotStart = new Date(slot.start);
          const slotEnd = new Date(slot.end);
          return selectedStart < slotEnd && selectedEnd > slotStart;
        });
        if (conflict) {
          const label = conflict.studentName ? `dengan ${conflict.studentName}` : 'dengan mahasiswa lain';
          const range = `${new Date(conflict.start).toLocaleString('id-ID')} - ${new Date(conflict.end).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
          setSlotConflict(`Jadwal bentrok ${label} pada ${range}. Pilih waktu lain.`);
        } else {
          setSlotConflict(null);
        }
      } catch (err) {
        setAvailabilityError((err as Error)?.message || 'Gagal memuat jadwal dosen');
        setSlotConflict(null);
      } finally {
        setCheckingAvailability(false);
      }
    };

    fetchAvailability();
  }, [when, supervisorId, durationMinutes]);

  const handleSubmit = async () => {
    if (!when) return;
    if (slotConflict) return;
    
    setIsSubmitting(true);
    try {
      const success = await onReschedule({
        requestedDate: when.toISOString(),
        studentNotes,
      });
      if (success) {
        setOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!when && !slotConflict && !checkingAvailability;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Bimbingan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>
              Waktu Bimbingan <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker
              value={when}
              onChange={setWhen}
              min={minDate}
              busySlots={busySlots}
              duration={durationMinutes}
            />
          </div>

          <div className="grid gap-2">
            <Label>Durasi</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih durasi" />
              </SelectTrigger>
              <SelectContent>
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Fixed height area for messages */}
          <div className="min-h-6">
            {checkingAvailability && (
              <p className="text-xs text-muted-foreground">Memeriksa jadwal...</p>
            )}
            {availabilityError && (
              <p className="text-xs text-destructive">{availabilityError}</p>
            )}
            {slotConflict && (
              <p className="text-xs text-destructive font-medium">{slotConflict}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Alasan (opsional)</Label>
            <Input
              id="notes"
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Tulis alasan reschedule..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
