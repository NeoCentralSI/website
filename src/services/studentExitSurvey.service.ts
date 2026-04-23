import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type { ExitSurveyQuestionType } from '@/types/exit-survey.types';

export type StudentExitSurveyDetailResponse = {
  yudisium: {
    id: string;
    name: string | null;
    status: string;
  };
  form: {
    id: string;
    name: string;
    description: string | null;
    questions: Array<{
      id: string;
      question: string;
      questionType: ExitSurveyQuestionType;
      isRequired: boolean;
      orderNumber: number;
      options: Array<{
        id: string;
        optionText: string;
        orderNumber: number;
      }>;
    }>;
  };
  response: {
    id: string;
    submittedAt: string;
    answers: Array<{
      id: string;
      questionId: string;
      optionId: string | null;
      answerText: string | null;
    }>;
  } | null;
  isSubmitted: boolean;
};

export type SubmitStudentExitSurveyPayload = {
  answers: Array<{
    questionId: string;
    optionId?: string;
    optionIds?: string[];
    answerText?: string;
  }>;
};

const EP = API_CONFIG.ENDPOINTS.YUDISIUM_STUDENT;

export async function getStudentExitSurvey(): Promise<StudentExitSurveyDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.EXIT_SURVEY));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat exit survey');
  return json.data;
}

export async function submitStudentExitSurvey(
  payload: SubmitStudentExitSurveyPayload
): Promise<{ response: StudentExitSurveyDetailResponse['response'] }> {
  const res = await apiRequest(getApiUrl(EP.EXIT_SURVEY_SUBMIT), {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengirim exit survey');
  return json.data;
}
