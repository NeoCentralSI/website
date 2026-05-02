import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  EligibleDefenceExaminer,
  LecturerDefenceExaminer,
  RespondDefenceAssignmentPayload,
  RespondDefenceAssignmentResponse,
} from '@/types/defence.types';

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
export async function respondDefenceExaminerAssignment(
  defenceId: string,
  examinerId: string,
  payload: RespondDefenceAssignmentPayload,
): Promise<RespondDefenceAssignmentResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.RESPOND_ASSIGNMENT(defenceId, examinerId)),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  return parseJsonResponse(res, 'Gagal mengirim respons');
}

/**
 * Get eligible lecturers for examiner assignment (Kadep)
 */
export async function getDefenceEligibleExaminers(
  defenceId: string,
): Promise<EligibleDefenceExaminer[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.ELIGIBLE_EXAMINERS(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat daftar dosen');
}

/**
 * Assign examiners to a defence (Kadep)
 */
export async function assignDefenceExaminers(
  defenceId: string,
  examinerIds: string[],
): Promise<LecturerDefenceExaminer[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.EXAMINERS(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examinerIds }),
  });
  return parseJsonResponse(res, 'Gagal menetapkan penguji');
}
