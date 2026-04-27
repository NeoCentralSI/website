import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { 
  EligibleExaminer,
  LecturerSeminarExaminer,
  RespondAssignmentPayload,
  RespondAssignmentResponse,
} from '@/types/seminar.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

/**
 * Respond to an examiner assignment (Accept/Reject)
 */
export async function respondExaminerAssignment(
  seminarId: string,
  examinerId: string,
  payload: RespondAssignmentPayload,
): Promise<RespondAssignmentResponse> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.RESPOND_ASSIGNMENT(seminarId, examinerId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(res, 'Gagal mengirim respons');
}

/**
 * Get eligible lecturers for examiner assignment (Kadep)
 */
export async function getEligibleExaminers(
  seminarId: string,
): Promise<EligibleExaminer[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.ELIGIBLE_EXAMINERS(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat daftar dosen');
}

/**
 * Assign examiners to a seminar (Kadep)
 */
export async function assignExaminers(
  seminarId: string,
  examinerIds: string[],
): Promise<LecturerSeminarExaminer[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.EXAMINERS(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examinerIds }),
  });
  return parseJsonResponse(res, 'Gagal menetapkan penguji');
}
