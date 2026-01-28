import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as milestoneService from "@/services/milestone.service";
import type {
  MilestoneStatus,
  CreateMilestoneDto,
  UpdateMilestoneDto,
  CreateFromTemplatesDto,
  UpdateStatusDto,
  UpdateProgressDto,
  SubmitForReviewDto,
  ValidateMilestoneDto,
  RequestRevisionDto,
  AddFeedbackDto,
  ReorderMilestonesDto,
  CreateTemplateDto,
  UpdateTemplateDto,
} from "@/types/milestone.types";

// Query Keys
export const milestoneKeys = {
  all: ["milestones"] as const,
  templates: () => [...milestoneKeys.all, "templates"] as const,
  template: (templateId: string) => [...milestoneKeys.templates(), templateId] as const,
  templateCategories: () => [...milestoneKeys.templates(), "categories"] as const,
  thesis: (thesisId: string) => [...milestoneKeys.all, "thesis", thesisId] as const,
  thesisMilestones: (thesisId: string, status?: MilestoneStatus) =>
    [...milestoneKeys.thesis(thesisId), { status }] as const,
  thesisProgress: (thesisId: string) => [...milestoneKeys.thesis(thesisId), "progress"] as const,
  thesisLogs: (thesisId: string) => [...milestoneKeys.thesis(thesisId), "logs"] as const,
  detail: (milestoneId: string) => [...milestoneKeys.all, "detail", milestoneId] as const,
  logs: (milestoneId: string) => [...milestoneKeys.all, "logs", milestoneId] as const,
};

// ============================================
// Template Hooks
// ============================================

/**
 * Hook to fetch milestone templates
 */
export function useTemplates(category?: string) {
  return useQuery({
    queryKey: [...milestoneKeys.templates(), { category }],
    queryFn: () => milestoneService.getTemplates(category),
  });
}

/**
 * Hook to fetch template categories
 */
export function useTemplateCategories() {
  return useQuery({
    queryKey: milestoneKeys.templateCategories(),
    queryFn: milestoneService.getTemplateCategories,
  });
}

/**
 * Hook to fetch single template
 */
export function useTemplate(templateId?: string) {
  return useQuery({
    queryKey: templateId ? milestoneKeys.template(templateId) : milestoneKeys.template(""),
    queryFn: () => milestoneService.getTemplateById(templateId!),
    enabled: !!templateId,
  });
}

/**
 * Hook for creating a milestone template
 */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTemplateDto) => milestoneService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templates() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templateCategories() });
      toast.success("Template milestone berhasil dibuat");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat template milestone");
    },
  });
}

/**
 * Hook for updating a milestone template
 */
export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      templateId,
      data,
    }: {
      templateId: string;
      data: UpdateTemplateDto;
    }) => milestoneService.updateTemplate(templateId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templates() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.template(variables.templateId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templateCategories() });
      toast.success("Template milestone berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui template milestone");
    },
  });
}

/**
 * Hook for deleting a milestone template
 */
export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => milestoneService.deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templates() });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.templateCategories() });
      toast.success("Template milestone berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus template milestone");
    },
  });
}

// ============================================
// Milestone Query Hooks
// ============================================

/**
 * Hook to fetch milestones for a thesis
 */
export function useMilestones(thesisId: string, status?: MilestoneStatus) {
  return useQuery({
    queryKey: milestoneKeys.thesisMilestones(thesisId, status),
    queryFn: () => milestoneService.getMilestones(thesisId, status),
    enabled: !!thesisId,
  });
}

/**
 * Hook to fetch milestone detail
 */
export function useMilestoneDetail(milestoneId: string) {
  return useQuery({
    queryKey: milestoneKeys.detail(milestoneId),
    queryFn: () => milestoneService.getMilestoneDetail(milestoneId),
    enabled: !!milestoneId,
  });
}

/**
 * Hook to fetch thesis progress
 */
