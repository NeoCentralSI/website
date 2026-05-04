import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getExitSurveyForms,
  getExitSurveyFormById,
  createExitSurveyForm,
  updateExitSurveyForm,
  toggleExitSurveyForm,
  deleteExitSurveyForm,
  duplicateExitSurveyForm,
  getExitSurveyQuestions,
  getExitSurveyQuestionById,
  createExitSurveyQuestion,
  updateExitSurveyQuestion,
  deleteExitSurveyQuestion,
  getStudentExitSurvey,
  submitStudentExitSurvey,
} from '@/services/yudisium/yudisium-exit-survey.service';

export const exitSurveyKeys = {
  all: ['yudisium-exit-survey'] as const,
  forms: () => [...exitSurveyKeys.all, 'forms'] as const,
  formDetail: (id: string) => [...exitSurveyKeys.all, 'form-detail', id] as const,
  questions: (formId: string) => [...exitSurveyKeys.all, 'questions', formId] as const,
  questionDetail: (id: string) => [...exitSurveyKeys.all, 'question-detail', id] as const,
  studentSurvey: () => [...exitSurveyKeys.all, 'student-survey'] as const,
};

// --- FORM MANAGEMENT ---

export function useExitSurveyForms() {
  return useQuery({
    queryKey: exitSurveyKeys.forms(),
    queryFn: getExitSurveyForms,
  });
}

export function useExitSurveyFormDetail(id: string) {
  return useQuery({
    queryKey: exitSurveyKeys.formDetail(id),
    queryFn: () => getExitSurveyFormById(id),
    enabled: !!id,
  });
}

export function useCreateExitSurveyForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExitSurveyForm,
    onSuccess: () => {
      toast.success('Formulir exit survey berhasil dibuat');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.forms() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateExitSurveyForm(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateExitSurveyForm(id, data),
    onSuccess: () => {
      toast.success('Formulir exit survey berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.forms() });
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.formDetail(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleExitSurveyForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleExitSurveyForm(id),
    onSuccess: () => {
      toast.success('Status formulir berhasil diubah');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.forms() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteExitSurveyForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExitSurveyForm(id),
    onSuccess: () => {
      toast.success('Formulir berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.forms() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDuplicateExitSurveyForm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicateExitSurveyForm(id),
    onSuccess: () => {
      toast.success('Formulir berhasil diduplikasi');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.forms() });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// --- QUESTION MANAGEMENT ---

export function useExitSurveyQuestions(formId: string) {
  return useQuery({
    queryKey: exitSurveyKeys.questions(formId),
    queryFn: () => getExitSurveyQuestions(formId),
    enabled: !!formId,
  });
}

export function useExitSurveyQuestionDetail(formId: string, id: string) {
  return useQuery({
    queryKey: [...exitSurveyKeys.questionDetail(id), formId],
    queryFn: () => getExitSurveyQuestionById(formId, id),
    enabled: !!formId && !!id,
  });
}

export function useCreateExitSurveyQuestion(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createExitSurveyQuestion(formId, data),
    onSuccess: () => {
      toast.success('Pertanyaan berhasil ditambahkan');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.questions(formId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateExitSurveyQuestion(formId: string, questionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => updateExitSurveyQuestion(formId, questionId, data),
    onSuccess: () => {
      toast.success('Pertanyaan berhasil diperbarui');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.questions(formId) });
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.questionDetail(questionId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteExitSurveyQuestion(formId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteExitSurveyQuestion(formId, questionId),
    onSuccess: () => {
      toast.success('Pertanyaan berhasil dihapus');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.questions(formId) });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// --- STUDENT ACTIONS ---

export function useStudentExitSurvey() {
  return useQuery({
    queryKey: exitSurveyKeys.studentSurvey(),
    queryFn: getStudentExitSurvey,
  });
}

export function useSubmitStudentExitSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStudentExitSurvey,
    onSuccess: () => {
      toast.success('Exit survey berhasil dikirim');
      void queryClient.invalidateQueries({ queryKey: exitSurveyKeys.studentSurvey() });
      void queryClient.invalidateQueries({ queryKey: ['student-yudisium', 'overview'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
