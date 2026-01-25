import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Target,
  CheckCircle2,
  Loader2,
  ClipboardList,
  Clock,
  ListTodo,
  ArrowRight,
  Eye,
} from "lucide-react";
import { getPendingApproval, approveSessionSummary, type PendingApprovalItem } from "@/services/lecturerGuidance.service";
import { toTitleCaseName } from "@/lib/text";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PendingApprovalList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["pending-approval"],
    queryFn: () => getPendingApproval(),
  });

  const approveMutation = useMutation({
    mutationFn: approveSessionSummary,
    onSuccess: () => {
      toast.success("Catatan bimbingan berhasil disetujui");
      queryClient.invalidateQueries({ queryKey: ["pending-approval"] });
      queryClient.invalidateQueries({ queryKey: ["lecturer-requests"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyetujui catatan");
    },
  });

  // Don't show loading state to avoid multiple spinners on page
  // This is an optional component that shows pending approvals
  if (isLoading || error) {
    return null;
  }

  const guidances = data?.guidances || [];

  if (guidances.length === 0) {
    return null; // Don't show card if no pending approvals
  }

  return (
    <Alert variant="default" className="border-violet-200 bg-violet-50/80 [&>svg]:text-violet-600">
      <Clock className="h-5 w-5" />
      <AlertTitle className="text-violet-800 font-semibold flex items-center gap-2">
        Catatan Bimbingan Menunggu Approval
        <Badge variant="secondary" className="bg-violet-100 text-violet-700 hover:bg-violet-100">
          {guidances.length}
        </Badge>
      </AlertTitle>
      <AlertDescription className="mt-3">
        <p className="text-violet-700 text-sm mb-3">
          Klik "Setujui" untuk menyelesaikan sesi bimbingan
        </p>
        <Accordion type="single" collapsible className="space-y-2">
          {guidances.map((guidance: PendingApprovalItem) => (
            <AccordionItem
              key={guidance.id}
              value={guidance.id}
              className="border rounded-lg bg-white/90 shadow-sm px-4"
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-violet-600" />
                        <span className="font-medium text-foreground">
                          {toTitleCaseName(guidance.studentName || "-")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{guidance.approvedDateFormatted || "-"}</span>
                        {guidance.milestoneName && (
                          <>
                            <span className="text-muted-foreground/50">•</span>
                            <Target className="h-3 w-3" />
                            <span>{guidance.milestoneName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="ml-4 bg-violet-600 hover:bg-violet-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      approveMutation.mutate(guidance.id);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Setujui
                      </>
                    )}
                  </Button>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4 space-y-3">
                <Separator />
                {guidance.sessionSummary && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                      <ClipboardList className="h-4 w-4 text-violet-600" />
                      Ringkasan Pembahasan
                    </h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg border">
                      {guidance.sessionSummary}
                    </div>
                  </div>
                )}

                {guidance.actionItems && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-foreground">
                      <ListTodo className="h-4 w-4 text-violet-600" />
                      Saran & Tugas Perbaikan
                    </h4>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg border">
                      {guidance.actionItems}
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Dikirim: {guidance.summarySubmittedAtFormatted || "-"}
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/tugas-akhir/bimbingan/lecturer/session/${guidance.id}`)}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Lihat Detail & Dokumen
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AlertDescription>
    </Alert>
  );
}
