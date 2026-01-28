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
  CreateTemplateDto,
  UpdateTemplateDto,
  UpdateStatusDto,
  UpdateProgressDto,
  SubmitForReviewDto,
  ValidateMilestoneDto,
  RequestRevisionDto,
  AddFeedbackDto,
  ReorderMilestonesDto,
  MilestoneStatus,
  PendingMilestoneItem,
  StudentCompletionStatus,
  ThesisCompletionCheck,
  BulkValidateDto,
  BulkValidateResult,
  SeminarReadinessStatus,
  SeminarReadinessApprovalResult,
  StudentReadyForSeminar,
  SeminarReadinessNotesDto,
} from "@/types/milestone.types";

// API Endpoints
const ENDPOINTS = {
  TEMPLATES: "/milestones/templates",
  TEMPLATE_CATEGORIES: "/milestones/templates/categories",
  THESIS_MILESTONES: (thesisId: string) => `/milestones/thesis/${thesisId}`,
  THESIS_PROGRESS: (thesisId: string) => `/milestones/thesis/${thesisId}/progress`,
  THESIS_LOGS: (thesisId: string) => `/milestones/thesis/${thesisId}/logs`,
  THESIS_COMPLETION: (thesisId: string) => `/milestones/thesis/${thesisId}/completion`,
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
  TEMPLATE_DETAIL: (templateId: string) => `/milestones/templates/${templateId}`,
  // Lecturer Dashboard Endpoints
  LECTURER_PENDING: "/milestones/lecturer/pending",
  LECTURER_COMPLETION_STATUS: "/milestones/lecturer/completion-status",
  LECTURER_BULK_VALIDATE: "/milestones/lecturer/bulk-validate",
  // Seminar Readiness Endpoints
  READY_FOR_SEMINAR: "/milestones/ready-for-seminar",
  SEMINAR_READINESS: (thesisId: string) => `/milestones/thesis/${thesisId}/seminar-readiness`,
  SEMINAR_READINESS_APPROVE: (thesisId: string) => `/milestones/thesis/${thesisId}/seminar-readiness/approve`,
  SEMINAR_READINESS_REVOKE: (thesisId: string) => `/milestones/thesis/${thesisId}/seminar-readiness/revoke`,
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

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: string): Promise<MilestoneTemplate> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(templateId)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil detail template");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create milestone template (Sekretaris Departemen)
 */
export async function createTemplate(data: CreateTemplateDto): Promise<MilestoneTemplate> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TEMPLATES), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal membuat template milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update milestone template (Sekretaris Departemen)
 */
export async function updateTemplate(
  templateId: string,
  data: UpdateTemplateDto
): Promise<MilestoneTemplate> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(templateId)), {
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal memperbarui template milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Delete milestone template (Sekretaris Departemen)
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.TEMPLATE_DETAIL(templateId)), {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menghapus template milestone");
  }
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
    method: "PATCH",
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
    method: "PATCH",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengubah urutan milestone");
  }
}

// ============================================
// Lecturer Dashboard Services (Thesis Completion)
// ============================================

export interface GetPendingMilestonesOptions {
  status?: MilestoneStatus;
  limit?: number;
  offset?: number;
}

/**
 * Get pending milestones for lecturer dashboard
 */
export async function getPendingMilestonesForLecturer(
  options: GetPendingMilestonesOptions = {}
): Promise<{ milestones: PendingMilestoneItem[]; count: number }> {
  const url = new URL(getApiUrl(ENDPOINTS.LECTURER_PENDING));
  if (options.status) {
    url.searchParams.set("status", options.status);
  }
  if (options.limit) {
    url.searchParams.set("limit", String(options.limit));
  }
  if (options.offset) {
    url.searchParams.set("offset", String(options.offset));
  }

  const response = await apiRequest(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil milestone pending");
  }

  const result = await response.json();
  return {
    milestones: result.data,
    count: result.count,
  };
}

/**
 * Get thesis completion status for all supervised students
 */
export async function getCompletionStatusForLecturer(): Promise<StudentCompletionStatus[]> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.LECTURER_COMPLETION_STATUS));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil status kelengkapan thesis");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Bulk validate milestones
 */
export async function bulkValidateMilestones(
  data: BulkValidateDto
): Promise<BulkValidateResult> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.LECTURER_BULK_VALIDATE), {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal memvalidasi milestone");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Check thesis completion status
 */
export async function checkThesisCompletion(thesisId: string): Promise<ThesisCompletionCheck> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.THESIS_COMPLETION(thesisId)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengecek kelengkapan thesis");
  }

  const result = await response.json();
  return result.data;
}

// ============================================================================
// SEMINAR READINESS FUNCTIONS
// ============================================================================

/**
 * Get seminar readiness status for a thesis
 */
export async function getSeminarReadinessStatus(thesisId: string): Promise<SeminarReadinessStatus> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.SEMINAR_READINESS(thesisId)));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil status kesiapan seminar");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Approve seminar readiness for a thesis
 */
export async function approveSeminarReadiness(
  thesisId: string,
  data?: SeminarReadinessNotesDto
): Promise<SeminarReadinessApprovalResult> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.SEMINAR_READINESS_APPROVE(thesisId)), {
    method: "POST",
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal menyetujui kesiapan seminar");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Revoke seminar readiness approval for a thesis
 */
export async function revokeSeminarReadiness(
  thesisId: string,
  data?: SeminarReadinessNotesDto
): Promise<SeminarReadinessApprovalResult> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.SEMINAR_READINESS_REVOKE(thesisId)), {
    method: "POST",
    body: JSON.stringify(data || {}),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mencabut persetujuan kesiapan seminar");
  }

  const result = await response.json();
  return result.data;
}

/**
 * Get list of students ready for seminar (both supervisors approved)
 */
export async function getStudentsReadyForSeminar(): Promise<StudentReadyForSeminar[]> {
  const response = await apiRequest(getApiUrl(ENDPOINTS.READY_FOR_SEMINAR));
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Gagal mengambil daftar mahasiswa siap seminar");
  }

  const result = await response.json();
  return result.data;
}
