import { useQuery } from "@tanstack/react-query";
import * as monitoringService from "@/services/internship/monitoring.service";

export const useMonitoring = (academicYearId?: string) => {
    const statsQuery = useQuery({
        queryKey: ['internship-monitoring-stats', academicYearId],
        queryFn: () => monitoringService.getMonitoringStats(academicYearId),
        enabled: !!academicYearId
    });

    const listQuery = useQuery({
        queryKey: ['internship-monitoring-list', academicYearId],
        queryFn: () => monitoringService.getMonitoringList(academicYearId),
        enabled: !!academicYearId
    });

    return {
        stats: statsQuery.data,
        list: listQuery.data,
        isLoading: statsQuery.isLoading || listQuery.isLoading,
        isError: statsQuery.isError || listQuery.isError,
        refetch: () => {
            statsQuery.refetch();
            listQuery.refetch();
        }
    };
};
