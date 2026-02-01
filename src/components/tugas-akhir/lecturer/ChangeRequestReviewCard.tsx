import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, XCircle, FileEdit, ArrowRightLeft, Users } from "lucide-react";
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
import { formatDateId, toTitleCaseName } from "@/lib/text";
import {
  getPendingChangeRequestForThesis,
  reviewChangeRequest,
  type PendingChangeRequest,
} from "@/services/lecturerGuidance.service";

interface ChangeRequestReviewCardProps {
  thesisId: string;
  studentName: string;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  topic: "Pergantian Topik",
  supervisor: "Pergantian Pembimbing",
  both: "Pergantian Topik & Pembimbing",
};

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  topic: <FileEdit className="h-4 w-4" />,
  supervisor: <Users className="h-4 w-4" />,
  both: <ArrowRightLeft className="h-4 w-4" />,
};

export function ChangeRequestReviewCard({ thesisId, studentName }: ChangeRequestReviewCardProps) {
  const queryClient = useQueryClient();
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["pending-change-request", thesisId],
    queryFn: () => getPendingChangeRequestForThesis(thesisId),
    enabled: !!thesisId,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ requestId, status, notes }: { requestId: string; status: "approved" | "rejected"; notes?: string }) =>
      reviewChangeRequest(requestId, { status, notes }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.status === "approved"
          ? "Permintaan berhasil disetujui"
          : "Permintaan berhasil ditolak"
      );
      queryClient.invalidateQueries({ queryKey: ["pending-change-request", thesisId] });
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setNotes("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleApprove = () => {
    if (!data?.data) return;
    reviewMutation.mutate({
      requestId: data.data.id,
      status: "approved",
      notes: notes.trim() || undefined,
    });
  };

  const handleReject = () => {
    if (!data?.data) return;
    if (!notes.trim()) {
      toast.error("Catatan penolakan wajib diisi");
      return;
    }
    reviewMutation.mutate({
      requestId: data.data.id,
      status: "rejected",
      notes: notes.trim(),
    });
  };

  // Don't render if loading or no pending request
  if (isLoading) {
    return null;
  }

  if (!data?.data) {
    return null;
  }

  const request = data.data as PendingChangeRequest;

  // Find current lecturer's approval status
  const myApproval = request.approvals.find((a) => a.status === "pending");

  // If no pending approval for this lecturer, don't show
  if (!myApproval) {
    return null;
  }

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-orange-800">
            <AlertTriangle className="h-5 w-5" />
            Permintaan Pergantian TA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              {REQUEST_TYPE_ICONS[request.requestType]}
              {REQUEST_TYPE_LABELS[request.requestType]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Diajukan {formatDateId(request.createdAt)}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Alasan Mahasiswa:</p>
            <p className="text-sm text-muted-foreground bg-white p-3 rounded-md border">
              {request.reason}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Status Approval:</p>
            <div className="flex flex-wrap gap-2">
              {request.approvals.map((approval) => (
                <Badge
                  key={approval.id}
                  variant={
                    approval.status === "approved"
                      ? "default"
                      : approval.status === "rejected"
                      ? "destructive"
                      : "outline"
                  }
                  className="gap-1"
                >
                  {approval.status === "approved" && <CheckCircle className="h-3 w-3" />}
                  {approval.status === "rejected" && <XCircle className="h-3 w-3" />}
                  {toTitleCaseName(approval.lecturer.user.fullName)}
                  {approval.status === "pending" && " (Menunggu)"}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => setShowApproveDialog(true)}
              disabled={reviewMutation.isPending}
              className="flex-1"
            >
              {reviewMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Setujui
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowRejectDialog(true)}
              disabled={reviewMutation.isPending}
              className="flex-1"
            >
              {reviewMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Tolak
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Permintaan Pergantian</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menyetujui permintaan pergantian {REQUEST_TYPE_LABELS[request.requestType].toLowerCase()} dari{" "}
              <strong>{toTitleCaseName(studentName)}</strong>. Setelah semua pembimbing menyetujui, permintaan akan diteruskan ke Ketua Departemen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="approve-notes">Catatan (opsional)</Label>
            <Textarea
              id="approve-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNotes("")}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                "Ya, Setujui"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tolak Permintaan Pergantian</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan menolak permintaan pergantian {REQUEST_TYPE_LABELS[request.requestType].toLowerCase()} dari{" "}
              <strong>{toTitleCaseName(studentName)}</strong>. Mahasiswa akan diberitahu tentang penolakan ini.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-notes">
              Alasan Penolakan <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jelaskan alasan penolakan..."
              rows={3}
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNotes("")}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={reviewMutation.isPending || !notes.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {reviewMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                "Ya, Tolak"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
