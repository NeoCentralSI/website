import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { DateTimePicker } from '@/components/ui/datetime-picker';

const MAX_REASON = 1000;

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  label: string;
  placeholder?: string;
  confirmText: string;
  destructive?: boolean;
  /** Optional context shown under the field (e.g. the feedback that will be replaced). */
  note?: React.ReactNode;
  /** Resolve true to close the dialog. */
  onSubmit: (reason: string) => Promise<boolean>;
}

/** K19: a dialog whose text field is mandatory (cancel, summary revision notes). */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  confirmText,
  destructive,
  note,
  onSubmit,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const submit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      if (await onSubmit(reason.trim())) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-2">
          <Label>
            {label} <span className="text-destructive">*</span>
          </Label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={placeholder}
            maxLength={MAX_REASON}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">{reason.length}/{MAX_REASON}</p>
          {note}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={submit} disabled={submitting || !reason.trim()}>
            {submitting && <Spinner className="mr-2 h-4 w-4" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface RejectRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName?: string | null;
  onSubmit: (data: { reason: string; suggestedDate: string | null }) => Promise<boolean>;
}

/** K19: reject a request with a mandatory reason and an optional suggested time. */
export function RejectRequestDialog({ open, onOpenChange, studentName, onSubmit }: RejectRequestDialogProps) {
  const [reason, setReason] = useState('');
  const [suggested, setSuggested] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason('');
      setSuggested(null);
    }
  }, [open]);

  const suggestedInPast = !!suggested && suggested.getTime() <= Date.now();

  const submit = async () => {
    if (!reason.trim() || suggestedInPast) return;
    setSubmitting(true);
    try {
      if (await onSubmit({ reason: reason.trim(), suggestedDate: suggested ? suggested.toISOString() : null })) {
        onOpenChange(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tolak Pengajuan Bimbingan</DialogTitle>
          <DialogDescription>
            {studentName ? `Pengajuan dari ${studentName} akan ditolak. ` : ''}
            Mahasiswa akan melihat alasan dan usulan waktu Anda, lalu dapat mengajukan bimbingan baru.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>
              Alasan penolakan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Saya sedang dinas luar pada waktu tersebut."
              maxLength={MAX_REASON}
              rows={3}
            />
          </div>
          <div className="grid gap-2">
            <Label>Usulan waktu lain (opsional)</Label>
            <DateTimePicker value={suggested} onChange={setSuggested} min={new Date()} />
            {suggestedInPast && <p className="text-xs text-destructive">Usulan waktu harus di masa depan.</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting || !reason.trim() || suggestedInPast}>
            {submitting && <Spinner className="mr-2 h-4 w-4" />}
            Tolak Pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface LecturerRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDateText?: string | null;
  onSubmit: (data: { newDate: string; reason: string }) => Promise<boolean>;
}

/** K19: the lecturer moves an accepted session; the new time applies immediately. */
export function LecturerRescheduleDialog({ open, onOpenChange, currentDateText, onSubmit }: LecturerRescheduleDialogProps) {
  const [when, setWhen] = useState<Date | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setWhen(null);
      setReason('');
    }
  }, [open]);

  const inPast = !!when && when.getTime() <= Date.now();
  const valid = !!when && !inPast && !!reason.trim();

  const submit = async () => {
    if (!valid || !when) return;
    setSubmitting(true);
    try {
      if (await onSubmit({ newDate: when.toISOString(), reason: reason.trim() })) onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ubah Jadwal Bimbingan</DialogTitle>
          <DialogDescription>
            {currentDateText ? `Jadwal saat ini: ${currentDateText}. ` : ''}
            Jadwal baru langsung berlaku dan mahasiswa mendapat notifikasi beserta alasannya.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>
              Jadwal baru <span className="text-destructive">*</span>
            </Label>
            <DateTimePicker value={when} onChange={setWhen} min={new Date()} />
            {inPast && <p className="text-xs text-destructive">Jadwal baru harus di masa depan.</p>}
          </div>
          <div className="grid gap-2">
            <Label>
              Alasan perubahan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Ada rapat fakultas pada jadwal semula."
              maxLength={MAX_REASON}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={submit} disabled={submitting || !valid}>
            {submitting && <Spinner className="mr-2 h-4 w-4" />}
            Simpan Jadwal Baru
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
