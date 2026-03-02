import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type { SeminarOverviewResponse, AttendanceHistoryResponse } from '@/types/seminar.types';

/**
 * Get student seminar overview (checklist, status, documents)
 */
export async function getStudentSeminarOverview(): Promise<SeminarOverviewResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.OVERVIEW)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar');
  return json.data;
}

/**
 * Get student seminar attendance history
 */
export async function getStudentAttendanceHistory(): Promise<AttendanceHistoryResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.ATTENDANCE)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat kehadiran');
  return json.data;
}
