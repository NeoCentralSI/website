import { useQuery } from "@tanstack/react-query";
import {
  getMonitoringDashboard,
  getThesesList,
  getFilterOptions,
  getAtRiskStudents,
  getStudentsReadyForSeminar,
  type ThesesFilters,
  type MonitoringDashboard,
  type ThesesListResponse,
  type FilterOptions,
  type AtRiskStudent,
  type ReadyForSeminarStudent,
} from "@/services/monitoring.service";

// Query keys
export const monitoringKeys = {
  all: ["monitoring"] as const,
  dashboard: (academicYear?: string) => [...monitoringKeys.all, "dashboard", academicYear] as const,
  theses: (filters: ThesesFilters) => [...monitoringKeys.all, "theses", filters] as const,
  filters: () => [...monitoringKeys.all, "filters"] as const,
  atRisk: (academicYear?: string) => [...monitoringKeys.all, "at-risk", academicYear] as const,
  readySeminar: (academicYear?: string) => [...monitoringKeys.all, "ready-seminar", academicYear] as const,
};

/**
 * Hook to fetch monitoring dashboard data
 */
export function useMonitoringDashboard(academicYear?: string) {
  return useQuery<MonitoringDashboard, Error>({
    queryKey: monitoringKeys.dashboard(academicYear),
    queryFn: () => getMonitoringDashboard(academicYear),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch theses list with filters
 */
export function useThesesList(filters: ThesesFilters = {}) {
  return useQuery<ThesesListResponse, Error>({
    queryKey: monitoringKeys.theses(filters),
    queryFn: () => getThesesList(filters),
    staleTime: 1 * 60 * 1000, // 1 minute
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
}

/**
 * Hook to fetch filter options
 */
export function useFilterOptions() {
  return useQuery<FilterOptions, Error>({
    queryKey: monitoringKeys.filters(),
    queryFn: getFilterOptions,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch at-risk students
 */
export function useAtRiskStudents(academicYear?: string) {
  return useQuery<AtRiskStudent[], Error>({
    queryKey: monitoringKeys.atRisk(academicYear),
    queryFn: () => getAtRiskStudents(academicYear),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Hook to fetch students ready for seminar
 */
export function useStudentsReadyForSeminar(academicYear?: string) {
  return useQuery<ReadyForSeminarStudent[], Error>({
    queryKey: monitoringKeys.readySeminar(academicYear),
    queryFn: () => getStudentsReadyForSeminar(academicYear),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
