export type ExitSurveyQuestionType = 'short_answer' | 'paragraph' | 'single_choice' | 'multiple_choice' | 'number' | 'date';

export interface ExitSurveyAnswer {
  questionId: string;
  questionText?: string | null;
  optionId?: string | null;
  optionText?: string | null;
  answerText?: string | null;
  answerNumber?: number | null;
  answerDate?: string | null;
}

export interface ExitSurveyResponse {
  id: string;
  name: string;
  nim: string;
  email: string;
  phone?: string | null;
  enrollmentYear?: number | null;
  yudisiumId?: string | null;
  yudisiumName?: string | null;
  submittedAt: string | null;
  answers: ExitSurveyAnswer[];
}

export interface ExitSurveyOption {
  id: string;
  optionText: string;
  orderNumber: number;
}

export interface ExitSurveyQuestion {
  id: string;
  exitSurveyFormId: string;
  question: string;
  description: string | null;
  questionType: ExitSurveyQuestionType;
  isRequired: boolean;
  orderNumber: number;
  options: ExitSurveyOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ExitSurveySession {
  id: string;
  exitSurveyFormId: string;
  name: string;
  description: string | null;
  order: number;
  questions: ExitSurveyQuestion[];
}

export interface ExitSurveyForm {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalQuestions: number;
  usedCount: number;
  sessions?: ExitSurveySession[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExitSurveyFormPayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateExitSurveyFormPayload = Partial<CreateExitSurveyFormPayload>;

export interface CreateExitSurveySessionPayload {
  name: string;
  description?: string | null;
  order?: number;
}

export type UpdateExitSurveySessionPayload = Partial<CreateExitSurveySessionPayload>;

export interface CreateExitSurveyQuestionPayload {
  exitSurveySessionId?: string; // Optional if created within a session context
  question: string;
  description?: string | null;
  questionType: ExitSurveyQuestionType;
  isRequired?: boolean;
  orderNumber?: number;
  options?: Array<{ optionText: string; orderNumber?: number } | string>;
}

export type UpdateExitSurveyQuestionPayload = Partial<CreateExitSurveyQuestionPayload>;
