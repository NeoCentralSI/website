import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
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
  getSupervisor2Requests,
  approveSupervisor2Request,
  rejectSupervisor2Request,
  type Supervisor2RequestItem,
} from "@/services/lecturerGuidance.service";
import { UserPlus, CheckCircle2, XCircle } from "lucide-react";

export function Supervisor2RequestsSection() {
  const queryClient = useQueryClient();
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; request: Supervisor2RequestItem | null }>({
    open: false,
    request: null,
  });
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests = [] } = useQuery({
    queryKey: ["supervisor2-requests"],
    queryFn: getSupervisor2Requests,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2Request(requestId),
    onSuccess: (data) => {
      toast.success(data.message || "Permintaan disetujui");
      queryClient.invalidateQueries({ queryKey: ["supervisor2-requests"] });
      queryClient.invalidateQueries({ queryKey: ["lecturer-my-students"] });
    },
    onError: (error: Error) => {
      toast.error("Gagal menyetujui permintaan", { description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectSupervisor2Request(requestId, reason),
    onSuccess: (data) => {
      toast.success(data.message || "Permintaan ditolak");
      queryClient.invalidateQueries({ queryKey: ["supervisor2-requests"] });
      setRejectDialog({ open: false, request: null });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error("Gagal menolak permintaan", { description: error.message });
    },
  });

  if (requests.length === 0) return null;

  const handleReject = () => {
    if (!rejectDialog.request) return;
    rejectMutation.mutate({
      requestId: rejectDialog.request.requestId,
      reason: rejectReason.trim() || undefined,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">
          Permintaan Pembimbing 2
        </h3>
        <Badge variant="secondary" className="text-xs">
          {requests.length}
        </Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {requests.map((req) => (
          <Card key={req.requestId} className="p-4 border-primary/20 bg-primary/5">
            <div className="space-y-3">
              {/* Student Info */}
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toTitleCaseName(req.studentName)}</p>
                <p className="text-xs text-muted-foreground">
                  {req.studentNim || ""}
                  {req.studentEmail ? ` • ${req.studentEmail}` : ""}
                </p>
              </div>

              {/* Thesis Info */}
              <div className="text-xs text-muted-foreground">
                <p className="line-clamp-2" title={req.thesisTitle}>
                  Judul: {req.thesisTitle}
                </p>
                <p className="mt-1">Diajukan: {formatDateId(req.requestedAt)}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  onClick={() => approveMutation.mutate(req.requestId)}
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
                      Setujui
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setRejectDialog({ open: true, request: req })}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Reject Reason Dialog */}
      <AlertDialog
        open={rejectDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog({ open: false, request: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan Pembimbing 2</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Anda akan menolak permintaan dari{" "}
                  <span className="font-medium text-foreground">
                    {rejectDialog.request ? toTitleCaseName(rejectDialog.request.studentName) : ""}
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
            <AlertDialogCancel disabled={rejectMutation.isPending}>Batal</AlertDialogCancel>
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
                "Ya, Tolak"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
