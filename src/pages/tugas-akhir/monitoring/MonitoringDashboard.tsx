import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import {
  MonitoringSummaryCards,
  StatusDistributionChart,
  RatingDistributionChart,
  TopicDistributionChart,
  BatchDistributionChart,
  ProgressDistributionChart,
  SlowStudentsCard,
  ReadyForSeminarCard,
  ThesesTable,
  GuidanceTrendChart,
} from "@/components/monitoring";
import { useMonitoringDashboard, useFilterOptions } from "@/hooks/monitoring";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, FileDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { monitoringKeys } from "@/hooks/monitoring/useMonitoring";
import { Loading } from "@/components/ui/spinner";
import { downloadProgressReportPdf } from "@/services/monitoring.service";
import { toast } from "sonner";

export default function MonitoringDashboard() {
  const [searchParams] = useSearchParams();
  const initialRating = searchParams.get("rating") || undefined;

  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const queryClient = useQueryClient();

  // Pass academicYear filter to hooks
  const academicYearFilter = selectedAcademicYear === "all" ? undefined : selectedAcademicYear;
  const { data, isLoading, isFetching, refetch } = useMonitoringDashboard(academicYearFilter);
  const { data: filterOptions } = useFilterOptions();
  const { setBreadcrumbs } = useOutletContext<LayoutContext>();


  useEffect(() => {
    setBreadcrumbs([
      { label: "Tugas Akhir" },
      { label: "Monitoring" },
    ]);
  }, [setBreadcrumbs]);

  // Check if any operation is in progress
  const isLoadingAny = isLoading || isFetching || isSyncing;

  const handleRefresh = async () => {
    setIsSyncing(true);
    try {
      // Invalidate and refetch all monitoring data
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: monitoringKeys.all }),
      ]);
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
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunduh laporan");
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const displayAcademicYear =
    selectedAcademicYear === "all"
      ? "Semua Semester"
      : filterOptions?.academicYears?.find((ay) => ay.value === selectedAcademicYear)?.label || "";

  // Full blank loading on browser reload (no cached data)
  if (isLoading && !data) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat data monitoring..." />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-6 space-y-6">
      {/* Header with Academic Year Filter and Reload */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger className="w-50">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Semester</SelectItem>
              {filterOptions?.academicYears?.map((ay) => (
                <SelectItem key={ay.value} value={ay.value}>
                  {ay.label} {ay.isActive && "(Aktif)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            Menampilkan: <span className="font-medium text-foreground">{displayAcademicYear}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingAny}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAny ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF || isLoadingAny}
          >
            {isDownloadingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            {isDownloadingPDF ? "Mengunduh..." : "Download Laporan"}
          </Button>
        </div>
      </div>


      {/* Summary Cards */}
      <MonitoringSummaryCards summary={data?.summary} isLoading={isLoadingAny} />

      {/* Distribution Charts */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <StatusDistributionChart
          statusDistribution={data?.statusDistribution}
          isLoading={isLoadingAny}
        />
        <RatingDistributionChart
          ratingDistribution={data?.ratingDistribution}
          isLoading={isLoadingAny}
        />
        <ProgressDistributionChart
          progressDistribution={data?.progressDistribution}
          isLoading={isLoadingAny}
        />
        <TopicDistributionChart
          topicDistribution={data?.topicDistribution}
          isLoading={isLoadingAny}
        />
        <BatchDistributionChart
          batchDistribution={data?.batchDistribution}
          isLoading={isLoadingAny}
        />
        <GuidanceTrendChart
          guidanceTrend={data?.guidanceTrend}
          isLoading={isLoadingAny}
        />
      </div>

      {/* Quick Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        <SlowStudentsCard
          slowStudents={data?.slowStudents}
          atRiskStudents={data?.atRiskStudents}
          isLoading={isLoadingAny}
        />
        <ReadyForSeminarCard
          students={data?.readyForSeminar}
          isLoading={isLoadingAny}
        />
      </div>

      {/* Full Table */}
      <ThesesTable isSyncing={isSyncing} academicYear={academicYearFilter} initialRating={initialRating} />
    </div>
  );
}
