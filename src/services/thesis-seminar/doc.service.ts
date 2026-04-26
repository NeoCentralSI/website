import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';

export const getSeminarDocumentTypes = async () => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENT_TYPES));
  const result = await response.json();
  return result.data;
};

export const getStudentSeminarDocuments = async (seminarId: string) => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(seminarId)));
  const result = await response.json();
  return result.data;
};

export const uploadSeminarDocument = async (file: File, documentTypeName: string, seminarId?: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);
  
  // Asumsi sementara menggunakan id "active" jika seminarId tidak dipass oleh hook lama
  const targetId = seminarId || 'active'; 
  
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.DOCUMENTS(targetId)), {
    method: 'POST',
    body: formData,
  }, true); // true for form data
  
  const result = await response.json();
  return result.data;
};
