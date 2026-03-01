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

export interface ExitSurveyForm {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalQuestions?: number;
  questions?: ExitSurveyQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExitSurveyFormPayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export type UpdateExitSurveyFormPayload = Partial<CreateExitSurveyFormPayload>;

export interface CreateExitSurveyQuestionPayload {
  question: string;
  questionType: ExitSurveyQuestionType;
  isRequired?: boolean;
  orderNumber?: number;
  options?: Array<{ optionText: string; orderNumber?: number } | string>;
}

export type UpdateExitSurveyQuestionPayload = Partial<CreateExitSurveyQuestionPayload>;
