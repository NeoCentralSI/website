import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  DefenceOverviewResponse,
  StudentDefenceHistoryItem,
} from '@/types/defence.types';

export const studentDefenceService = {
  getOverview: async (): Promise<DefenceOverviewResponse> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ME_OVERVIEW));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil data overview sidang');
    }
    return result.data;
  },

  getHistory: async (): Promise<StudentDefenceHistoryItem[]> => {
    const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ME_HISTORY));
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengambil riwayat sidang');
    }
    return result.data;
  },
};

export const getStudentDefenceOverview = studentDefenceService.getOverview;
export const getStudentDefenceHistory = studentDefenceService.getHistory;
