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
import { useRespondExaminerAssignment } from '@/hooks/thesis-seminar/useLecturerSeminar';
import { toTitleCaseName, formatRoleName } from '@/lib/text';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, UserCheck, BookOpen, GraduationCap } from 'lucide-react';
import type { ExaminerRequestItem } from '@/types/seminar.types';

interface ExaminerResponseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seminar: ExaminerRequestItem | null;
  onSuccess: () => void;
}

export function ExaminerResponseDialog({
  open,
  onOpenChange,
  seminar,
  onSuccess,
}: ExaminerResponseDialogProps) {
  const respondMutation = useRespondExaminerAssignment();

  const handleRespond = (status: 'available' | 'unavailable') => {
    if (!seminar?.myExaminerId) return;

    respondMutation.mutate(
      {
        examinerId: seminar.myExaminerId,
        payload: { status },
      },
      {
        onSuccess: (data) => {
          if (status === 'available') {
            toast.success('Anda telah menyetujui penugasan sebagai penguji');
          } else {
            toast.success('Anda telah menolak penugasan sebagai penguji');
          }
          if (data.seminarTransitioned) {
            toast.info('Semua penguji telah menyetujui. Seminar siap dijadwalkan.');
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
            Anda ditugaskan sebagai penguji seminar hasil.
          </DialogDescription>
        </DialogHeader>

        {seminar && (
          <div className="space-y-4">
            {/* Student & Thesis Info Card */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-sm">
                    {toTitleCaseName(seminar.studentName)}
                  </div>
                  <div className="text-xs text-muted-foreground">{seminar.studentNim}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm leading-snug">{seminar.thesisTitle}</div>
                </div>
              </div>

              {seminar.supervisors.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  {seminar.supervisors.map((s, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <span>{formatRoleName(s.role)}:</span>{' '}
                      <span className="text-foreground">{toTitleCaseName(s.name)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Role Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peran Anda:</span>
              <Badge variant="outline">Penguji {seminar.myExaminerOrder}</Badge>
            </div>

            {/* Confirmation Question */}
            <p className="text-sm">
              Apakah Anda bersedia menjadi penguji untuk seminar hasil mahasiswa ini?
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
