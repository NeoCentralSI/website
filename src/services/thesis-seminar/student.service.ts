import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { SeminarOverviewResponse, AttendanceHistoryResponse, SeminarHistoryItem } from '@/types/seminar.types';

export const studentSeminarService = {
  getOverview: async (): Promise<SeminarOverviewResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.OVERVIEW));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil data overview seminar');
    }
    const result = await response.json();
    return result.data;
  },

  getHistory: async (): Promise<SeminarHistoryItem[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.HISTORY));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil riwayat seminar');
    }
    const result = await response.json();
    return result.data;
  },

  getAttendanceHistory: async (): Promise<AttendanceHistoryResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.ATTENDANCE));
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Gagal mengambil riwayat kehadiran');
    }
    const result = await response.json();
    return result.data;
  },
};
