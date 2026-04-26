import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { SeminarOverviewResponse, AttendanceHistoryResponse, SeminarHistoryItem } from '@/types/seminar.types';

export const studentSeminarService = {
  getOverview: async (): Promise<SeminarOverviewResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_OVERVIEW));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil data overview seminar');
    }
    const result = await response.json();
    return result;
  },

  getHistory: async (): Promise<SeminarHistoryItem[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_HISTORY));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil riwayat seminar');
    }
    const result = await response.json();
    return result;
  },

  getAttendanceHistory: async (): Promise<AttendanceHistoryResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ME_ATTENDANCE));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil riwayat kehadiran');
    }
    const result = await response.json();
    return result;
  },

  getAnnouncements: async (): Promise<any[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ANNOUNCEMENTS));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil pengumuman seminar');
    }
    const result = await response.json();
    return result;
  },
};

// Also export these directly as they are used directly by the old hooks structure
export const getStudentSeminarOverview = studentSeminarService.getOverview;
export const getStudentSeminarHistory = studentSeminarService.getHistory;
export const getStudentAttendanceHistory = studentSeminarService.getAttendanceHistory;
export const getSeminarAnnouncements = studentSeminarService.getAnnouncements;

