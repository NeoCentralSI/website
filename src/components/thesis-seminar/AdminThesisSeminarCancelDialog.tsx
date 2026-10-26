import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useCancelAdminThesisSeminar } from '@/hooks/thesis-seminar/useAdminThesisSeminar';

interface AdminThesisSeminarCancelModalProps {
  seminarId: string | null;
  studentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminThesisSeminarCancelModal({
  seminarId,
  studentName,
  open,
  onOpenChange,
  onSuccess,
}: AdminThesisSeminarCancelModalProps) {
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelAdminThesisSeminar();

  const handleCancel = () => {
    if (!seminarId) return;
    cancelMutation.mutate(
      { seminarId, cancelledReason: reason.trim() || undefined },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
          onSuccess?.();
        },
      }

    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !cancelMutation.isPending) {
      setReason('');
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Batalkan Seminar Hasil</DialogTitle>
          <DialogDescription>
            Status seminar <span className="font-medium text-foreground">{studentName || 'mahasiswa ini'}</span> menjadi Dibatalkan, dan mahasiswa harus mendaftar ulang untuk dijadwalkan kembali
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Alasan pembatalan</Label>
          <Textarea
            id="cancel-reason"
            placeholder="Opsional"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={cancelMutation.isPending}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Batalkan Seminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
