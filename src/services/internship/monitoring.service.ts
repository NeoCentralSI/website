import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";

export interface MonitoringStats {
    summary: {
        totalOngoing: number;
        waitingVerification: number;
        overdue: number;
        completed: number;
    };
    distribution: {
        name: string;
        value: number;
    }[];
}

export interface MonitoringStudent {
    id: string;
    name: string;
    nim: string;
    supervisor: string;
    endDate: string;
    daysPast: number;
    status: 'Aman' | 'Peringatan' | 'Terlambat';
    progress: {
        field: boolean;
        lecturer: boolean;
        seminar: boolean;
        report: boolean;
    };
}

export const getMonitoringStats = async (academicYearId?: string): Promise<MonitoringStats> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.MONITORING_STATS);
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYearId=${academicYearId}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat statistik monitoring" }));
        throw new Error(errorData.message || "Gagal memuat statistik monitoring");
    }
    const json = await res.json();
    return json.data;
};

export const getMonitoringList = async (academicYearId?: string): Promise<MonitoringStudent[]> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_SEKDEP.MONITORING_LIST);
    if (academicYearId && academicYearId !== 'all') {
        url += `?academicYearId=${academicYearId}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat daftar monitoring" }));
        throw new Error(errorData.message || "Gagal memuat daftar monitoring");
    }
    const json = await res.json();
    return json.data;
};
