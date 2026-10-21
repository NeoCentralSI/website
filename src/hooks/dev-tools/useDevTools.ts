/**
 * DEV TOOLS HOOKS
 * ⚠️ DELETE THIS DIRECTORY when dev tools are no longer needed.
 */
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { devToolsService } from '@/services/devTools.service';
import type { UpdateStudentDto, UpdateUserDto, CreateUserDto, UpdateGuidanceScheduleDto, SetPeriodFlagsDto } from '@/types/devTools.types';

const QK = {
  students: 'devtools-students',
  studentDetail: 'devtools-student-detail',
  theses: 'devtools-theses',
  users: 'devtools-users',
  roles: 'devtools-roles',
  academicYears: 'devtools-academic-years',
  guidances: 'devtools-guidances',
  semesterFlags: 'devtools-semester-flags',
  supervisorRequests: 'devtools-supervisor-requests',
} as const;

export function useDevToolsStudents(search: string, statusFilter: string) {
  return useQuery({
    queryKey: [QK.students, search, statusFilter],
    queryFn: () => devToolsService.getStudents(search || undefined, statusFilter || undefined),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useDevToolsStudentDetail(id: string | null) {
  return useQuery({
    queryKey: [QK.studentDetail, id],
    queryFn: () => devToolsService.getStudentDetail(id!),
    enabled: !!id,
    staleTime: 15_000,
  });
}

export function useDevToolsTheses(studentId: string | null) {
  return useQuery({
    queryKey: [QK.theses, studentId],
    queryFn: () => devToolsService.getTheses(studentId!),
    enabled: !!studentId,
    staleTime: 15_000,
  });
}

export function useDevToolsUsers(search: string) {
  return useQuery({
    queryKey: [QK.users, search],
    queryFn: () => devToolsService.getUsers(search || undefined),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useDevToolsRoles() {
  return useQuery({
    queryKey: [QK.roles],
    queryFn: () => devToolsService.getRoles(),
    staleTime: 5 * 60_000,
  });
}

export function useDevToolsAcademicYears() {
  return useQuery({
    queryKey: [QK.academicYears],
    queryFn: () => devToolsService.getAcademicYears(),
    staleTime: 60_000,
  });
}

export function useDevToolsGuidances(params: { search: string; status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [QK.guidances, params.search, params.status, params.page, params.pageSize],
    queryFn: () =>
      devToolsService.getGuidances({
        search: params.search || undefined,
        status: params.status || undefined,
        page: params.page,
        pageSize: params.pageSize,
      }),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useDevToolsSemesterFlags(studentId: string | null) {
  return useQuery({
    queryKey: [QK.semesterFlags, studentId],
    queryFn: () => devToolsService.getSemesterFlags(studentId!),
    enabled: !!studentId,
  });
}

export function useDevToolsSupervisorRequests(params: { search: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: [QK.supervisorRequests, params.search, params.page, params.pageSize],
    queryFn: () => devToolsService.getSupervisorRequests(params),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });
}

export function useDevToolsMutations() {
  const qc = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: [QK.students] });
    qc.invalidateQueries({ queryKey: [QK.studentDetail] });
    qc.invalidateQueries({ queryKey: [QK.theses] });
    qc.invalidateQueries({ queryKey: [QK.users] });
    qc.invalidateQueries({ queryKey: [QK.academicYears] });
    qc.invalidateQueries({ queryKey: [QK.guidances] });
    qc.invalidateQueries({ queryKey: [QK.semesterFlags] });
    qc.invalidateQueries({ queryKey: [QK.supervisorRequests] });
    qc.invalidateQueries({ queryKey: ['thesis-proposal'] });
    qc.invalidateQueries({ queryKey: ['research-method'] });
  }, [qc]);

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>, successMsg?: string): Promise<T | null> => {
      setIsSubmitting(true);
      try {
        const result = await fn();
        if (successMsg) toast.success(successMsg);
        else if (typeof result === 'string') toast.success(result);
        invalidateAll();
        return result;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Operasi gagal');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [invalidateAll],
  );

  return {
    isSubmitting,
    updateStudent: (id: string, data: UpdateStudentDto) =>
      wrap(() => devToolsService.updateStudent(id, data), 'Data mahasiswa berhasil diperbarui'),
    updateUser: (id: string, data: UpdateUserDto) =>
      wrap(() => devToolsService.updateUser(id, data), 'Data user berhasil diperbarui'),
    deleteUser: (id: string) => wrap(() => devToolsService.deleteUser(id)),
    resetStudent: (id: string) => wrap(() => devToolsService.resetStudent(id)),
    resetStudentProgress: (id: string) => wrap(() => devToolsService.resetStudentProgress(id)),
    deleteThesis: (id: string) => wrap(() => devToolsService.deleteThesis(id)),
    changePassword: (id: string, password: string) => wrap(() => devToolsService.changePassword(id, password)),
    createUser: (data: CreateUserDto) => wrap(() => devToolsService.createUser(data)),
    setPeriodFlags: (studentId: string, data: SetPeriodFlagsDto) =>
      wrap(() => devToolsService.setPeriodFlags(studentId, data)),
    setThesisAcademicYear: (thesisId: string, academicYearId: string) =>
      wrap(() => devToolsService.setThesisAcademicYear(thesisId, academicYearId)),
    updateGuidanceSchedule: (id: string, data: UpdateGuidanceScheduleDto) =>
      wrap(() => devToolsService.updateGuidanceSchedule(id, data)),
    setSupervisorRequestTime: (id: string, createdAt: string) =>
      wrap(() => devToolsService.setSupervisorRequestTime(id, createdAt), 'Waktu pengajuan pembimbing diubah'),
  };
}
