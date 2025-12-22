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
} from "@/types/milestone.types";

// Query Keys
export const milestoneKeys = {
  all: ["milestones"] as const,
  templates: () => [...milestoneKeys.all, "templates"] as const,
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
