import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { metopenGradingService } from "@/services/metopenGrading.service";
import { toast } from "sonner";

export const GRADING_QUERY_KEY = "metopen-grading-summary";

/**
 * Hook to get class grading summary
 */
export function useClassGradingSummary(classId: string | undefined) {
  return useQuery({
    queryKey: [GRADING_QUERY_KEY, classId],
    queryFn: () => metopenGradingService.getClassSummary(classId!),
    enabled: !!classId,
  });
}

/**
 * Hook to input supervisor score
 */
export function useInputSupervisorScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: metopenGradingService.inputSupervisorScore,
    onSuccess: (res) => {
      toast.success(res.message || "Nilai berhasil disimpan");
      queryClient.invalidateQueries({ queryKey: [GRADING_QUERY_KEY] });
      // Invalidate related thesis monitoring if any
      queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal menyimpan nilai");
    },
  });
}

/**
 * Hook to lock class grades
 */
export function useLockClassGrades() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: metopenGradingService.lockClassGrades,
    onSuccess: (res) => {
      toast.success(res.message || "Nilai akhir berhasil di-lock");
      queryClient.invalidateQueries({ queryKey: [GRADING_QUERY_KEY] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Gagal melakukan lock nilai");
    },
  });
}
