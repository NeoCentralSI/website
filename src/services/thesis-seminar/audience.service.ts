import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export const registerToSeminar = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCES(seminarId)), {
    method: 'POST',
  });
  const result = await response.json();
  return result.data;
};

export const cancelSeminarRegistration = async (seminarId: string) => {
  // Uses 'me' or 'self' if the backend supports omitting the studentId for self-cancellation
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.AUDIENCE_BY_ID(seminarId, 'me')), {
    method: 'DELETE',
  });
  const result = await response.json();
  return result.data;
};
