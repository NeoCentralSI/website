import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLecturerQuotaAvailability } from "@/hooks/master-data/useSupervisionQuota";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner, Loading } from "@/components/ui/spinner";
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
import {
  getSupervisor2KadepRequests,
  approveSupervisor2KadepRequest,
  rejectSupervisor2KadepRequest,
  type Supervisor2KadepRequestItem,
} from "@/services/lecturerGuidance.service";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { UserPlus, CheckCircle2, XCircle } from "lucide-react";

/**
 * Antrean persetujuan akhir Pembimbing 2 oleh KaDep (audit pass 2 F2-5 / OQ-2.2).
 * Dosen target sudah menyatakan bersedia; KaDep memutuskan penetapan resmi.
 * Approve → thesis_participants P2 dibuat; jika TA-04 sudah batch, periode perlu difinalisasi ulang.
 */
export function Supervisor2KadepSection() {
  const queryClient = useQueryClient();
  const [decisionDialog, setDecisionDialog] = useState<{
    open: boolean;
    mode: "approve" | "reject";
    request: Supervisor2KadepRequestItem | null;
  }>({ open: false, mode: "approve", request: null });
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["kadep-supervisor2-requests"],
    queryFn: getSupervisor2KadepRequests,
  });
  const quotaByLecturer = useLecturerQuotaAvailability(requests.map((req) => req.lecturerId));

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["kadep-supervisor2-requests"] });
    queryClient.invalidateQueries({ queryKey: ["quota-check"] });
  };

  const approveMutation = useMutation({
    mutationFn: (requestId: string) => approveSupervisor2KadepRequest(requestId),
    onSuccess: (data) => {
      toast.success(data.message || "Pembimbing 2 disetujui.");
      invalidate();
      setDecisionDialog({ open: false, mode: "approve", request: null });
    },
    onError: (error: Error) => {
      toast.error("Gagal menyetujui", { description: error.message });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason?: string }) =>
      rejectSupervisor2KadepRequest(requestId, reason),
    onSuccess: (data) => {
      toast.success(data.message || "Permintaan tidak disetujui.");
      invalidate();
      setDecisionDialog({ open: false, mode: "reject", request: null });
      setRejectReason("");
    },
    onError: (error: Error) => {
      toast.error("Gagal menolak", { description: error.message });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat antrean Pembimbing 2..." />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>Tidak ada permintaan Pembimbing 2 yang menunggu persetujuan.</p>
        <p className="text-xs mt-1">
          Permintaan muncul setelah dosen target menyatakan bersedia menjadi Pembimbing 2.
        </p>
      </div>
    );
  }

  const quotaGate = (lecturerId: string) => {
    const check = quotaByLecturer.get(lecturerId);
    if (!check || check.isError || !check.availability) {
      return {
        blocked: false,
        checking: Boolean(check?.isLoading),
        figures: check?.availability,
        reason: null as string | null,
        quotaFull: false,
      };
    }
    return {
      blocked: check.availability.allowed === false,
      checking: false,
      figures: check.availability,
      reason: check.availability.reason ?? null,
      quotaFull: check.availability.trafficLight === "red" && check.availability.allowed !== false,
    };
  };

  const activeRequest = decisionDialog.request;
  const isPending = approveMutation.isPending || rejectMutation.isPending;
  const activeGate = activeRequest ? quotaGate(activeRequest.lecturerId) : null;

  return (
    <div className="space-y-3">
      <Card className="border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-900">
        Dosen target telah menyatakan bersedia. Persetujuan Anda menetapkan Pembimbing 2
        secara resmi (sesuai ketentuan Panduan TA: perubahan komposisi pembimbing disetujui
        Ketua Departemen). Jika Formulir TA-04 periode sudah pernah difinalisasi,
        batch perlu diperbarui agar memuat komposisi pembimbing terbaru.
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {requests.map((req) => {
          const gate = quotaGate(req.lecturerId);
          const figures = gate.figures;
          return (
          <Card key={req.requestId} className="p-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold">{toTitleCaseName(req.studentName)}</p>
                <p className="text-xs text-muted-foreground">{req.studentNim || ""}</p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p className="line-clamp-2" title={req.thesisTitle}>
                  Judul: {req.thesisTitle}
                </p>
                <p>
                  Calon Pembimbing 2:{" "}
                  <span className="font-medium text-foreground">
                    {toTitleCaseName(req.lecturerName)}
                  </span>
                </p>
                <p>Dosen bersedia sejak: {formatDateId(req.requestedAt)}</p>
                {figures && typeof figures.currentCount === "number" ? (
                  <p className="text-foreground">
                    Kuota calon P2: {figures.currentCount}/{figures.quotaMax}
                    {typeof figures.remaining === "number" ? ` (sisa ${figures.remaining})` : ""}
                  </p>
                ) : gate.checking ? (
                  <p>Memeriksa kuota calon Pembimbing 2…</p>
                ) : null}
                {gate.quotaFull ? (
                  <p className="text-muted-foreground">
                    Kuota calon Pembimbing 2 penuh. Persetujuan tetap dapat menetapkan overquota sah.
                  </p>
                ) : null}
                {gate.blocked && gate.reason ? (
                  <p className="text-destructive">{gate.reason}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={isPending || gate.blocked}
                  title={gate.blocked ? (gate.reason ?? "Kuota calon Pembimbing 2 tidak mencukupi") : undefined}
                  onClick={() => setDecisionDialog({ open: true, mode: "approve", request: req })}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Setujui
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={() => setDecisionDialog({ open: true, mode: "reject", request: req })}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Tolak
                </Button>
              </div>
            </div>
          </Card>
          );
        })}
      </div>

      <AlertDialog
        open={decisionDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setDecisionDialog({ open: false, mode: "approve", request: null });
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decisionDialog.mode === "approve"
                ? "Setujui Pembimbing 2?"
                : "Tolak Permintaan Pembimbing 2?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {decisionDialog.mode === "approve" ? (
                    <>
                      <span className="font-medium text-foreground">
                        {activeRequest ? toTitleCaseName(activeRequest.lecturerName) : ""}
                      </span>{" "}
                      akan ditetapkan sebagai Pembimbing 2 untuk{" "}
                      <span className="font-medium text-foreground">
                        {activeRequest ? toTitleCaseName(activeRequest.studentName) : ""}
                      </span>
                      . Jika Formulir TA-04 periode sudah tersedia, KaDep perlu memperbarui batch agar memuat Pembimbing 2.
                    </>
                  ) : (
                    <>
                      Permintaan Pembimbing 2 dari{" "}
                      <span className="font-medium text-foreground">
                        {activeRequest ? toTitleCaseName(activeRequest.studentName) : ""}
                      </span>{" "}
                      (dosen: {activeRequest ? toTitleCaseName(activeRequest.lecturerName) : ""})
                      akan ditutup. Mahasiswa dan dosen akan dinotifikasi.
                    </>
                  )}
                </p>
                {decisionDialog.mode === "approve" && activeGate?.figures ? (
                  <p>
                    {typeof activeGate.figures.currentCount === "number"
                      ? `Kuota calon P2: ${activeGate.figures.currentCount}/${activeGate.figures.quotaMax}`
                      : activeGate.quotaFull
                        ? "Kuota calon Pembimbing 2 penuh. Persetujuan tetap dapat menetapkan overquota sah."
                        : null}
                    {activeGate.blocked
                      ? `. ${activeGate.reason ?? "Dosen menutup penerimaan."}`
                      : ""}
                  </p>
                ) : null}
                {decisionDialog.mode === "reject" && (
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Alasan (opsional)
                    </label>
                    <Textarea
                      className="mt-1.5"
                      placeholder="Berikan alasan keputusan..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                    />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending || (decisionDialog.mode === "approve" && Boolean(activeGate?.blocked))}
              className={
                decisionDialog.mode === "reject"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : undefined
              }
              onClick={() => {
                if (!activeRequest) return;
                if (decisionDialog.mode === "approve") {
                  approveMutation.mutate(activeRequest.requestId);
                } else {
                  rejectMutation.mutate({
                    requestId: activeRequest.requestId,
                    reason: rejectReason.trim() || undefined,
                  });
                }
              }}
            >
              {isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : decisionDialog.mode === "approve" ? (
                "Ya, Setujui"
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
