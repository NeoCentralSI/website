import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type { StudentYudisiumOverviewResponse, StudentYudisiumRequirementsResponse } from '@/types/student-yudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM_STUDENT;

export async function getStudentYudisiumOverview(): Promise<StudentYudisiumOverviewResponse> {
  const res = await apiRequest(getApiUrl(EP.OVERVIEW));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data yudisium mahasiswa');
  return json.data;
}

export async function getStudentYudisiumRequirements(): Promise<StudentYudisiumRequirementsResponse> {
  const res = await apiRequest(getApiUrl(EP.REQUIREMENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat persyaratan yudisium');
  return json.data;
}

export async function uploadYudisiumDocument(file: File, requirementId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requirementId', requirementId);

  const res = await apiRequest(getApiUrl(EP.REQUIREMENTS_UPLOAD), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengunggah dokumen');
  return json.data;
}
