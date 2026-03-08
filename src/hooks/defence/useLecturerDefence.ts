import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDefenceExaminerRequests,
  getSupervisedStudentDefences,
  getLecturerDefenceDetail,
  respondDefenceExaminerAssignment,
  getDefenceAssignmentSeminars,
  getDefenceEligibleExaminers,
  assignDefenceExaminers,
  getDefenceAssessmentForm,
  submitDefenceAssessment,
  getDefenceFinalizationData,
  finalizeDefenceBySupervisor,
} from '@/services/lecturerDefence.service';
import type {
  RespondDefenceAssignmentPayload,
  SubmitDefenceAssessmentPayload,
  FinalizeDefencePayload,
} from '@/types/defence.types';

// ============================================================
// Lecturer — Examiner Requests
// ============================================================

export function useDefenceExaminerRequests(params?: { search?: string }) {
  return useQuery({
    queryKey: ['defence-examiner-requests', params?.search],
    queryFn: () => getDefenceExaminerRequests(params),
  });
}

// ============================================================
// Lecturer — Supervised Student Defences
// ============================================================

export function useSupervisedStudentDefences(params?: { search?: string }) {
  return useQuery({
    queryKey: ['supervised-student-defences', params?.search],
    queryFn: () => getSupervisedStudentDefences(params),
  });
}

// ============================================================
// Lecturer — Defence Detail
// ============================================================

export function useLecturerDefenceDetail(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['lecturer-defence-detail', defenceId],
    queryFn: () => getLecturerDefenceDetail(defenceId!),
    enabled: !!defenceId,
  });
}

// ============================================================
// Lecturer — Respond to Assignment
// ============================================================

export function useRespondDefenceExaminerAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      examinerId,
      payload,
    }: {
      examinerId: string;
      payload: RespondDefenceAssignmentPayload;
    }) => respondDefenceExaminerAssignment(examinerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defence-examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-defence-detail'] });
      queryClient.invalidateQueries({ queryKey: ['defence-assignment-list'] });
    },
  });
}

// ============================================================
// Kadep — Assignment List
// ============================================================

export function useDefenceAssignmentList(params?: { search?: string }) {
  return useQuery({
    queryKey: ['defence-assignment-list', params?.search],
    queryFn: () => getDefenceAssignmentSeminars(params),
  });
}

// ============================================================
// Kadep — Eligible Examiners
// ============================================================

export function useDefenceEligibleExaminers(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['defence-eligible-examiners', defenceId],
    queryFn: () => getDefenceEligibleExaminers(defenceId!),
    enabled: !!defenceId,
  });
}

// ============================================================
// Kadep — Assign Examiners
// ============================================================

export function useAssignDefenceExaminers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      defenceId,
      examinerIds,
    }: {
      defenceId: string;
      examinerIds: string[];
    }) => assignDefenceExaminers(defenceId, examinerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defence-assignment-list'] });
      queryClient.invalidateQueries({ queryKey: ['defence-examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-defence-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-defences'] });
      queryClient.invalidateQueries({ queryKey: ['admin-defence-detail'] });
    },
  });
}

// ============================================================
// Lecturer — Defence Assessment & Finalization
// ============================================================

export function useDefenceAssessmentForm(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['defence-assessment-form', defenceId],
    queryFn: () => getDefenceAssessmentForm(defenceId!),
    enabled: !!defenceId,
  });
}

export function useSubmitDefenceAssessment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      defenceId,
      payload,
    }: {
      defenceId: string;
      payload: SubmitDefenceAssessmentPayload;
    }) => submitDefenceAssessment(defenceId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['defence-assessment-form', vars.defenceId] });
      queryClient.invalidateQueries({ queryKey: ['defence-finalization', vars.defenceId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-defence-detail', vars.defenceId] });
      queryClient.invalidateQueries({ queryKey: ['defence-examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-student-defences'] });
    },
  });
}

export function useDefenceFinalizationData(defenceId: string | undefined) {
  return useQuery({
    queryKey: ['defence-finalization', defenceId],
    queryFn: () => getDefenceFinalizationData(defenceId!),
    enabled: !!defenceId,
  });
}

export function useFinalizeDefenceBySupervisor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      defenceId,
      payload,
    }: {
      defenceId: string;
      payload: FinalizeDefencePayload;
    }) => finalizeDefenceBySupervisor(defenceId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['defence-finalization', vars.defenceId] });
      queryClient.invalidateQueries({ queryKey: ['lecturer-defence-detail', vars.defenceId] });
      queryClient.invalidateQueries({ queryKey: ['defence-examiner-requests'] });
      queryClient.invalidateQueries({ queryKey: ['supervised-student-defences'] });
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}
