import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export const getStudentSeminarDetail = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.BY_ID(seminarId)));
  const result = await response.json();
  return result.data;
};

export const getStudentSeminarAssessment = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ASSESSMENT(seminarId)));
  const result = await response.json();
  return result.data;
};
