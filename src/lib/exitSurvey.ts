import type { ExitSurveyQuestionType } from '@/types/exit-survey.types';

export const EXIT_SURVEY_QUESTION_TYPE_LABELS: Record<ExitSurveyQuestionType, string> = {
  single_choice: 'Pilihan Tunggal',
  multiple_choice: 'Pilihan Ganda',
  text: 'Teks Singkat',
  textarea: 'Teks Panjang',
};

export function getQuestionTypeLabel(type: ExitSurveyQuestionType): string {
  return EXIT_SURVEY_QUESTION_TYPE_LABELS[type] ?? type;
}
