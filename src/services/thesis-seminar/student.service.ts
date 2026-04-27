import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { SeminarOverviewResponse, AttendanceHistoryResponse, SeminarHistoryItem } from '@/types/seminar.types';

export const studentSeminarService = {
  getOverview: async (): Promise<SeminarOverviewResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_OVERVIEW));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil data overview seminar');
    }
    return result.data;
  },

  getHistory: async (): Promise<SeminarHistoryItem[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_HISTORY));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil riwayat seminar');
    }
    return result.data;
  },

  getAttendanceHistory: async (): Promise<AttendanceHistoryResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_ATTENDANCE));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil riwayat kehadiran');
    }
    return result.data;
  },

  getAnnouncements: async (): Promise<any[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ANNOUNCEMENTS));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil pengumuman seminar');
    }
    return result.data;
  },
};

// Also export these directly as they are used directly by the old hooks structure
export const getStudentSeminarOverview = studentSeminarService.getOverview;
export const getStudentSeminarHistory = studentSeminarService.getHistory;
export const getStudentAttendanceHistory = studentSeminarService.getAttendanceHistory;
export const getSeminarAnnouncements = studentSeminarService.getAnnouncements;

