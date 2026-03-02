import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExaminerRequests,
  getSupervisedStudentSeminars,
  getLecturerSeminarDetail,
  respondExaminerAssignment,
  getAssignmentSeminars,
  getEligibleExaminers,
  assignExaminers,
} from '@/services/lecturerSeminar.service';
import type { RespondAssignmentPayload } from '@/types/seminar.types';

// ============================================================
// Lecturer — Examiner Requests (Permintaan Menguji)
// ============================================================

export function useExaminerRequests(params?: { search?: string }) {
  return useQuery({
    queryKey: ['examiner-requests', params?.search],
    queryFn: () => getExaminerRequests(params),
  });
}

// ============================================================
// Lecturer — Supervised Student Seminars (Mahasiswa Bimbingan)
// ============================================================

export function useSupervisedStudentSeminars(params?: { search?: string }) {
  return useQuery({
    queryKey: ['supervised-student-seminars', params?.search],
    queryFn: () => getSupervisedStudentSeminars(params),
  });
}

// ============================================================
// Lecturer — Seminar Detail & Respond
// ============================================================

export function useLecturerSeminarDetail(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['lecturer-seminar-detail', seminarId],
    queryFn: () => getLecturerSeminarDetail(seminarId!),
    enabled: !!seminarId,
  });
}

export function useRespondExaminerAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      examinerId,
      payload,
    }: {
      examinerId: string;
      payload: RespondAssignmentPayload;
    }) => respondExaminerAssignment(examinerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-seminar-detail'] });
      queryClient.invalidateQueries({ queryKey: ['assignment-seminars'] });
    },
  });
}

// ============================================================
// Kadep — examiner assignment
// ============================================================

export function useAssignmentSeminars(params?: { search?: string }) {
  return useQuery({
    queryKey: ['assignment-seminars', params?.search],
    queryFn: () => getAssignmentSeminars(params),
  });
}

export function useEligibleExaminers(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['eligible-examiners', seminarId],
    queryFn: () => getEligibleExaminers(seminarId!),
    enabled: !!seminarId,
  });
}

export function useAssignExaminers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      examinerIds,
    }: {
      seminarId: string;
      examinerIds: string[];
    }) => assignExaminers(seminarId, examinerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignment-seminars'] });
      queryClient.invalidateQueries({ queryKey: ['examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-student-seminars'] });
    },
  });
}
