import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getStudentExitSurvey,
  submitStudentExitSurvey,
  type SubmitStudentExitSurveyPayload,
} from '@/services/studentExitSurvey.service';

const studentExitSurveyKeys = {
  all: ['student-exit-survey'] as const,
  detail: () => [...studentExitSurveyKeys.all, 'detail'] as const,
};

export function useStudentExitSurveyDetail() {
  return useQuery({
    queryKey: studentExitSurveyKeys.detail(),
    queryFn: getStudentExitSurvey,
  });
}

export function useSubmitStudentExitSurvey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitStudentExitSurveyPayload) => submitStudentExitSurvey(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentExitSurveyKeys.detail() });
      queryClient.invalidateQueries({ queryKey: ['student-yudisium', 'overview'] });
      toast.success('Exit survey berhasil dikirim');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengirim exit survey');
    },
  });
}
