import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type { StudentYudisiumOverviewResponse } from '@/types/studentYudisium.types';

const EP = API_CONFIG.ENDPOINTS.YUDISIUM_STUDENT;

export async function getStudentYudisiumOverview(): Promise<StudentYudisiumOverviewResponse> {
  const res = await apiRequest(getApiUrl(EP.OVERVIEW));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data yudisium mahasiswa');
  return json.data;
}
