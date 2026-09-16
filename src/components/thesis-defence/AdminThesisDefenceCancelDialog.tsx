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
import { useCancelAdminDefence } from '@/hooks/thesis-defence/useAdminThesisDefence';

interface AdminThesisDefenceCancelDialogProps {
  defenceId: string | null;
  studentName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminThesisDefenceCancelDialog({
  defenceId,
  studentName,
  open,
  onOpenChange,
  onSuccess,
}: AdminThesisDefenceCancelDialogProps) {
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelAdminDefence();

  const handleCancel = () => {
    if (!defenceId) return;
    cancelMutation.mutate(
      { defenceId, cancelledReason: reason.trim() || undefined },
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
      <DialogContent className="gap-5 sm:max-w-xl">
        <DialogHeader className="space-y-2 pr-8">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Batalkan Sidang TA
          </DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin membatalkan pendaftaran sidang untuk{' '}
            <span className="font-semibold text-foreground">{studentName || 'mahasiswa ini'}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Alert variant="destructive" className="border-red-200 bg-red-50/60 p-4">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertTitle className="text-destructive">Peringatan</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed text-red-700">
              Tindakan ini akan mengubah status sidang menjadi "Dibatalkan". Mahasiswa harus mendaftar ulang jika ingin menjadwalkan kembali.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Alasan Pembatalan (opsional)</Label>
            <Textarea
              id="reason"
              placeholder="Masukkan alasan mengapa sidang ini dibatalkan..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="border-t border-gray-200 pt-4">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={cancelMutation.isPending}>
            Kembali
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Memproses...' : 'Ya, Batalkan Sidang'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
