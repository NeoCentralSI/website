import { useEffect, useId, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import {
  MonitoringSummaryCards,
  StatusDistributionChart,
  ActivityDistributionChart,
  TopicDistributionChart,
  BatchDistributionChart,
  ProgressDistributionChart,
  SlowStudentsCard,
  EvaluationDueCard,
  ReadyForSeminarCard,
  SupervisorLoadCard,
  ThesesTable,
  GuidanceTrendChart,
} from "@/components/monitoring";
import { ALL_SEMESTERS, useMonitoringDashboard, useMonitoringSemester } from "@/hooks/monitoring";
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
  const initialActivity = searchParams.get("activity") || undefined;

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const queryClient = useQueryClient();
  const semesterFieldId = useId();

  // Semester filter (`?semester=`): theses that run in the semester; the running one by default.
  const semester = useMonitoringSemester();
  const academicYearFilter = semester.academicYear;
  const { data, isLoading, isFetching, refetch } = useMonitoringDashboard(academicYearFilter, { enabled: semester.isReady });
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

  useEffect(() => {
    setBreadcrumbs([
      { label: "Tugas Akhir" },
      { label: "Monitoring" },
    ]);
    setTitle("Monitoring Tugas Akhir");
  }, [setBreadcrumbs, setTitle]);

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

  // Full blank loading on browser reload (no cached data), and while the default semester is resolved
  if (!semester.isReady || (isLoading && !data)) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat data monitoring..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Monitoring Tugas Akhir</h1>
        <p className="text-muted-foreground">Pantau progres, bimbingan, dan kesiapan mahasiswa tugas akhir</p>
      </div>

      {/* Semester filter and reload */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor={semesterFieldId} className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Semester
            </label>
            <Select value={semester.value} onValueChange={semester.setSemester}>
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
          <p className="text-sm text-muted-foreground">
            {semester.isAll
              ? "Menampilkan tugas akhir dari semua semester."
              : "Menampilkan tugas akhir yang berjalan pada semester ini."}
          </p>
          {semester.isPastOrOtherSemester && (
            <p className="text-sm text-amber-700">
              Indikator aktivitas dan evaluasi menunjukkan kondisi saat ini, bukan kondisi pada semester tersebut.
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <ActivityDistributionChart
          activityDistribution={data?.activityDistribution}
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

      {/* Quick lists: two columns on a wide screen, one on a narrow one */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <EvaluationDueCard students={data?.evaluationDueStudents} isLoading={isLoadingAny} />
        <SlowStudentsCard
          slowStudents={data?.slowStudents}
          atRiskStudents={data?.atRiskStudents}
          isLoading={isLoadingAny}
        />
        <SupervisorLoadCard
          loads={data?.supervisorLoads}
          isLoading={isLoadingAny}
        />
        <ReadyForSeminarCard
          students={data?.readyForSeminar}
          isLoading={isLoadingAny}
        />
      </div>

      {/* Full Table */}
      <ThesesTable isSyncing={isSyncing} academicYear={academicYearFilter} initialActivity={initialActivity} />
    </div>
  );
}
