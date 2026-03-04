import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LecturerSeminarListItem } from '@/types/seminar.types';
import {
  getExaminerRequests,
  getSupervisedStudentSeminars,
  getLecturerSeminarDetail,
  respondExaminerAssignment,
  getAssignmentSeminars,
  getEligibleExaminers,
  assignExaminers,
  getExaminerAssessmentForm,
  submitExaminerAssessment,
  getSupervisorFinalizationData,
  finalizeSeminarBySupervisor,
  getSeminarRevisionBoard,
  approveRevision,
  unapproveRevision,
  getSeminarAudiences,
  approveAudience,
  unapproveAudience,
  toggleAudiencePresence,
} from '@/services/lecturerSeminar.service';
import type {
  RespondAssignmentPayload,
  SubmitExaminerAssessmentPayload,
  FinalizeSeminarPayload,
} from '@/types/seminar.types';
import { toast } from 'sonner';

// ============================================================
// Lecturer — Combined Seminar List
// ============================================================

export function useLecturerSeminars(params?: { search?: string }) {
  const examinerQuery = useQuery({
    queryKey: ['examiner-requests', params?.search],
    queryFn: () => getExaminerRequests(params),
  });
  const supervisedQuery = useQuery({
    queryKey: ['supervised-student-seminars', params?.search],
    queryFn: () => getSupervisedStudentSeminars(params),
  });

  const data: LecturerSeminarListItem[] | undefined =
    examinerQuery.data || supervisedQuery.data
      ? (() => {
          const map = new Map<string, LecturerSeminarListItem>();
          for (const item of examinerQuery.data ?? []) {
            map.set(item.id, {
              ...item,
              myRoles: ['examiner'],
            });
          }
          for (const item of supervisedQuery.data ?? []) {
            const existing = map.get(item.id);
            if (existing) {
              existing.myRoles = [...existing.myRoles, item.myRole];
            } else {
              map.set(item.id, {
                ...item,
                myRoles: [item.myRole],
                myExaminerStatus: null,
                myExaminerId: null,
                myExaminerOrder: null,
              });
            }
          }
          return Array.from(map.values());
        })()
      : undefined;

  return {
    data,
    isLoading: examinerQuery.isLoading || supervisedQuery.isLoading,
    isFetching: examinerQuery.isFetching || supervisedQuery.isFetching,
    error: examinerQuery.error || supervisedQuery.error,
    refetch: () => {
      examinerQuery.refetch();
      supervisedQuery.refetch();
    },
  };
}

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

export function useExaminerAssessmentForm(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['seminar-examiner-assessment-form', seminarId],
    queryFn: () => getExaminerAssessmentForm(seminarId!),
    enabled: !!seminarId,
  });
}

export function useSubmitExaminerAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      payload,
    }: {
      seminarId: string;
      payload: SubmitExaminerAssessmentPayload;
    }) => submitExaminerAssessment(seminarId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-examiner-assessment-form', vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['seminar-supervisor-finalization', vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-seminar-detail', vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-student-seminars'] });
    },
  });
}

export function useSupervisorFinalizationData(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['seminar-supervisor-finalization', seminarId],
    queryFn: () => getSupervisorFinalizationData(seminarId!),
    enabled: !!seminarId,
  });
}

export function useFinalizeSeminarBySupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      payload,
    }: {
      seminarId: string;
      payload: FinalizeSeminarPayload;
    }) => finalizeSeminarBySupervisor(seminarId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-supervisor-finalization', vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-seminar-detail', vars.seminarId] });
      queryClient.invalidateQueries({ queryKey: ['examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-student-seminars'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}

export function useSeminarRevisionBoard(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['seminar-revision-board', seminarId],
    queryFn: () => getSeminarRevisionBoard(seminarId!),
    enabled: !!seminarId,
  });
}

export function useApproveRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId }: { seminarId: string; revisionId: string }) =>
      approveRevision(seminarId, revisionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', variables.seminarId] });
      toast.success('Revisi berhasil disetujui');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui revisi');
    },
  });
}

export function useUnapproveRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, revisionId }: { seminarId: string; revisionId: string }) =>
      unapproveRevision(seminarId, revisionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-revision-board', variables.seminarId] });
      toast.success('Persetujuan revisi berhasil dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan persetujuan revisi');
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

// ============================================================
// Lecturer — Seminar Audience Management
// ============================================================

export function useSeminarAudiences(seminarId: string | undefined) {
  return useQuery({
    queryKey: ['seminar-audiences', seminarId],
    queryFn: () => getSeminarAudiences(seminarId!),
    enabled: !!seminarId,
  });
}

export function useApproveAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      approveAudience(seminarId, studentId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', vars.seminarId] });
      toast.success('Peserta berhasil disetujui');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menyetujui peserta');
    },
  });
}

export function useUnapproveAudience() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ seminarId, studentId }: { seminarId: string; studentId: string }) =>
      unapproveAudience(seminarId, studentId),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', vars.seminarId] });
      toast.success('Persetujuan peserta dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membatalkan persetujuan');
    },
  });
}

export function useToggleAudiencePresence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      seminarId,
      studentId,
      isPresent,
    }: {
      seminarId: string;
      studentId: string;
      isPresent: boolean;
    }) => toggleAudiencePresence(seminarId, studentId, isPresent),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['seminar-audiences', vars.seminarId] });
      toast.success(vars.isPresent ? 'Peserta ditandai hadir' : 'Kehadiran peserta dibatalkan');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah status kehadiran');
    },
  });
}
