import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  ExitSurveyForm,
  ExitSurveyQuestion,
  CreateExitSurveyFormPayload,
  UpdateExitSurveyFormPayload,
  CreateExitSurveyQuestionPayload,
  UpdateExitSurveyQuestionPayload,
} from '@/types/exitSurvey.types';

const E = API_CONFIG.ENDPOINTS.EXIT_SURVEY;

async function handleResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || errorMessage);
  }
  const result = await response.json();
  return result.data as T;
}

export const getExitSurveyForms = async (): Promise<ExitSurveyForm[]> => {
  const response = await apiRequest(getApiUrl(E.BASE));
  return handleResponse(response, 'Gagal mengambil data form exit survey');
};

export const getExitSurveyFormById = async (id: string): Promise<ExitSurveyForm> => {
  const response = await apiRequest(getApiUrl(E.BY_ID(id)));
  return handleResponse(response, 'Gagal mengambil detail form');
};

export const createExitSurveyForm = async (
  payload: CreateExitSurveyFormPayload
): Promise<ExitSurveyForm> => {
  const response = await apiRequest(getApiUrl(E.BASE), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Gagal menambah form exit survey');
};

export const updateExitSurveyForm = async (
  id: string,
  payload: UpdateExitSurveyFormPayload
): Promise<ExitSurveyForm> => {
  const response = await apiRequest(getApiUrl(E.BY_ID(id)), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Gagal mengubah form exit survey');
};

export const toggleExitSurveyForm = async (id: string): Promise<ExitSurveyForm> => {
  const response = await apiRequest(getApiUrl(E.TOGGLE(id)), { method: 'PATCH' });
  return handleResponse(response, 'Gagal mengubah status form');
};

export const deleteExitSurveyForm = async (id: string): Promise<void> => {
  const response = await apiRequest(getApiUrl(E.BY_ID(id)), { method: 'DELETE' });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Gagal menghapus form');
  }
};

export const duplicateExitSurveyForm = async (id: string): Promise<ExitSurveyForm> => {
  const response = await apiRequest(getApiUrl(E.DUPLICATE(id)), { method: 'POST' });
  return handleResponse(response, 'Gagal menduplikasi form');
};

export const getExitSurveyQuestions = async (
  formId: string
): Promise<ExitSurveyQuestion[]> => {
  const response = await apiRequest(getApiUrl(E.QUESTIONS(formId)));
  return handleResponse(response, 'Gagal mengambil pertanyaan');
};

export const createExitSurveyQuestion = async (
  formId: string,
  payload: CreateExitSurveyQuestionPayload
): Promise<ExitSurveyQuestion> => {
  const response = await apiRequest(getApiUrl(E.QUESTIONS(formId)), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Gagal menambah pertanyaan');
};

export const updateExitSurveyQuestion = async (
  formId: string,
  questionId: string,
  payload: UpdateExitSurveyQuestionPayload
): Promise<ExitSurveyQuestion> => {
  const response = await apiRequest(getApiUrl(E.QUESTION_BY_ID(formId, questionId)), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return handleResponse(response, 'Gagal mengubah pertanyaan');
};

export const deleteExitSurveyQuestion = async (
  formId: string,
  questionId: string
): Promise<void> => {
  const response = await apiRequest(getApiUrl(E.QUESTION_BY_ID(formId, questionId)), {
    method: 'DELETE',
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message || 'Gagal menghapus pertanyaan');
  }
};
