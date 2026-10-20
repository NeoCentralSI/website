import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import { GuidanceMonitoringTab, ThesisEventMonitoringTab } from "@/components/monitoring";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeading } from "@/components/shared/PageHeading";
import { LocalTabsNav } from "@/components/ui/tabs-nav";
import { ALL_SEMESTERS, monitoringKeys, useMonitoringSemester } from "@/hooks/monitoring";
import { downloadProgressReportPdf } from "@/services/monitoring.service";

type MonitoringTab = "bimbingan" | "seminar" | "sidang";

const DEFAULT_TAB: MonitoringTab = "bimbingan";
const TABS: { value: MonitoringTab; label: string }[] = [
  { value: "bimbingan", label: "Bimbingan" },
  { value: "seminar", label: "Seminar Hasil" },
  { value: "sidang", label: "Sidang" },
];

/** Shown only when another semester than the running one is chosen: what still reflects today. */
const NOW_NOTE: Record<MonitoringTab, string> = {
  bimbingan: "Indikator aktivitas dan evaluasi menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
  seminar: "Siap Mendaftar dan Perlu Perhatian menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
  sidang: "Siap Mendaftar dan Perlu Perhatian menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
};

/**
 * Tugas Akhir > Monitoring: three tabs (Bimbingan, Seminar Hasil, Sidang) for one semester. The
 * semester select (`?semester=`, shared by the tabs) sits in the toolbar of each tab's table, as
 * on every page; the report download is in the Bimbingan toolbar, the only tab it covers. Muat
 * Ulang of the Bimbingan table reloads the whole tab (charts too).
 */
export default function MonitoringDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialActivity = searchParams.get("activity") || undefined;
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.find((tab) => tab.value === requestedTab)?.value ?? DEFAULT_TAB;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const queryClient = useQueryClient();

  // Semester filter (`?semester=`), shared by the three tabs; the running semester by default.
  const semester = useMonitoringSemester();
  const academicYearFilter = semester.academicYear;
  const isFetchingAny = useIsFetching({ queryKey: monitoringKeys.all }) > 0;
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tugas Akhir" },
      { label: "Monitoring" },
    ]);
    setTitle("Monitoring Tugas Akhir");
  }, [setBreadcrumbs, setTitle]);

  const isLoadingAny = isFetchingAny || isSyncing;

  const handleTabChange = (tab: string) => {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous);
      if (tab === DEFAULT_TAB) params.delete("tab");
      else params.set("tab", tab);
      return params;
    }, { replace: true });
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      // Every monitoring query; the ones on screen are fetched again right away
      await queryClient.invalidateQueries({ queryKey: monitoringKeys.all });
    } catch (error) {
      console.error('[Monitoring] Refresh failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      const options = {
        academicYearId: academicYearFilter,
      };

      const blob = await downloadProgressReportPdf(options);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Monitoring_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Laporan berhasil diunduh");
    } catch (error) {
      toast.error((error as Error)?.message || "Gagal mengunduh laporan");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const nowNote = NOW_NOTE[activeTab];
  const semesterSelect = (
    // "" keeps the select controlled while the default semester is being resolved.
    <Select value={semester.value ?? ""} onValueChange={semester.setSemester}>
      {/* Wide enough for "Ganjil 2026/2027 (Berjalan)", so no choice is clamped or shifted. */}
      <SelectTrigger className="w-64 text-left" aria-label="Semester">
        <SelectValue placeholder="Pilih semester" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_SEMESTERS}>Semua Semester</SelectItem>
        {semester.semesters.map((ay) => (
          <SelectItem key={ay.value} value={ay.value}>
            {`${ay.label.trim()}${ay.isActive ? " (Berjalan)" : ""}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  const downloadButton = (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={handleDownloadPDF}
      disabled={isDownloadingPDF || isLoadingAny || !semester.isReady}
    >
      {isDownloadingPDF ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isDownloadingPDF ? "Mengunduh..." : "Download Laporan"}
    </Button>
  );

  return (
    <div className="p-6 space-y-6">
      <PageHeading title="Monitoring Tugas Akhir" subtitle="Pantau bimbingan, seminar hasil, dan sidang tugas akhir per semester" />

      <LocalTabsNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />
      {semester.isPastOrOtherSemester && <p className="text-sm text-amber-700">{nowNote}</p>}

      {activeTab === "bimbingan" && (
        <GuidanceMonitoringTab
          academicYear={academicYearFilter}
          enabled={semester.isReady}
          isSyncing={isSyncing}
          initialActivity={initialActivity}
          semesterSelect={semesterSelect}
          extraActions={downloadButton}
          onRefresh={() => void handleRefresh()}
        />
      )}
      {activeTab === "seminar" && (
        <ThesisEventMonitoringTab kind="seminar" academicYear={academicYearFilter} enabled={semester.isReady} semesterSelect={semesterSelect} />
      )}
      {activeTab === "sidang" && (
        <ThesisEventMonitoringTab kind="defence" academicYear={academicYearFilter} enabled={semester.isReady} semesterSelect={semesterSelect} />
      )}
    </div>
  );
}
