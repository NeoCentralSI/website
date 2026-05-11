import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metopenGradingService } from '@/services/metopenGrading.service';
import { toast } from 'sonner';

export function useClassGradingSummary(classId: string | undefined) {
  return useQuery({
    queryKey: ['metopen-grading-summary', classId],
    queryFn: () => metopenGradingService.getClassSummary(classId!),
    enabled: !!classId,
  });
}

export function useRubricCriteria(role: 'supervisor' | 'default') {
  const formCode = role === 'supervisor' ? 'TA-03A' : 'TA-03B';
  return useQuery({
    queryKey: ['assessment-criteria', formCode],
    queryFn: () => metopenGradingService.getRubricCriteria(role),
  });
}

export function useInputSupervisorScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: metopenGradingService.inputSupervisorScore,
    onSuccess: () => {
      toast.success('Nilai pembimbing (TA-03A) berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['supervisor-scoring-queue'] });
      queryClient.invalidateQueries({ queryKey: ['metopel-seminar-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kadep-title-reports'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan nilai pembimbing');
    },
  });
}

export function useInputLecturerScore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: metopenGradingService.inputLecturerScore,
    onSuccess: () => {
      toast.success('Nilai Koordinator Metopen (TA-03B) berhasil disimpan');
      queryClient.invalidateQueries({ queryKey: ['assessment-metopen-queue'] });
      queryClient.invalidateQueries({ queryKey: ['metopel-seminar-eligibility'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kadep-title-reports'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal menyimpan nilai Koordinator Metopen');
    },
  });
}

export function useLockClassGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: metopenGradingService.lockClassGrades,
    onSuccess: () => {
      toast.success('Nilai akhir berhasil dikunci');
      queryClient.invalidateQueries({ queryKey: ['metopen-grading-summary'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Gagal mengunci nilai');
    },
  });
}
