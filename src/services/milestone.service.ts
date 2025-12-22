import { getApiUrl } from "@/config/api";
import { apiRequest } from "./auth.service";
import type {
  Milestone,
  MilestoneDetail,
  MilestoneTemplate,
  MilestoneLog,
  MilestoneProgress,
  TemplateCategory,
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
  MilestoneStatus,
} from "@/types/milestone.types";

// API Endpoints
const ENDPOINTS = {
  TEMPLATES: "/milestones/templates",
  TEMPLATE_CATEGORIES: "/milestones/templates/categories",
  THESIS_MILESTONES: (thesisId: string) => `/milestones/thesis/${thesisId}`,
  THESIS_PROGRESS: (thesisId: string) => `/milestones/thesis/${thesisId}/progress`,
  THESIS_LOGS: (thesisId: string) => `/milestones/thesis/${thesisId}/logs`,
  FROM_TEMPLATES: (thesisId: string) => `/milestones/thesis/${thesisId}/from-templates`,
  REORDER: (thesisId: string) => `/milestones/thesis/${thesisId}/reorder`,
  MILESTONE_DETAIL: (milestoneId: string) => `/milestones/${milestoneId}`,
  MILESTONE_LOGS: (milestoneId: string) => `/milestones/${milestoneId}/logs`,
  MILESTONE_STATUS: (milestoneId: string) => `/milestones/${milestoneId}/status`,
  MILESTONE_PROGRESS: (milestoneId: string) => `/milestones/${milestoneId}/progress`,
  SUBMIT_REVIEW: (milestoneId: string) => `/milestones/${milestoneId}/submit-review`,
  VALIDATE: (milestoneId: string) => `/milestones/${milestoneId}/validate`,
  REQUEST_REVISION: (milestoneId: string) => `/milestones/${milestoneId}/request-revision`,
  FEEDBACK: (milestoneId: string) => `/milestones/${milestoneId}/feedback`,
};

// ============================================
// Template Services
// ============================================

/**
 * Get all milestone templates
 */
export async function getTemplates(category?: string): Promise<MilestoneTemplate[]> {
  const url = new URL(getApiUrl(ENDPOINTS.TEMPLATES));
  if (category) {
    url.searchParams.set("category", category);
  }

  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil template milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get template categories
 */
export async function getTemplateCategories(): Promise<TemplateCategory[]> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TEMPLATE_CATEGORIES));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil kategori template");
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// Milestone CRUD Services
// ============================================

/**
 * Get all milestones for a thesis
 */
export async function getMilestones(
  thesisId: string,
  status?: MilestoneStatus
): Promise<{ milestones: Milestone[]; progress: MilestoneProgress }> {
  const url = new URL(getApiUrl(ENDPOINTS.THESIS_MILESTONES(thesisId)));
  if (status) {
    url.searchParams.set("status", status);
  }

  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil milestones");
  }

  const result = await response.json();
  return {
    milestones: result.data,
    progress: result.progress,
  };
}

/**
 * Get milestone detail
 */
export async function getMilestoneDetail(milestoneId: string): Promise<MilestoneDetail> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.MILESTONE_DETAIL(milestoneId)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil detail milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create new milestone
 */
export async function createMilestone(
  thesisId: string,
  data: CreateMilestoneDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.THESIS_MILESTONES(thesisId)), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal membuat milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create milestones from templates
 */
export async function createFromTemplates(
  thesisId: string,
  data: CreateFromTemplatesDto
): Promise<Milestone[]> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.FROM_TEMPLATES(thesisId)), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal membuat milestone dari template");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update milestone
 */
export async function updateMilestone(
  milestoneId: string,
  data: UpdateMilestoneDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.MILESTONE_DETAIL(milestoneId)), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal memperbarui milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete milestone
 */
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.MILESTONE_DETAIL(milestoneId)), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus milestone");
  }
}

// ============================================
// Status Management Services
// ============================================

/**
 * Update milestone status
 */
export async function updateMilestoneStatus(
  milestoneId: string,
  data: UpdateStatusDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.MILESTONE_STATUS(milestoneId)), {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengubah status milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update milestone progress
 */
export async function updateMilestoneProgress(
  milestoneId: string,
  data: UpdateProgressDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.MILESTONE_PROGRESS(milestoneId)), {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengubah progress milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Submit milestone for review
 */
export async function submitForReview(
  milestoneId: string,
  data?: SubmitForReviewDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.SUBMIT_REVIEW(milestoneId)), {
    method: "POST",
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengajukan review milestone");
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// Supervisor Action Services
// ============================================

/**
 * Validate/approve milestone (supervisor only)
 */
export async function validateMilestone(
  milestoneId: string,
  data?: ValidateMilestoneDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.VALIDATE(milestoneId)), {
    method: "POST",
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal memvalidasi milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Request revision on milestone (supervisor only)
 */
export async function requestRevision(
  milestoneId: string,
  data: RequestRevisionDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.REQUEST_REVISION(milestoneId)), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal meminta revisi milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Add supervisor feedback (supervisor only)
 */
export async function addFeedback(
  milestoneId: string,
  data: AddFeedbackDto
): Promise<Milestone> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.FEEDBACK(milestoneId)), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menambahkan feedback");
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// Progress & Log Services
// ============================================

/**
 * Get thesis milestone progress
 */
export async function getThesisProgress(thesisId: string): Promise<MilestoneProgress> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.THESIS_PROGRESS(thesisId)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil progress thesis");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get milestone activity logs
 */
export async function getMilestoneLogs(
  milestoneId: string,
  limit?: number
): Promise<MilestoneLog[]> {
  const url = new URL(getApiUrl(ENDPOINTS.MILESTONE_LOGS(milestoneId)));
  if (limit) {
    url.searchParams.set("limit", String(limit));
  }

  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil log aktivitas milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get all milestone logs for thesis
 */
export async function getThesisMilestoneLogs(
  thesisId: string,
  limit?: number
): Promise<MilestoneLog[]> {
  const url = new URL(getApiUrl(ENDPOINTS.THESIS_LOGS(thesisId)));
  if (limit) {
    url.searchParams.set("limit", String(limit));
  }

  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil log aktivitas thesis");
  }

  const result = await response.json();
  return result.data;
}

// ============================================
// Reorder Service
// ============================================

/**
 * Reorder milestones
 */
export async function reorderMilestones(
  thesisId: string,
  data: ReorderMilestonesDto
): Promise<void> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.REORDER(thesisId)), {
    method: "PUT",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengubah urutan milestone");
  }
}
