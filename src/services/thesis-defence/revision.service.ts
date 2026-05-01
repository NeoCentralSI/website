import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type {
  CreateDefenceRevisionPayload,
  SaveDefenceRevisionActionPayload,
  StudentDefenceRevisionItem,
  DefenceRevisionBoardItem,
} from '@/types/defence.types';

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

export const getStudentDefenceRevisions = async (
  defenceId: string
): Promise<StudentDefenceRevisionItem[]> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISIONS(defenceId)));
  return parseJsonResponse(response, 'Gagal memuat data revisi sidang');
};

export const createDefenceRevision = async (
  defenceId: string,
  payload: CreateDefenceRevisionPayload
): Promise<StudentDefenceRevisionItem> => {
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISIONS(defenceId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseJsonResponse(response, 'Gagal menambahkan item revisi');
};

export const saveDefenceRevisionAction = async (
  defenceId: string,
  revisionId: string,
  payload: SaveDefenceRevisionActionPayload
): Promise<StudentDefenceRevisionItem> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISION_BY_ID(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, action: 'save_action' }),
    }
  );
  return parseJsonResponse(response, 'Gagal menyimpan perbaikan');
};

export const submitDefenceRevisionAction = async (
  defenceId: string,
  revisionId: string,
  payload: SaveDefenceRevisionActionPayload
): Promise<StudentDefenceRevisionItem> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISION_BY_ID(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ ...payload, action: 'submit' }),
    }
  );
  return parseJsonResponse(response, 'Gagal mensubmit perbaikan');
};

export const submitDefenceRevision = async (
  defenceId: string,
  revisionId: string
): Promise<StudentDefenceRevisionItem> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISION_BY_ID(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ action: 'submit' }),
    }
  );
  return parseJsonResponse(response, 'Gagal mengajukan perbaikan');
};

export const cancelDefenceRevisionSubmit = async (
  defenceId: string,
  revisionId: string
): Promise<StudentDefenceRevisionItem> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISION_BY_ID(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel_submit' }),
    }
  );
  return parseJsonResponse(response, 'Gagal membatalkan pengajuan');
};

export const deleteDefenceRevision = async (
  defenceId: string,
  revisionId: string
): Promise<{ id: string }> => {
  const response = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISION_BY_ID(defenceId, revisionId)),
    {
      method: 'DELETE',
    }
  );
  return parseJsonResponse(response, 'Gagal menghapus item revisi');
};

// ============================================================
// Lecturer — Revision Management
// ============================================================

export async function getDefenceRevisionBoard(
  defenceId: string
): Promise<DefenceRevisionBoardItem[]> {
  const res = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.REVISIONS(defenceId)));
  return parseJsonResponse(res, 'Gagal memuat data revisi sidang');
}

export async function approveDefenceRevision(
  defenceId: string,
  revisionId: string
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.APPROVE_REVISION(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ action: 'approve' }),
    }
  );
  return parseJsonResponse(res, 'Gagal menyetujui revisi sidang');
}

export async function unapproveDefenceRevision(
  defenceId: string,
  revisionId: string
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.UNAPPROVE_REVISION(defenceId, revisionId)),
    {
      method: 'PATCH',
      body: JSON.stringify({ action: 'unapprove' }),
    }
  );
  return parseJsonResponse(res, 'Gagal membatalkan persetujuan revisi sidang');
}

export async function finalizeDefenceRevisions(
  defenceId: string
): Promise<{ defenceId: string; revisionFinalizedAt: string | null; revisionFinalizedBy: string | null }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_DEFENCE.FINALIZE_REVISIONS(defenceId)),
    {
      method: 'POST',
    }
  );
  return parseJsonResponse(res, 'Gagal memfinalisasi revisi sidang');
}
