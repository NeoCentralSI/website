import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Brand colors (same as monitoring report)
const COLORS = {
  primary: "#F7931E",
  secondary: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
};

// Neo Central Logo cache
let logoBase64Cache: string | null = null;

async function fetchLogoAsBase64(): Promise<string | null> {
  if (logoBase64Cache) return logoBase64Cache;

  try {
    const response = await fetch(
      "https://vylagsnlpgdvlhydvswk.supabase.co/storage/v1/object/public/neocentral-logo/neocentral-logo.png"
    );
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        logoBase64Cache = reader.result as string;
        resolve(logoBase64Cache);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function formatDateLong(dateString?: string | null): string {
  if (!dateString) {
    return new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export interface GuidanceLogData {
  id: string;
  approvedDate?: string | null;
  approvedDateFormatted?: string;
  type?: string;
  duration?: number;
  milestoneName?: string;
  sessionSummary?: string;
  actionItems?: string;
  completedAtFormatted?: string;
}

export interface GuidanceLogReportData {
  studentName: string;
  studentId: string;
  supervisorName: string;
  thesisTitle?: string;
  guidances: GuidanceLogData[];
}

export async function generateGuidanceLogReportPDF(data: GuidanceLogReportData): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let currentY = margin;

  // Fetch logo
  const logoBase64 = await fetchLogoAsBase64();

  // ============ KOP SURAT ============
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", margin, currentY, 22, 22);
  }

  const headerX = margin + 26;

  doc.setTextColor(COLORS.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("NEO CENTRAL DSI", headerX, currentY + 5);

  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Departemen Sistem Informasi", headerX, currentY + 10);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.muted);
  doc.text("Fakultas Teknologi Informasi", headerX, currentY + 15);
  doc.text("Universitas Andalas", headerX, currentY + 19);

  // Right side info
  doc.setFontSize(8);
  doc.setTextColor(COLORS.muted);
  doc.text(`Tanggal: ${formatDateLong()}`, pageWidth - margin, currentY + 8, { align: "right" });

  currentY += 24;

  // Divider
  doc.setDrawColor(COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setDrawColor(COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY + 1.5, pageWidth - margin, currentY + 1.5);

  currentY += 10;

  // ============ TITLE ============
  doc.setTextColor(COLORS.secondary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("LOG BIMBINGAN TUGAS AKHIR", pageWidth / 2, currentY, { align: "center" });

  currentY += 10;

  // ============ STUDENT INFO ============
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLORS.secondary);

  const labelWidth = 35;
  const valueX = margin + labelWidth;

  doc.setFont("helvetica", "bold");
  doc.text("Nama Mahasiswa", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${data.studentName}`, valueX, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("NIM", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${data.studentId}`, valueX, currentY);
  currentY += 5;

  doc.setFont("helvetica", "bold");
  doc.text("Dosen Pembimbing", margin, currentY);
  doc.setFont("helvetica", "normal");
  doc.text(`: ${data.supervisorName}`, valueX, currentY);
  currentY += 5;

  if (data.thesisTitle) {
    doc.setFont("helvetica", "bold");
    doc.text("Judul Tugas Akhir", margin, currentY);
    doc.setFont("helvetica", "normal");
    const titleLines = doc.splitTextToSize(`: ${data.thesisTitle}`, pageWidth - margin - valueX);
    doc.text(titleLines, valueX, currentY);
    currentY += titleLines.length * 4 + 2;
  }

  currentY += 5;

  // ============ TABLE ============
  const tableData = data.guidances.map((g, index) => {
    // Kolom jadwal
    const jadwalParts = [g.approvedDateFormatted || "-"];
    if (g.type) {
      jadwalParts.push(`${g.type}${g.duration ? ` • ${g.duration} menit` : ""}`);
    }
    if (g.milestoneName) {
      jadwalParts.push(g.milestoneName);
    }
    const jadwal = jadwalParts.join("\n");

    // Kolom catatan
    const catatanParts = [];
    if (g.sessionSummary) {
      catatanParts.push(`Ringkasan:\n${g.sessionSummary}`);
    }
    if (g.actionItems) {
      catatanParts.push(`Arahan/Saran:\n${g.actionItems}`);
    }
    const catatan = catatanParts.length > 0 ? catatanParts.join("\n\n") : "-";

    return [(index + 1).toString(), jadwal, catatan];
  });

  autoTable(doc, {
    startY: currentY,
    head: [["No", "Jadwal Bimbingan", "Catatan Bimbingan"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: COLORS.border,
      lineWidth: 0.1,
      valign: "top",
      textColor: COLORS.secondary,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#FFFFFF",
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", valign: "middle" },
      1: { cellWidth: 45 },
      2: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: "#FAFAFA",
    },
    margin: { left: margin, right: margin },
  });

  // ============ SIGNATURE ============
  const finalY = doc.lastAutoTable.finalY + 15;
  const signatureX = pageWidth - margin - 60;

  if (finalY + 50 > pageHeight - 20) {
    doc.addPage();
    // Re-add KOP on new page
    let sigY = 25;
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);
    doc.text(`Padang, ${formatDateLong()}`, signatureX, sigY);
    doc.text("Mengetahui,", signatureX, sigY + 7);
    doc.text("Dosen Pembimbing", signatureX, sigY + 13);
    doc.text("_______________________________", signatureX, sigY + 35);
    doc.setFont("helvetica", "bold");
    doc.text(data.supervisorName, signatureX, sigY + 41);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);
    doc.text(`Padang, ${formatDateLong()}`, signatureX, finalY);
    doc.text("Mengetahui,", signatureX, finalY + 7);
    doc.text("Dosen Pembimbing", signatureX, finalY + 13);
    doc.text("_______________________________", signatureX, finalY + 35);
    doc.setFont("helvetica", "bold");
    doc.text(data.supervisorName, signatureX, finalY + 41);
  }

  // ============ FOOTER ============
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(COLORS.muted);
    doc.setFont("helvetica", "italic");

    doc.setDrawColor(COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.text("Dokumen ini digenerate oleh sistem Neo Central DSI", margin, pageHeight - 8);
    doc.setFont("helvetica", "normal");
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: "right" });
  }

  // ============ SAVE ============
  const filename = `Log_Bimbingan_${data.studentId}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
