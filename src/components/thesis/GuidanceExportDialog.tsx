import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loading, Spinner } from "@/components/ui/spinner";
import { Download } from "lucide-react";
import { getGuidanceForExport, generateGuidanceLogPdf } from "@/services/studentGuidance.service";
import { toTitleCaseName } from "@/lib/text";
import { toast } from "sonner";

interface GuidanceExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guidanceId: string | null;
}

export default function GuidanceExportDialog({
  open,
  onOpenChange,
  guidanceId,
}: GuidanceExportDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["guidance-export", guidanceId],
    queryFn: () => (guidanceId ? getGuidanceForExport(guidanceId) : Promise.reject("No ID")),
    enabled: !!guidanceId && open,
  });

  const guidance = data?.guidance;

  const handleDownload = async () => {
    if (!guidanceId) return;

    setIsGenerating(true);
    try {
      const blob = await generateGuidanceLogPdf([guidanceId]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Log_Bimbingan_${guidance?.studentId || "export"}_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || "Gagal generate log bimbingan");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Bukti Bimbingan Tugas Akhir
          </DialogTitle>
          <DialogDescription>
            Dokumen bukti pelaksanaan bimbingan tugas akhir
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loading text="Memuat data bimbingan..." />
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">
            Gagal memuat data bimbingan
          </div>
        ) : guidance ? (
          <div className="space-y-4" id="guidance-export-content">
            {/* Student Info Header */}
            <div className="border-b pb-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama Mahasiswa:</span>
                  <p className="font-semibold">{toTitleCaseName(guidance.studentName || "-")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">NIM:</span>
                  <p className="font-semibold">{guidance.studentId || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dosen Pembimbing:</span>
                  <p className="font-semibold">{toTitleCaseName(guidance.supervisorName || "-")}</p>
                </div>
                {guidance.thesisTitle && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Judul Tugas Akhir:</span>
                    <p className="font-semibold">{guidance.thesisTitle}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left font-semibold w-45">
                    Jadwal Bimbingan
                  </th>
                  <th className="border px-3 py-2 text-left font-semibold">
                    Catatan Bimbingan
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-2 align-top">
                    <div className="space-y-1">
                      <p className="font-medium">{guidance.approvedDateFormatted || "-"}</p>
                      {guidance.duration && (
                        <p className="text-xs text-muted-foreground">
                          {guidance.duration} menit
                        </p>
                      )}
                      {guidance.milestoneName && (
                        <p className="text-xs text-muted-foreground">
                          {guidance.milestoneName}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="border px-3 py-2 align-top">
                    <div className="space-y-2">
                      {guidance.sessionSummary && (
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-0.5">Ringkasan:</p>
                          <p className="whitespace-pre-wrap">{guidance.sessionSummary}</p>
                        </div>
                      )}
                      {guidance.actionItems && (
                        <div>
                          <p className="font-medium text-xs text-muted-foreground mb-0.5">Arahan/Saran:</p>
                          <p className="whitespace-pre-wrap">{guidance.actionItems}</p>
                        </div>
                      )}
                      {!guidance.sessionSummary && !guidance.actionItems && (
                        <p className="text-muted-foreground italic">Tidak ada catatan</p>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Diselesaikan: {guidance.completedAtFormatted || "-"}</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={handleDownload} disabled={isLoading || !!error || isGenerating}>
            {isGenerating ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Mengunduh...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
