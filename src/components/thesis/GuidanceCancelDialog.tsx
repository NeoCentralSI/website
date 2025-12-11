import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GuidanceCancelDialogProps {
  onCancel: (data: { reason: string }) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function GuidanceCancelDialog({ onCancel, trigger }: GuidanceCancelDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    const success = await onCancel({ reason });
    if (success) {
      setOpen(false);
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="destructive">Batalkan</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Bimbingan</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Alasan</Label>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Tutup
            </Button>
            <Button variant="destructive" onClick={handleSubmit}>
              Konfirmasi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
