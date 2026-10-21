import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import ExitSurveyFormResponsePanel from './ExitSurveyFormResponsePanel';
import type { ExitSurveyForm, ExitSurveyResponse } from '@/types/exit-survey.types';
vi.mock('lottie-react', () => ({ default: () => null }));
const response = (id: string, name: string): ExitSurveyResponse => ({
  id, name, nim: id, email: `${id}@example.com`, submittedAt: '2026-10-20', answers: [
    { questionId: 'text', answerText: `Jawaban ${name}\nBaris kedua` },
    { questionId: 'number', answerNumber: 0 },
    { questionId: 'date', answerDate: '2026-10-20T00:00:00.000Z' },
    { questionId: 'choice', optionText: 'Pilihan A' },
    { questionId: 'choice', optionText: 'Pilihan B' },
  ],
});
vi.mock('@/services/yudisium/exit-survey.service', () => ({
  getExitSurveyFormResponses: vi.fn(async () => [response('a', 'Mahasiswa Satu'), response('b', 'Mahasiswa Dua')]),
  downloadExitSurveyResponsesExcel: vi.fn(), downloadExitSurveyResponsesPdf: vi.fn(),
}));
const form: ExitSurveyForm = {
  id: 'form', name: 'Survei', description: null, isActive: true, totalQuestions: 5, usedCount: 2,
  createdAt: '2026-10-20', updatedAt: '2026-10-20',
  sessions: [{ id: 'session', name: 'Evaluasi', exitSurveyFormId: 'form', description: null, order: 1, questions:
    ['text', 'number', 'date', 'choice', 'empty'].map((id, index) => ({
      id, exitSurveyFormId: 'form', description: null, isRequired: false, orderNumber: index + 1,
      question: `Pertanyaan ${index + 1}`, questionType: id === 'number' ? 'number' : id === 'date' ? 'date' : 'short_answer', options: [],
    })),
  }],
};
it('opens only the selected respondent answers including zero, dates, multiple options and missing answers', async () => {
  render(<QueryClientProvider client={new QueryClient()}><ExitSurveyFormResponsePanel form={form} /></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: 'Lihat detail respons Mahasiswa Dua' }));
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByText(/Jawaban Mahasiswa Dua/)).toBeInTheDocument();
  expect(within(dialog).queryByText(/Jawaban Mahasiswa Satu/)).not.toBeInTheDocument();
  expect(within(dialog).getByText('0')).toBeInTheDocument();
  expect(within(dialog).getByText('20 Oktober 2026')).toBeInTheDocument();
  expect(within(dialog).getByText('Pilihan A, Pilihan B')).toBeInTheDocument();
  expect(within(dialog).getByText('Tidak memberikan jawaban')).toBeInTheDocument();
  expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tutup' }));
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