export function useThesisProgress(thesisId: string) {
  return useQuery({
    queryKey: milestoneKeys.thesisProgress(thesisId),
    queryFn: () => milestoneService.getThesisProgress(thesisId),
    enabled: !!thesisId,
  });
}

/**
 * Hook to fetch milestone logs
 */
export function useMilestoneLogs(milestoneId: string, limit?: number) {
  return useQuery({
    queryKey: [...milestoneKeys.logs(milestoneId), { limit }],
    queryFn: () => milestoneService.getMilestoneLogs(milestoneId, limit),
    enabled: !!milestoneId,
  });
}

/**
 * Hook to fetch thesis milestone logs
 */
export function useThesisMilestoneLogs(thesisId: string, limit?: number) {
  return useQuery({
    queryKey: [...milestoneKeys.thesisLogs(thesisId), { limit }],
    queryFn: () => milestoneService.getThesisMilestoneLogs(thesisId, limit),
    enabled: !!thesisId,
  });
}

// ============================================
// Milestone Mutation Hooks
// ============================================

/**
 * Hook for creating a milestone
 */
export function useCreateMilestone(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMilestoneDto) => milestoneService.createMilestone(thesisId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      toast.success("Milestone berhasil dibuat");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat milestone");
    },
  });
}

/**
 * Hook for creating milestones from templates
 */
export function useCreateFromTemplates(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFromTemplatesDto) =>
      milestoneService.createFromTemplates(thesisId, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      toast.success(`${data.length} milestone berhasil dibuat dari template`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal membuat milestone dari template");
    },
  });
}

/**
 * Hook for updating a milestone
 */
export function useUpdateMilestone(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: UpdateMilestoneDto }) =>
      milestoneService.updateMilestone(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Milestone berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memperbarui milestone");
    },
  });
}

/**
 * Hook for deleting a milestone
 */
export function useDeleteMilestone(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (milestoneId: string) => milestoneService.deleteMilestone(milestoneId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      toast.success("Milestone berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menghapus milestone");
    },
  });
}

// ============================================
// Status Mutation Hooks
// ============================================

/**
 * Hook for updating milestone status
 */
export function useUpdateStatus(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, data }: { milestoneId: string; data: UpdateStatusDto }) =>
      milestoneService.updateMilestoneStatus(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Status milestone berhasil diubah");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengubah status milestone");
    },
  });
}

/**
 * Hook for updating milestone progress
 */
export function useUpdateProgress(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: UpdateProgressDto;
    }) => milestoneService.updateMilestoneProgress(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengubah progress milestone");
    },
  });
}

/**
 * Hook for submitting milestone for review
 */
export function useSubmitForReview(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data?: SubmitForReviewDto;
    }) => milestoneService.submitForReview(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Milestone berhasil diajukan untuk review");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengajukan review milestone");
    },
  });
}

// ============================================
// Supervisor Mutation Hooks
// ============================================

/**
 * Hook for validating a milestone (supervisor)
 */
export function useValidateMilestone(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data?: ValidateMilestoneDto;
    }) => milestoneService.validateMilestone(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Milestone berhasil divalidasi");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memvalidasi milestone");
    },
  });
}

/**
 * Hook for requesting revision (supervisor)
 */
export function useRequestRevision(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: RequestRevisionDto;
    }) => milestoneService.requestRevision(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Permintaan revisi berhasil dikirim");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal meminta revisi milestone");
    },
  });
}

/**
 * Hook for adding feedback (supervisor)
 */
export function useAddFeedback(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      milestoneId,
      data,
    }: {
      milestoneId: string;
      data: AddFeedbackDto;
    }) => milestoneService.addFeedback(milestoneId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      queryClient.invalidateQueries({ queryKey: milestoneKeys.detail(variables.milestoneId) });
      toast.success("Feedback berhasil ditambahkan");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menambahkan feedback");
    },
  });
}

// ============================================
// Reorder Hook
// ============================================

