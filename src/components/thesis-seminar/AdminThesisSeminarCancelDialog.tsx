import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { useCancelAdminThesisSeminar } from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import type { AdminSeminarListItem } from '@/types/seminar.types';
import { toTitleCaseName } from '@/lib/text';

interface AdminThesisSeminarCancelModalProps {
  seminar: AdminSeminarListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminThesisSeminarCancelModal({
  seminar,
  open,
  onOpenChange,
}: AdminThesisSeminarCancelModalProps) {
  const [reason, setReason] = useState('');
  const cancelMutation = useCancelAdminThesisSeminar();

  const handleCancel = () => {
    if (!seminar) return;

    cancelMutation.mutate(
      {
        seminarId: seminar.id,
        cancelledReason: reason.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      onOpenChange(val);
      if (!val) setReason('');
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Batalkan Seminar Hasil</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin membatalkan pendaftaran seminar hasil mahasiswa berikut?
          </DialogDescription>
        </DialogHeader>

        {seminar && (
          <div className="py-2 space-y-1">
            <div className="text-sm font-medium">{toTitleCaseName(seminar.studentName)}</div>
            <div className="text-xs text-muted-foreground">{seminar.studentNim}</div>
            <div className="text-xs italic mt-1 line-clamp-2">{seminar.thesisTitle}</div>
          </div>
        )}

        <div className="space-y-2 mt-2">
          <label className="text-sm font-medium">Alasan Pembatalan (Opsional)</label>
          <Textarea
            placeholder="Masukkan alasan mengapa seminar ini dibatalkan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={cancelMutation.isPending}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Memproses...
              </>
            ) : (
              'Ya, Batalkan Seminar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
