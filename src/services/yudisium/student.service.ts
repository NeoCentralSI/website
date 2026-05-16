import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  StudentYudisiumOverviewResponse,
  StudentYudisiumRequirementsResponse,
} from '@/types/student-yudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM;

export async function getStudentYudisiumOverview(): Promise<StudentYudisiumOverviewResponse> {
  const res = await apiRequest(getApiUrl(EP.ME_OVERVIEW));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data yudisium mahasiswa');
  return json.data;
}

export async function getStudentYudisiumRequirements(): Promise<StudentYudisiumRequirementsResponse> {
  const res = await apiRequest(getApiUrl(EP.ME_REQUIREMENTS));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat persyaratan yudisium');
  return json.data;
}

export async function uploadYudisiumDocument(file: File, requirementId: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('requirementId', requirementId);

  const res = await apiRequest(getApiUrl(EP.ME_REQUIREMENTS_UPLOAD), {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengunggah dokumen');
  return json.data;
}

export async function downloadStudentCplReport(): Promise<Blob> {
  const res = await apiRequest(getApiUrl(EP.ME_CPL_REPORT));
  if (!res.ok) throw new Error('Gagal mengunduh sertifikat CPL');
  return res.blob();
}