/**
 * Hook for reordering milestones
 */
export function useReorderMilestones(thesisId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderMilestonesDto) => milestoneService.reorderMilestones(thesisId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: milestoneKeys.thesis(thesisId) });
      toast.success("Urutan milestone berhasil diubah");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mengubah urutan milestone");
    },
  });
}

// ============================================
// Combined Hook for Milestone Management
// ============================================

/**
 * Combined hook for managing milestones
 */
export function useMilestoneManagement(thesisId: string) {
  const milestonesQuery = useMilestones(thesisId);
  const createMutation = useCreateMilestone(thesisId);
  const createFromTemplatesMutation = useCreateFromTemplates(thesisId);
  const updateMutation = useUpdateMilestone(thesisId);
  const deleteMutation = useDeleteMilestone(thesisId);
  const updateStatusMutation = useUpdateStatus(thesisId);
  const updateProgressMutation = useUpdateProgress(thesisId);
  const submitForReviewMutation = useSubmitForReview(thesisId);
  const validateMutation = useValidateMilestone(thesisId);
  const requestRevisionMutation = useRequestRevision(thesisId);
  const addFeedbackMutation = useAddFeedback(thesisId);
  const reorderMutation = useReorderMilestones(thesisId);

  return {
    // Query data
    milestones: milestonesQuery.data?.milestones ?? [],
    progress: milestonesQuery.data?.progress ?? null,
    isLoading: milestonesQuery.isLoading,
    isError: milestonesQuery.isError,
    error: milestonesQuery.error,
    refetch: milestonesQuery.refetch,

    // Mutations
    createMilestone: createMutation.mutate,
    createFromTemplates: createFromTemplatesMutation.mutate,
    updateMilestone: updateMutation.mutate,
    deleteMilestone: deleteMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    updateProgress: updateProgressMutation.mutate,
    submitForReview: submitForReviewMutation.mutate,
    validateMilestone: validateMutation.mutate,
    requestRevision: requestRevisionMutation.mutate,
    addFeedback: addFeedbackMutation.mutate,
    reorderMilestones: reorderMutation.mutate,

    // Mutation states
    isCreating: createMutation.isPending,
    isCreatingFromTemplates: createFromTemplatesMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
    isUpdatingProgress: updateProgressMutation.isPending,
    isSubmittingForReview: submitForReviewMutation.isPending,
    isValidating: validateMutation.isPending,
    isRequestingRevision: requestRevisionMutation.isPending,
    isAddingFeedback: addFeedbackMutation.isPending,
    isReordering: reorderMutation.isPending,
  };
}

// ============================================
// Lecturer Dashboard Hooks (Thesis Completion)
// ============================================

/**
 * Hook to fetch pending milestones for lecturer dashboard
 */
export function usePendingMilestonesForLecturer(
  options: milestoneService.GetPendingMilestonesOptions = {}
) {
  return useQuery({
    queryKey: [...milestoneKeys.all, "lecturer", "pending", options],
    queryFn: () => milestoneService.getPendingMilestonesForLecturer(options),
  });
}

/**
 * Hook to fetch completion status for all supervised students
 */
export function useCompletionStatusForLecturer() {
  return useQuery({
    queryKey: [...milestoneKeys.all, "lecturer", "completion-status"],
    queryFn: milestoneService.getCompletionStatusForLecturer,
  });
}

/**
 * Hook to check thesis completion status
 */
export function useThesisCompletion(thesisId?: string) {
  return useQuery({
    queryKey: [...milestoneKeys.all, "thesis-completion", thesisId],
    queryFn: () => milestoneService.checkThesisCompletion(thesisId!),
    enabled: !!thesisId,
  });
}

/**
 * Hook for bulk validating milestones
 */
export function useBulkValidateMilestones() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: milestoneService.bulkValidateMilestones,
    onSuccess: (data) => {
      // Invalidate all milestone queries to refresh data
      queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
      toast.success(`${data.validatedCount} milestone berhasil divalidasi`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal memvalidasi milestone");
    },
  });
}

