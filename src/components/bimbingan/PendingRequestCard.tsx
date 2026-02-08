import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { toTitleCaseName, formatDateId } from "@/lib/text";
import { cancelSupervisor2Request, type PendingSupervisor2Request } from "@/services/studentGuidance.service";
import { Clock, X } from "lucide-react";

interface PendingRequestCardProps {
  request: PendingSupervisor2Request;
}

export function PendingRequestCard({ request }: PendingRequestCardProps) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: cancelSupervisor2Request,
    onSuccess: () => {
      toast.success("Permintaan dibatalkan");
      queryClient.invalidateQueries({ queryKey: ["student-supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["pending-supervisor2-request"] });
    },
    onError: (error: Error) => {
      toast.error("Gagal membatalkan permintaan", {
        description: error.message,
      });
    },
  });

  return (
    <Card className="p-4 border-dashed border-amber-300 bg-amber-50/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-100">
              <Clock className="h-3 w-3" />
              Menunggu Konfirmasi
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground">
            Permintaan Pembimbing 2 ke{" "}
            <span className="font-semibold">
              {request.lecturerName ? toTitleCaseName(request.lecturerName) : "Dosen"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Diajukan {formatDateId(request.requestedAt)}
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Batalkan Permintaan?</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin membatalkan permintaan Pembimbing 2 ke{" "}
                {request.lecturerName ? toTitleCaseName(request.lecturerName) : "dosen"} ini?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Tidak</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Membatalkan...
                  </>
                ) : (
                  "Ya, Batalkan"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
