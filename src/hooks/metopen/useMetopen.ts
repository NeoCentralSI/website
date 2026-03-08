import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { metopenService } from '@/services/metopen.service';
import type {
  CreateTemplateDto,
  UpdateTemplateDto,
  ReorderTemplatesDto,
  GradeDto,
  PublishTasksDto,
} from '@/types/metopen.types';

// ==================== Query Keys ====================

const KEYS = {
  templates: ['metopen-templates'] as const,
  template: (id: string) => ['metopen-template', id] as const,
  myTasks: ['metopen-my-tasks'] as const,
  taskDetail: (id: string) => ['metopen-task', id] as const,
  myGateStatus: ['metopen-my-gate-status'] as const,
  gradingQueue: ['metopen-grading-queue'] as const,
  progress: (thesisId: string) => ['metopen-progress', thesisId] as const,
  gateStatus: (thesisId: string) => ['metopen-gate-status', thesisId] as const,
  monitoring: ['metopen-monitoring'] as const,
  attachments: (templateId: string) => ['metopen-template-attachments', templateId] as const,
  publishStats: ['metopen-publish-stats'] as const,
  classes: ['metopen-classes'] as const,
  class: (id: string) => ['metopen-class', id] as const,
};

// ==================== Template Hooks ====================

export function useMetopenTemplates(params?: { isActive?: string; topicId?: string }) {
  return useQuery({
    queryKey: [...KEYS.templates, params],
    queryFn: () => metopenService.getTemplates(params),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMetopenTemplate(id: string) {
  return useQuery({
    queryKey: KEYS.template(id),
    queryFn: () => metopenService.getTemplateById(id),
    enabled: !!id,
  });
}

export function useCreateMetopenTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTemplateDto) => metopenService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Template berhasil dibuat');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateMetopenTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTemplateDto }) =>
      metopenService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Template berhasil diperbarui');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMetopenTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metopenService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Template berhasil dihapus');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useReorderMetopenTemplates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReorderTemplatesDto) => metopenService.reorderTemplates(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Urutan template diperbarui');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Template Attachment Hooks ====================

export function useTemplateAttachments(templateId: string) {
  return useQuery({
    queryKey: KEYS.attachments(templateId),
    queryFn: () => metopenService.getTemplateAttachments(templateId),
    enabled: !!templateId,
  });
}

export function useUploadTemplateAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, file }: { templateId: string; file: File }) =>
      metopenService.uploadTemplateAttachment(templateId, file),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.attachments(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Lampiran berhasil diunggah');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUploadTemplateAttachmentsBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, files }: { templateId: string; files: File[] }) =>
      metopenService.uploadTemplateAttachmentsBatch(templateId, files),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.attachments(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success(`${variables.files.length} lampiran berhasil diunggah`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteTemplateAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, attachmentId }: { templateId: string; attachmentId: string }) =>
      metopenService.deleteTemplateAttachment(templateId, attachmentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.attachments(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: KEYS.templates });
      toast.success('Lampiran berhasil dihapus');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Publish Tasks Hook (Bulk) ====================

export function usePublishMetopenTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data?: PublishTasksDto) =>
      metopenService.publishTasks(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: KEYS.myTasks });
      queryClient.invalidateQueries({ queryKey: KEYS.monitoring });
      queryClient.invalidateQueries({ queryKey: KEYS.publishStats });
      toast.success(`Tugas berhasil di-publish ke ${result.assignedCount} mahasiswa`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useMetopenPublishStats() {
  return useQuery({
    queryKey: KEYS.publishStats,
    queryFn: () => metopenService.getPublishStats(),
    staleTime: 30 * 1000,
  });
}

export function useUpdateMetopenPublishDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; classId: string; deadline: string }) =>
      metopenService.updatePublishDeadline(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.publishStats });
      queryClient.invalidateQueries({ queryKey: KEYS.monitoring });
      toast.success('Deadline berhasil diperbarui');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useDeleteMetopenPublishedTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; classId: string }) =>
      metopenService.deletePublishedTasks(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: KEYS.publishStats });
      queryClient.invalidateQueries({ queryKey: KEYS.monitoring });
      queryClient.invalidateQueries({ queryKey: KEYS.myTasks });
      toast.success(`${result.deletedCount} tugas berhasil dihapus`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Student Task Hooks ====================

export function useMetopenMyTasks() {
  return useQuery({
    queryKey: KEYS.myTasks,
    queryFn: () => metopenService.getMyTasks(),
    staleTime: 30 * 1000,
  });
}

export function useMetopenTaskDetail(milestoneId: string) {
  return useQuery({
    queryKey: KEYS.taskDetail(milestoneId),
    queryFn: () => metopenService.getTaskDetail(milestoneId),
    enabled: !!milestoneId,
  });
}

export function useSubmitMetopenTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: { notes?: string; file?: File } }) =>
      metopenService.submitTask(milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.myTasks });
      toast.success('Tugas berhasil dikirim');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Gate Status Hook ====================

export function useMetopenMyGateStatus() {
  return useQuery({
    queryKey: KEYS.myGateStatus,
    queryFn: () => metopenService.getMyGateStatus(),
    staleTime: 60 * 1000,
  });
}

// ==================== Grading Hooks ====================

export function useMetopenGradingQueue(params?: { status?: string }) {
  return useQuery({
    queryKey: [...KEYS.gradingQueue, params],
    queryFn: () => metopenService.getGradingQueue(params),
    staleTime: 30 * 1000,
  });
}

export function useGradeMetopenMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: GradeDto }) =>
      metopenService.gradeMilestone(milestoneId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.gradingQueue });
      queryClient.invalidateQueries({ queryKey: KEYS.myTasks });
      toast.success('Penilaian berhasil disimpan');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==================== Progress & Gate Hooks ====================

export function useMetopenProgress(thesisId: string) {
  return useQuery({
    queryKey: KEYS.progress(thesisId),
    queryFn: () => metopenService.getProgress(thesisId),
    enabled: !!thesisId,
    staleTime: 60 * 1000,
  });
}

export function useMetopenGateStatus(thesisId: string) {
  return useQuery({
    queryKey: KEYS.gateStatus(thesisId),
    queryFn: () => metopenService.getGateStatus(thesisId),
    enabled: !!thesisId,
    staleTime: 60 * 1000,
  });
}

// ==================== Monitoring Hook ====================

export function useMetopenMonitoring(params?: { academicYearId?: string }) {
  return useQuery({
    queryKey: [...KEYS.monitoring, params],
    queryFn: () => metopenService.getMonitoringSummary(params),
    staleTime: 2 * 60 * 1000,
  });
}

export function useGetEligibleStudents() {
  return useQuery({
    queryKey: ['metopen-eligible-students'],
    queryFn: () => metopenService.getEligibleStudents(),
    staleTime: 5 * 60 * 1000,
  });
}

