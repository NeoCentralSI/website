import type { ExitSurveyQuestionType } from '@/types/exit-survey.types';

export const EXIT_SURVEY_QUESTION_TYPE_LABELS: Record<ExitSurveyQuestionType, string> = {
  short_answer: 'Teks Singkat',
  paragraph: 'Teks Panjang',
  single_choice: 'Pilihan Tunggal',
  multiple_choice: 'Pilihan Ganda',
  date: 'Tanggal',
};

export function getQuestionTypeLabel(type: ExitSurveyQuestionType): string {
  return EXIT_SURVEY_QUESTION_TYPE_LABELS[type] ?? type;
}
