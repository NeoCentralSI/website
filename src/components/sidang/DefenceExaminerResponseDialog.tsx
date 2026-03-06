import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useRespondDefenceExaminerAssignment } from '@/hooks/defence';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, UserCheck, BookOpen, GraduationCap } from 'lucide-react';
import type { ExaminerDefenceRequestItem } from '@/types/defence.types';

interface DefenceExaminerResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defence: ExaminerDefenceRequestItem | null;
  onSuccess: () => void;
}

export function DefenceExaminerResponseDialog({
  open,
  onOpenChange,
  defence,
  onSuccess,
}: DefenceExaminerResponseDialogProps) {
  const respondMutation = useRespondDefenceExaminerAssignment();

  const handleRespond = (status: 'available' | 'unavailable') => {
    if (!defence?.myExaminerId) return;

    respondMutation.mutate(
      {
        examinerId: defence.myExaminerId,
        payload: { status },
      },
      {
        onSuccess: (data) => {
          if (status === 'available') {
            toast.success('Anda telah menyetujui penugasan sebagai penguji');
          } else {
            toast.success('Anda telah menolak penugasan sebagai penguji');
          }
          if (data.defenceTransitioned) {
            toast.info('Semua penguji telah menyetujui. Sidang siap dijadwalkan.');
          }
          onSuccess();
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Gagal mengirim respons');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Konfirmasi Penugasan Penguji
          </DialogTitle>
          <DialogDescription>
            Anda ditugaskan sebagai penguji sidang.
          </DialogDescription>
        </DialogHeader>

        {defence && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-sm">
                    {toTitleCaseName(defence.studentName)}
                  </div>
                  <div className="text-xs text-muted-foreground">{defence.studentNim}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm leading-snug">{defence.thesisTitle}</div>
                </div>
              </div>

              {defence.supervisors.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  {defence.supervisors.map((s, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <span>{formatRoleName(s.role)}:</span>{' '}
                      <span className="text-foreground">{toTitleCaseName(s.name)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peran Anda:</span>
              <Badge variant="outline">Penguji {defence.myExaminerOrder}</Badge>
            </div>

            <p className="text-sm">
              Apakah Anda bersedia menjadi penguji untuk sidang mahasiswa ini?
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => handleRespond('unavailable')}
            disabled={respondMutation.isPending}
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
          >
            {respondMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Memproses...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Tolak Penugasan
              </>
            )}
          </Button>
          <Button
            onClick={() => handleRespond('available')}
            disabled={respondMutation.isPending}
            className="flex-1"
          >
            {respondMutation.isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Memproses...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Setujui Penugasan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
