import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { metopenClassService } from '@/services/metopen.service';
import type {
  CreateClassDto,
  UpdateClassDto,
  PublishToClassDto,
} from '@/types/metopen.types';

// ==================== Query Keys ====================

const CLASS_KEYS = {
  classes: ['metopen-classes'] as const,
  classesForYear: (yearId: string | undefined) => ['metopen-classes', yearId] as const,
  academicYears: ['metopen-academic-years'] as const,
  classDetail: (id: string) => ['metopen-class', id] as const,
  classTasks: (id: string) => ['metopen-class-tasks', id] as const,
  publishedTemplates: (id: string) => ['metopen-class-published', id] as const,
};

// ==================== Academic Years Hook ====================

export function useMetopenAcademicYears() {
  return useQuery({
    queryKey: CLASS_KEYS.academicYears,
    queryFn: () => metopenClassService.getAcademicYears(),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== Auto-Sync Hook ====================

export function useAutoSyncMetopenClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => metopenClassService.autoSyncClass(),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classes });
      qc.invalidateQueries({ queryKey: CLASS_KEYS.academicYears });
      qc.invalidateQueries({ queryKey: ['metopen-publish-stats'] });
      toast.success(
        `Sync berhasil: ${result.totalStudents} mahasiswa terdaftar` +
        (result.newEnrollments > 0 ? `, ${result.newEnrollments} baru ditambahkan` : '')
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Class CRUD Hooks ====================

export function useMetopenClasses(academicYearId?: string) {
  return useQuery({
    queryKey: academicYearId ? CLASS_KEYS.classesForYear(academicYearId) : CLASS_KEYS.classes,
    queryFn: () => metopenClassService.getClasses(academicYearId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMetopenClassDetail(classId: string) {
  return useQuery({
    queryKey: CLASS_KEYS.classDetail(classId),
    queryFn: () => metopenClassService.getClassById(classId),
    enabled: !!classId,
  });
}

export function useCreateMetopenClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassDto) => metopenClassService.createClass(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classes });
      toast.success('Kelas berhasil dibuat');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateMetopenClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: UpdateClassDto }) =>
      metopenClassService.updateClass(classId, data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classes });
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classDetail(vars.classId) });
      toast.success('Kelas berhasil diperbarui');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMetopenClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => metopenClassService.deleteClass(classId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classes });
      toast.success('Kelas berhasil dihapus');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Enrollment Hooks ====================

export function useEnrollStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentIds }: { classId: string; studentIds: string[] }) =>
      metopenClassService.enrollStudents(classId, studentIds),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classDetail(vars.classId) });
      toast.success(`${result.enrolled} mahasiswa berhasil ditambahkan`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, studentId }: { classId: string; studentId: string }) =>
      metopenClassService.unenrollStudent(classId, studentId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classDetail(vars.classId) });
      toast.success('Mahasiswa dihapus dari kelas');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Publish & Tasks Hooks ====================

export function usePublishToClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: PublishToClassDto }) =>
      metopenClassService.publishToClass(classId, data),
    onSuccess: (result, vars) => {
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classTasks(vars.classId) });
      qc.invalidateQueries({ queryKey: CLASS_KEYS.publishedTemplates(vars.classId) });
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classDetail(vars.classId) });
      qc.invalidateQueries({ queryKey: CLASS_KEYS.classes });
      qc.invalidateQueries({ queryKey: ['metopen-classes'] });
      qc.invalidateQueries({ queryKey: ['metopen-publish-stats'] });
      toast.success(`Berhasil publish ${result.templatesPublished} template ke ${result.assignedCount} mahasiswa (${result.totalCreated} tugas dibuat)`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMetopenClassTasks(classId: string) {
  return useQuery({
    queryKey: CLASS_KEYS.classTasks(classId),
    queryFn: () => metopenClassService.getClassTasks(classId),
    enabled: !!classId,
    staleTime: 30 * 1000,
  });
}

export function usePublishedTemplateIds(classId: string) {
  return useQuery({
    queryKey: CLASS_KEYS.publishedTemplates(classId),
    queryFn: () => metopenClassService.getPublishedTemplateIds(classId),
    enabled: !!classId,
    staleTime: 30 * 1000,
  });
}
