import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { ProgressReportData } from "@/services/monitoring.service";

// Extend jsPDF type for autoTable
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: {
      finalY: number;
    };
  }
}

// Brand colors
const COLORS = {
  primary: "#F7931E",
  secondary: "#111827",
  muted: "#6b7280",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#dc2626",
  border: "#e5e7eb",
};

// Rating color mapping
const RATING_COLORS: Record<string, string> = {
  ONGOING: COLORS.success,
  SLOW: COLORS.warning,
  AT_RISK: COLORS.danger,
  FAILED: COLORS.danger,
};

// Rating labels
const RATING_LABELS: Record<string, string> = {
  ONGOING: "Ongoing",
  SLOW: "Lambat",
  AT_RISK: "Berisiko",
  FAILED: "Gagal",
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

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateProgressReportPDF(data: ProgressReportData): Promise<void> {
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
  doc.text(`Tanggal: ${formatDateLong(data.generatedAt)}`, pageWidth - margin, currentY + 8, { align: "right" });
  doc.text(`Semester: ${data.academicYear}`, pageWidth - margin, currentY + 13, { align: "right" });

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
  doc.text("LAPORAN PROGRESS PENGERJAAN TUGAS AKHIR MAHASISWA", pageWidth / 2, currentY, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode Semester ${data.academicYear}`, pageWidth / 2, currentY + 5, { align: "center" });

  currentY += 12;

  // ============ TABLE ============
  // Build table data with pembimbing in one column (newline with dash if 2)
  const tableData = data.theses.map((thesis) => {
    // Format pembimbing: "- Pembimbing1\n- Pembimbing2" or just "- Pembimbing1"
    let pembimbingText = `- ${thesis.pembimbing1}`;
    if (thesis.pembimbing2) {
      pembimbingText += `\n- ${thesis.pembimbing2}`;
    }

    return [
      thesis.no.toString(),
      thesis.nim,
      thesis.name,
      pembimbingText,
      RATING_LABELS[thesis.rating] || thesis.rating,
      thesis.guidanceCompleted.toString(),
      `${thesis.progressPercent}%`,
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      [
        "No",
        "NIM",
        "Nama Mahasiswa",
        "Pembimbing",
        "Rating",
        "Jml. Bimbingan",
        "Progress Milestone",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: COLORS.border,
      lineWidth: 0.1,
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: "#FFFFFF",
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, // No
      1: { cellWidth: 25 }, // NIM
      2: { cellWidth: 38 }, // Nama
      3: { cellWidth: 45 }, // Pembimbing
      4: { cellWidth: 18, halign: "center" }, // Rating
      5: { cellWidth: 22, halign: "center" }, // Jml Bimbingan
      6: { cellWidth: 25, halign: "center" }, // Progress
    },
    didParseCell: (hookData) => {
      // Color rating column (index 4)
      if (hookData.section === "body" && hookData.column.index === 4) {
        const rating = data.theses[hookData.row.index]?.rating;
        if (rating) {
          hookData.cell.styles.textColor = RATING_COLORS[rating] || COLORS.secondary;
          hookData.cell.styles.fontStyle = "bold";
        }
      }
      // Color progress column (index 6)
      if (hookData.section === "body" && hookData.column.index === 6) {
        const progress = data.theses[hookData.row.index]?.progressPercent || 0;
        if (progress >= 80) {
          hookData.cell.styles.textColor = COLORS.success;
        } else if (progress >= 50) {
          hookData.cell.styles.textColor = COLORS.warning;
        } else {
          hookData.cell.styles.textColor = COLORS.danger;
        }
        hookData.cell.styles.fontStyle = "bold";
      }
    },
    margin: { left: margin, right: margin },
  });

  // ============ SIGNATURE ============
  const finalY = doc.lastAutoTable.finalY + 15;
  const signatureX = pageWidth - margin - 60;

  if (finalY + 40 > pageHeight - 15) {
    doc.addPage();
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);
    doc.text(`Padang, ${formatDateLong(data.generatedAt)}`, signatureX, 25);
    doc.text("Mengetahui,", signatureX, 32);
    doc.text("Kepala Departemen Sistem Informasi", signatureX, 38);
    doc.text("_______________________________", signatureX, 60);
    doc.text("NIP. .............................", signatureX, 66);
  } else {
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);
    doc.text(`Padang, ${formatDateLong(data.generatedAt)}`, signatureX, finalY);
    doc.text("Mengetahui,", signatureX, finalY + 7);
    doc.text("Kepala Departemen Sistem Informasi", signatureX, finalY + 13);
    doc.text("_______________________________", signatureX, finalY + 35);
    doc.text("NIP. .............................", signatureX, finalY + 41);
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
  const filename = `Laporan_Progress_TA_${data.academicYear.replace(/\s+/g, "_")}_${formatDate(data.generatedAt).replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
}
