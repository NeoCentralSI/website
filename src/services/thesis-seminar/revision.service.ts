import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import type { CreateRevisionPayload, SubmitRevisionActionPayload, SaveRevisionActionPayload } from '@/types/seminar.types';

// Asumsi sementara menggunakan id "active" jika seminarId tidak dipass oleh hook lama
export const getStudentRevisions = async (seminarId?: string) => {
  const targetId = seminarId || 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISIONS(targetId)));
  const result = await response.json();
  return result.data;
};

export const createRevision = async (payload: CreateRevisionPayload) => {
  const targetId = payload.seminarId || 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISIONS(targetId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  return result.data;
};

export const saveRevisionAction = async (revisionId: string, payload: SaveRevisionActionPayload) => {
  // Asumsi target seminarId = active. Nanti di-refactor jika perlu
  const targetId = 'active'; 
  const actionPayload = { ...payload, action: 'save_action' };
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify(actionPayload),
  });
  const result = await response.json();
  return result.data;
};

export const submitRevisionAction = async (revisionId: string, payload: SubmitRevisionActionPayload) => {
  const targetId = 'active';
  const actionPayload = { ...payload, action: 'submit' };
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify(actionPayload),
  });
  const result = await response.json();
  return result.data;
};

export const submitRevision = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify({ action: 'submit' }),
  });
  const result = await response.json();
  return result.data;
};

export const cancelRevisionSubmission = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'PATCH',
    body: JSON.stringify({ action: 'cancel_submit' }),
  });
  const result = await response.json();
  return result.data;
};

export const deleteRevision = async (revisionId: string) => {
  const targetId = 'active';
  const response = await apiRequest(getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR.REVISION_BY_ID(targetId, revisionId)), {
    method: 'DELETE',
  });
  const result = await response.json();
  return result.data;
};
