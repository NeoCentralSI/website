export type ExitSurveyQuestionType = 'single_choice' | 'multiple_choice' | 'text' | 'textarea';

export interface ExitSurveyOption {
  id: string;
  optionText: string;
  orderNumber: number;
}

export interface ExitSurveyQuestion {
  id: string;
  exitSurveyFormId: string;
  question: string;
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
  questionType: ExitSurveyQuestionType;
  isRequired?: boolean;
  orderNumber?: number;
  options?: Array<{ optionText: string; orderNumber?: number } | string>;
}

export type UpdateExitSurveyQuestionPayload = Partial<CreateExitSurveyQuestionPayload>;
