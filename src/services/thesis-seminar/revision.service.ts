import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { 
  CreateRevisionPayload, 
  SubmitRevisionActionPayload, 
  SaveRevisionActionPayload,
  SeminarRevisionBoardItem
} from '@/types/seminar.types';

async function parseJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }
  return result.data as T;
}

// ============================================================
// Student — Revision Management
// ============================================================

export const getStudentRevisions = async (seminarId?: string) => {
  const targetId = seminarId || 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISIONS(targetId)));
  return parseJsonResponse(response, 'Gagal memuat data revisi');
};

export const createRevision = async (payload: CreateRevisionPayload) => {
  const targetId = payload.seminarId || 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISIONS(targetId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Gagal menambahkan item revisi');
};

export const saveRevisionAction = async (revisionId: string, payload: SaveRevisionActionPayload) => {
  const targetId = 'active'; 
  const actionPayload = { ...payload, action: 'save_action' };
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify(actionPayload),
  });
  return parseJsonResponse(response, 'Gagal menyimpan perbaikan');
};

export const submitRevisionAction = async (revisionId: string, payload: SubmitRevisionActionPayload) => {
  const targetId = 'active';
  const actionPayload = { ...payload, action: 'submit' };
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify(actionPayload),
  });
  return parseJsonResponse(response, 'Gagal mensubmit perbaikan');
};

export const submitRevision = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify({ action: 'submit' }),
  });
  return parseJsonResponse(response, 'Gagal mengajukan perbaikan');
};

export const cancelRevisionSubmission = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify({ action: 'cancel_submit' }),
  });
  return parseJsonResponse(response, 'Gagal membatalkan pengajuan');
};

export const deleteRevision = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'DELETE',
  });
  return parseJsonResponse(response, 'Gagal menghapus item revisi');
};

// ============================================================
// Lecturer — Revision Management
// ============================================================

export async function getSeminarRevisionBoard(
  seminarId: string,
): Promise<SeminarRevisionBoardItem[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISIONS(seminarId)));
  return parseJsonResponse(res, 'Gagal memuat data revisi');
}

export async function approveRevision(
  seminarId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.APPROVE_REVISION(seminarId, revisionId)), {
    method: 'PUT',
  });
  return parseJsonResponse(res, 'Gagal menyetujui revisi');
}

export async function unapproveRevision(
  seminarId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.UNAPPROVE_REVISION(seminarId, revisionId)), {
    method: 'PUT',
  });
  return parseJsonResponse(res, 'Gagal membatalkan persetujuan revisi');
}

export async function finalizeSeminarRevisions(
  seminarId: string,
): Promise<{ seminarId: string; revisionFinalizedAt: string | null; revisionFinalizedBy: string | null }> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.FINALIZE_REVISIONS(seminarId)), {
    method: 'POST',
  });
  return parseJsonResponse(res, 'Gagal memfinalisasi revisi seminar');
}
