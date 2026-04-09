import { API_CONFIG, getApiUrl } from "@/config/api";
import { apiRequest } from "../auth.service";
import type { 
    OverviewCompanyItem, 
    OverviewReportItem, 
    OverviewStats 
} from "./types";

export const verifyInternshipLetter = async (id: string) => {
    const res = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_PUBLIC.VERIFY_LETTER(id)));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Dokumen tidak valid atau tidak ditemukan." }));
        throw new Error(errorData.message || "Gagal memverifikasi surat");
    }
    return res.json();
};

export const getSeminarDetail = async (seminarId: string): Promise<{ success: boolean; data: any }> => {
    const res = await apiRequest(getApiUrl(`/insternship/activity/seminars/${seminarId}`));
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat detail seminar" }));
        throw new Error(errorData.message || "Gagal memuat detail seminar");
    }
    return res.json();
};

export const getOverviewCompanies = async (params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<{ data: OverviewCompanyItem[]; meta: any }> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.COMPANIES);
    if (params) {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);
        url += `?${queryParams.toString()}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat data perusahaan" }));
        throw new Error(errorData.message || "Gagal memuat data perusahaan");
    }
    return res.json();
};

export const getOverviewReports = async (params?: { page?: number; limit?: number; search?: string; yearId?: string; companyId?: string }): Promise<{ data: OverviewReportItem[]; meta: any }> => {
    let url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.REPORTS);
    if (params) {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.yearId) queryParams.append('yearId', params.yearId);
        if (params.companyId) queryParams.append('companyId', params.companyId);
        url += `?${queryParams.toString()}`;
    }
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat laporan akhir" }));
        throw new Error(errorData.message || "Gagal memuat laporan akhir");
    }
    return res.json();
};

export const getOverviewStats = async (): Promise<{ data: OverviewStats }> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.INTERNSHIP_OVERVIEW.STATS);
    const res = await apiRequest(url);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Gagal memuat statistik" }));
        throw new Error(errorData.message || "Gagal memuat statistik");
    }
    return res.json();
};
