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
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Batalkan Seminar Hasil
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin membatalkan pendaftaran seminar untuk{' '}
            <span className="font-semibold text-foreground">{studentName || 'mahasiswa ini'}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Alert variant="destructive" className="bg-destructive/5 border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Peringatan</AlertTitle>
            <AlertDescription className="text-destructive/80 text-xs">
              Tindakan ini akan mengubah status seminar menjadi "Dibatalkan". Mahasiswa harus mendaftar ulang jika ingin menjadwalkan kembali.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Pembatalan (opsional)</Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan mengapa seminar ini dibatalkan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={cancelMutation.isPending}>
            Kembali
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Memproses...' : 'Ya, Batalkan Seminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
