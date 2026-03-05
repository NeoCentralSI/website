import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import {
  getKadepPendingTransfers,
  kadepApproveTransfer,
  kadepRejectTransfer,
  type KadepTransfer,
} from "@/services/monitoring.service";
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  UserRound,
  ArrowRight,
} from "lucide-react";

export function KadepTransferApproval() {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    transfer: KadepTransfer | null;
  }>({ open: false, transfer: null });
  const [rejectReason, setRejectReason] = useState("");

  const { data } = useQuery({
    queryKey: ["kadep-pending-transfers"],
    queryFn: getKadepPendingTransfers,
    refetchInterval: 30000,
  });

  const transfers = data?.transfers ?? [];

  const approveMutation = useMutation({
    mutationFn: (notificationId: string) => kadepApproveTransfer(notificationId),
    onSuccess: (data) => {
      toast.success(data.message || "Transfer disetujui dan diteruskan ke dosen tujuan");
      queryClient.invalidateQueries({ queryKey: ["kadep-pending-transfers"] });
    },
    onError: (error: Error) => {
      toast.error("Gagal menyetujui transfer", { description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      notificationId,
      reason,
    }: {
      notificationId: string;
      reason?: string;
    }) => kadepRejectTransfer(notificationId, reason),
    onSuccess: (data) => {
      toast.success(data.message || "Transfer ditolak");
      queryClient.invalidateQueries({ queryKey: ["kadep-pending-transfers"] });
      setRejectDialog({ open: false, transfer: null });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error("Gagal menolak transfer", { description: error.message });
    },
  });

  if (transfers.length === 0) return null;

  const handleReject = () => {
    if (!rejectDialog.transfer) return;
    rejectMutation.mutate({
      notificationId: rejectDialog.transfer.notificationId,
      reason: rejectReason.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Permintaan Transfer Mahasiswa
          <Badge variant="destructive" className="text-xs ml-1">
            {transfers.length} menunggu
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transfers.map((t) => (
          <Card
            key={t.notificationId}
            className="p-4 border-primary/20 bg-primary/5"
          >
            <div className="space-y-3">
              {/* Transfer direction */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">
                    {toTitleCaseName(t.sourceLecturerName)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">
                    {toTitleCaseName(t.targetLecturerName)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Diajukan: {formatDateId(t.createdAt)}
                </p>
              </div>

              {/* Students list */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  Mahasiswa ({t.students.length}):
                </p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {t.students.map((s) => (
                    <div
                      key={s.thesisId}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <UserRound className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium">
                        {toTitleCaseName(s.studentName)}
                      </span>
                      <span className="text-muted-foreground">
                        ({s.studentNim})
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Alasan: </span>
                <span className="italic">{t.reason}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() =>
                    approveMutation.mutate(t.notificationId)
                  }
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <>
                      <Spinner className="h-3 w-3" />
                      Menyetujui...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Setujui Transfer
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() =>
                    setRejectDialog({ open: true, transfer: t })
                  }
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>

      {/* Reject Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, transfer: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan Transfer</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menolak permintaan transfer dari{" "}
                  <span className="font-medium text-foreground">
                    {rejectDialog.transfer
                      ? toTitleCaseName(
                          rejectDialog.transfer.sourceLecturerName
                        )
                      : ""}
                  </span>{" "}
                  ke{" "}
                  <span className="font-medium text-foreground">
                    {rejectDialog.transfer
                      ? toTitleCaseName(
                          rejectDialog.transfer.targetLecturerName
                        )
                      : ""}
                  </span>
                  .
                </p>
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Alasan penolakan (opsional)
                  </label>
                  <Textarea
                    className="mt-1.5"
                    placeholder="Berikan alasan penolakan..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Menolak...
                </>
              ) : (
                "Ya, Tolak Transfer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
