import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import type { LayoutContext } from "@/components/layout/ProtectedLayout";
import {
  MonitoringSummaryCards,
  StatusDistributionCard,
  AtRiskStudentsCard,
  ReadyForSeminarCard,
  ThesesTable,
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
import { RefreshCw, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { monitoringKeys } from "@/hooks/monitoring/useMonitoring";

export default function MonitoringDashboard() {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all");
  const [isSyncing, setIsSyncing] = useState(false);
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

  const activeAcademicYear = filterOptions?.academicYears?.find((ay) => ay.isActive);
  const displayAcademicYear =
    selectedAcademicYear === "all"
      ? activeAcademicYear?.label || "Ganji 2025"
      : filterOptions?.academicYears?.find((ay) => ay.value === selectedAcademicYear)?.label || "";

  return (
    <div className="flex flex-1 flex-col p-6 space-y-6">
      {/* Header with Academic Year Filter and Reload */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pilih Tahun Ajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
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
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingAny}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAny ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      {/* Summary Cards */}
      <MonitoringSummaryCards summary={data?.summary} isLoading={isLoadingAny} />

      {/* Status Distribution + Quick Lists */}
      <div className="grid gap-6 lg:grid-cols-3">
        <StatusDistributionCard
          statusDistribution={data?.statusDistribution}
          isLoading={isLoadingAny}
        />
        <AtRiskStudentsCard
          students={data?.atRiskStudents}
          isLoading={isLoadingAny}
        />
        <ReadyForSeminarCard
          students={data?.readyForSeminar}
          isLoading={isLoadingAny}
        />
      </div>

      {/* Full Table */}
      <ThesesTable isSyncing={isSyncing} />
    </div>
  );
}
