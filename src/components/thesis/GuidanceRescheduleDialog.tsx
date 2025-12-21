import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

interface GuidanceRescheduleDialogProps {
  onReschedule: (data: { requestedDate: string; studentNotes: string }) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function GuidanceRescheduleDialog({ onReschedule, trigger }: GuidanceRescheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ requestedDate: '', studentNotes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const success = await onReschedule(data);
      if (success) {
        setOpen(false);
        setData({ requestedDate: '', studentNotes: '' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Reschedule</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule Bimbingan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Waktu Baru</Label>
            <Input
              type="datetime-local"
              value={data.requestedDate}
              onChange={(e) => setData((s) => ({ ...s, requestedDate: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Alasan (opsional)</Label>
            <Input
              value={data.studentNotes}
              onChange={(e) => setData((s) => ({ ...s, studentNotes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
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