/**
 * Combined hook for lecturer milestone dashboard
 */
export function useLecturerMilestoneDashboard() {
  const pendingQuery = usePendingMilestonesForLecturer();
  const completionStatusQuery = useCompletionStatusForLecturer();
  const bulkValidateMutation = useBulkValidateMilestones();

  return {
    // Pending milestones
    pendingMilestones: pendingQuery.data?.milestones ?? [],
    pendingCount: pendingQuery.data?.count ?? 0,
    isPendingLoading: pendingQuery.isLoading,
    isPendingError: pendingQuery.isError,
    pendingError: pendingQuery.error,
    refetchPending: pendingQuery.refetch,

    // Completion status
    completionStatus: completionStatusQuery.data ?? [],
    isCompletionStatusLoading: completionStatusQuery.isLoading,
    isCompletionStatusError: completionStatusQuery.isError,
    completionStatusError: completionStatusQuery.error,
    refetchCompletionStatus: completionStatusQuery.refetch,

    // Bulk validate
    bulkValidate: bulkValidateMutation.mutate,
    isBulkValidating: bulkValidateMutation.isPending,
    bulkValidateResult: bulkValidateMutation.data,
  };
}

// ============================================
// Seminar Readiness Hooks
// ============================================

/**
 * Hook to fetch seminar readiness status for a thesis
 */
export function useSeminarReadinessStatus(thesisId?: string) {
  return useQuery({
    queryKey: [...milestoneKeys.all, "seminar-readiness", thesisId],
    queryFn: () => milestoneService.getSeminarReadinessStatus(thesisId!),
    enabled: !!thesisId,
  });
}

/**
 * Hook to fetch students ready for seminar
 */
export function useStudentsReadyForSeminar() {
  return useQuery({
    queryKey: [...milestoneKeys.all, "ready-for-seminar"],
    queryFn: milestoneService.getStudentsReadyForSeminar,
  });
}

/**
 * Hook for approving seminar readiness
 */
export function useApproveSeminarReadiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, notes }: { thesisId: string; notes?: string }) =>
      milestoneService.approveSeminarReadiness(thesisId, notes ? { notes } : undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "seminar-readiness", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "ready-for-seminar"],
      });
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "lecturer-completion-status"],
      });
      toast.success("Kesiapan seminar berhasil disetujui");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal menyetujui kesiapan seminar");
    },
  });
}

/**
 * Hook for revoking seminar readiness approval
 */
export function useRevokeSeminarReadiness() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ thesisId, notes }: { thesisId: string; notes?: string }) =>
      milestoneService.revokeSeminarReadiness(thesisId, notes ? { notes } : undefined),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "seminar-readiness", variables.thesisId],
      });
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "ready-for-seminar"],
      });
      queryClient.invalidateQueries({
        queryKey: [...milestoneKeys.all, "lecturer-completion-status"],
      });
      toast.success("Persetujuan kesiapan seminar berhasil dicabut");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mencabut persetujuan kesiapan seminar");
    },
  });
}

/**
 * Combined hook for seminar readiness management
 */
export function useSeminarReadinessManagement(thesisId?: string) {
  const statusQuery = useSeminarReadinessStatus(thesisId);
  const approveMutation = useApproveSeminarReadiness();
  const revokeMutation = useRevokeSeminarReadiness();

  return {
    // Status
    readinessStatus: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    error: statusQuery.error,
    refetch: statusQuery.refetch,

    // Approve
    approve: (notes?: string) => {
      if (thesisId) {
        approveMutation.mutate({ thesisId, notes });
      }
    },
    isApproving: approveMutation.isPending,

    // Revoke
    revoke: (notes?: string) => {
      if (thesisId) {
        revokeMutation.mutate({ thesisId, notes });
      }
    },
    isRevoking: revokeMutation.isPending,
  };
}
