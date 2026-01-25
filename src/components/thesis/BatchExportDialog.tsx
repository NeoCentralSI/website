import { useQueries } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { Download } from "lucide-react";
import { getGuidanceForExport } from "@/services/studentGuidance.service";
import { toTitleCaseName } from "@/lib/text";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BatchExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guidanceIds: string[];
}

export default function BatchExportDialog({
  open,
  onOpenChange,
  guidanceIds,
}: BatchExportDialogProps) {
  // Fetch all guidances in parallel
  const queries = useQueries({
    queries: guidanceIds.map((id) => ({
      queryKey: ["guidance-export", id],
      queryFn: () => getGuidanceForExport(id),
      enabled: open && guidanceIds.length > 0,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.error);
  const guidances = queries
    .filter((q) => q.data?.guidance)
    .map((q) => q.data!.guidance)
    .sort((a, b) => {
      // Sort by approvedDate ascending (oldest first)
      const dateA = a.approvedDate ? new Date(a.approvedDate).getTime() : 0;
      const dateB = b.approvedDate ? new Date(b.approvedDate).getTime() : 0;
      return dateA - dateB;
    });

  // Get student info from first guidance
  const studentInfo = guidances[0];

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Bukti Bimbingan Tugas Akhir", pageWidth / 2, 20, { align: "center" });
    
    // Student Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    let yPos = 35;
    
    doc.text(`Nama Mahasiswa: ${toTitleCaseName(studentInfo?.studentName || "-")}`, 14, yPos);
    yPos += 6;
    doc.text(`NIM: ${studentInfo?.studentId || "-"}`, 14, yPos);
    yPos += 6;
    doc.text(`Dosen Pembimbing: ${toTitleCaseName(studentInfo?.supervisorName || "-")}`, 14, yPos);
    yPos += 6;
    
    if (studentInfo?.thesisTitle) {
      const titleLines = doc.splitTextToSize(`Judul TA: ${studentInfo.thesisTitle}`, pageWidth - 28);
      doc.text(titleLines, 14, yPos);
      yPos += titleLines.length * 5 + 2;
    }
    
    yPos += 5;

    // Table data
    const tableData = guidances.map((g) => {
      // Kolom 1: Jadwal
      const jadwal = [
        g.approvedDateFormatted || "-",
        `${g.type || "online"}${g.duration ? ` • ${g.duration} menit` : ""}`,
        g.milestoneName || "",
      ].filter(Boolean).join("\n");

      // Kolom 2: Catatan
      const catatanParts = [];
      if (g.sessionSummary) {
        catatanParts.push(`Ringkasan:\n${g.sessionSummary}`);
      }
      if (g.actionItems) {
        catatanParts.push(`Arahan/Saran:\n${g.actionItems}`);
      }
      const catatan = catatanParts.length > 0 ? catatanParts.join("\n\n") : "Tidak ada catatan";

      return [jadwal, catatan];
    });

    // Generate table
    autoTable(doc, {
      startY: yPos,
      head: [["Jadwal Bimbingan", "Catatan Bimbingan"]],
      body: tableData,
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: 255,
        fontStyle: "bold",
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: "auto" },
      },
      styles: {
        overflow: "linebreak",
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      margin: { left: 14, right: 14 },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Total: ${guidances.length} sesi bimbingan`, 14, finalY + 10);

    // Download
    const fileName = `Bimbingan_${studentInfo?.studentId || "TA"}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Bukti Bimbingan Tugas Akhir
          </DialogTitle>
          <DialogDescription>
            {guidanceIds.length} sesi bimbingan akan di-download sebagai PDF
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loading text="Memuat data mahasiswa..." />
        ) : hasError ? (
          <div className="text-center text-muted-foreground py-8">
            Gagal memuat data bimbingan
          </div>
        ) : guidances.length > 0 ? (
          <div className="space-y-4" id="batch-export-content">
            {/* Student Info Header */}
            <div className="border-b pb-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Nama Mahasiswa:</span>
                  <p className="font-semibold">{toTitleCaseName(studentInfo?.studentName || "-")}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">NIM:</span>
                  <p className="font-semibold">{studentInfo?.studentId || "-"}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dosen Pembimbing:</span>
                  <p className="font-semibold">{toTitleCaseName(studentInfo?.supervisorName || "-")}</p>
                </div>
                {studentInfo?.thesisTitle && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Judul Tugas Akhir:</span>
                    <p className="font-semibold">{studentInfo.thesisTitle}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Table */}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border px-3 py-2 text-left font-semibold w-[180px]">
                    Jadwal Bimbingan
                  </th>
                  <th className="border px-3 py-2 text-left font-semibold">
                    Catatan Bimbingan
                  </th>
                </tr>
              </thead>
              <tbody>
                {guidances.map((guidance, index) => (
                  <tr key={guidance.id} className={index % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    <td className="border px-3 py-2 align-top">
                      <div className="space-y-1">
                        <p className="font-medium">{guidance.approvedDateFormatted || "-"}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {guidance.type || "online"}
                          {guidance.duration && ` • ${guidance.duration} menit`}
                        </p>
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
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>Total: {guidances.length} sesi bimbingan</p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          <Button onClick={generatePDF} disabled={isLoading || hasError}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF ({guidances.length} sesi)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
