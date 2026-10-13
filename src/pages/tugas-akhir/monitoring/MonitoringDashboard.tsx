import { useEffect, useId, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Calendar, FileDown, Loader2 } from "lucide-react";
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
import { LocalTabsNav } from "@/components/ui/tabs-nav";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_SEMESTERS, monitoringKeys, useMonitoringSemester } from "@/hooks/monitoring";
import { downloadProgressReportPdf } from "@/services/monitoring.service";

type MonitoringTab = "bimbingan" | "seminar" | "sidang";

const DEFAULT_TAB: MonitoringTab = "bimbingan";
const TABS: { value: MonitoringTab; label: string }[] = [
  { value: "bimbingan", label: "Bimbingan" },
  { value: "seminar", label: "Seminar Hasil" },
  { value: "sidang", label: "Sidang" },
];

/** What the Semester filter means on each tab, for one semester and for every semester. */
const SCOPE_TEXT: Record<MonitoringTab, { semester: string; all: string; now: string }> = {
  bimbingan: {
    semester: "Menampilkan tugas akhir yang berjalan pada semester ini.",
    all: "Menampilkan tugas akhir dari semua semester.",
    now: "Indikator aktivitas dan evaluasi menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
  },
  seminar: {
    semester: "Menampilkan seminar hasil yang tanggalnya jatuh pada semester ini.",
    all: "Menampilkan seminar hasil dari semua semester.",
    now: "Siap Mendaftar dan Perlu Perhatian menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
  },
  sidang: {
    semester: "Menampilkan sidang yang tanggalnya jatuh pada semester ini.",
    all: "Menampilkan sidang dari semua semester.",
    now: "Siap Mendaftar dan Perlu Perhatian menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.",
  },
};

const REPORT_ONLY_GUIDANCE = "Laporan hanya memuat data bimbingan. Buka tab Bimbingan untuk mengunduhnya.";

export default function MonitoringDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialActivity = searchParams.get("activity") || undefined;
  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.find((tab) => tab.value === requestedTab)?.value ?? DEFAULT_TAB;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const queryClient = useQueryClient();
  const semesterFieldId = useId();

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

  const scope = SCOPE_TEXT[activeTab];
  const isReportTab = activeTab === "bimbingan";
  const downloadButton = (
    <Button
      variant="outline"
      className="flex items-center gap-2"
      onClick={handleDownloadPDF}
      disabled={!isReportTab || isDownloadingPDF || isLoadingAny || !semester.isReady}
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
      <div>
        <h1 className="text-2xl font-bold">Monitoring Tugas Akhir</h1>
        <p className="text-muted-foreground">Pantau bimbingan, seminar hasil, dan sidang tugas akhir per semester</p>
      </div>

      {/* Semester filter, reload and report */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={semesterFieldId} className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Semester
            </label>
            {/* "" keeps the select controlled while the default semester is being resolved */}
            <Select value={semester.value ?? ""} onValueChange={semester.setSemester}>
              <SelectTrigger id={semesterFieldId} className="w-56">
                <SelectValue placeholder="Pilih semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SEMESTERS}>Semua Semester</SelectItem>
                {semester.semesters.map((ay) => (
                  <SelectItem key={ay.value} value={ay.value}>
                    {ay.label.trim()}{ay.isActive ? " (Berjalan)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">{semester.isAll ? scope.all : scope.semester}</p>
          {semester.isPastOrOtherSemester && <p className="text-sm text-amber-700">{scope.now}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingAny}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAny ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {isReportTab ? downloadButton : (
            <Tooltip>
              <TooltipTrigger asChild>
                {/* A disabled button gets no pointer events; the wrapper carries the reason. */}
                <span tabIndex={0} title={REPORT_ONLY_GUIDANCE}>{downloadButton}</span>
              </TooltipTrigger>
              <TooltipContent>{REPORT_ONLY_GUIDANCE}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <LocalTabsNav tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

      {activeTab === "bimbingan" && (
        <GuidanceMonitoringTab
          academicYear={academicYearFilter}
          enabled={semester.isReady}
          isSyncing={isSyncing}
          initialActivity={initialActivity}
        />
      )}
      {activeTab === "seminar" && (
        <ThesisEventMonitoringTab kind="seminar" academicYear={academicYearFilter} enabled={semester.isReady} />
      )}
      {activeTab === "sidang" && (
        <ThesisEventMonitoringTab kind="defence" academicYear={academicYearFilter} enabled={semester.isReady} />
      )}
    </div>
  );
}
