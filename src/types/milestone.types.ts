import type { ThesisPhase } from "@/lib/thesisLabels";
import { MILESTONE_STATUS_LABELS } from "@/lib/thesisLabels";
// Milestone Status
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "revision_needed"
  | "completed";

// Thesis Topic
export interface ThesisTopic {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

// Milestone Template
export interface MilestoneTemplate {
  id: string;
  name: string;
  description?: string | null;
  topicId?: string | null;
  topic?: ThesisTopic | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template Topic with Count
export interface TemplateTopic {
  id: string;
  name: string;
  count: number;
}

export interface CreateTemplateDto {
  name: string;
  description?: string | null;
  topicId?: string | null;
  orderIndex?: number;
  isActive?: boolean;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;

// Milestone
export interface Milestone {
  id: string;
  thesisId: string;
  /** Fase saat milestone dibuat (Proposal / Penelitian). */
  phase?: ThesisPhase;
  title: string;
  description?: string | null;
  orderIndex: number;
  targetDate?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  status: MilestoneStatus;
  progressPercentage: number;
  validatedBy?: string | null;
  validatedAt?: string | null;
  /** Catatan keputusan (setujui / minta revisi) dari Pembimbing 1. */
  supervisorNotes?: string | null;
  /** Feedback pembimbing, terpisah dari catatan keputusan. */
  feedback?: string | null;
  feedbackBy?: string | null;
  feedbackByName?: string | null;
  feedbackAt?: string | null;
  studentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  // Included relations
  guidances?: MilestoneGuidance[];
}

// Milestone with detail (includes thesis info)
export interface MilestoneDetail extends Milestone {
  thesis?: {
    id: string;
    title: string;
    studentId: string;
    student?: {
      user: {
        id: string;
        fullName: string;
        email: string;
      };
    };
  };
}

// Milestone Guidance (simplified)
export interface MilestoneGuidance {
  id: string;
  status: string;
  requestedDate: string;
  completedAt?: string | null;
  supervisor?: {
    user: {
      id: string;
      fullName: string;
      email: string;
    };
  };
}

// Milestone Progress Summary
export interface MilestoneProgress {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  revisionNeeded: number;
  averageProgress: number;
  percentComplete: number;
}

// Request DTOs
export interface CreateMilestoneDto {
  title: string;
  description?: string | null;
  targetDate?: string | null;
  orderIndex?: number;
  studentNotes?: string | null;
}

export interface UpdateMilestoneDto {
  title?: string;
  description?: string | null;
  targetDate?: string | null;
  orderIndex?: number;
  studentNotes?: string | null;
}

export interface CreateFromTemplatesDto {
  templateIds: string[];
  topicId?: string | null;
  startDate?: string | null;
}

export interface UpdateStatusDto {
  status: Exclude<MilestoneStatus, "completed">;
  notes?: string | null;
}

export interface UpdateProgressDto {
  progressPercentage: number;
}

export interface SubmitForReviewDto {
  studentNotes?: string | null;
}

export interface ValidateMilestoneDto {
  supervisorNotes?: string | null;
}

export interface RequestRevisionDto {
  revisionNotes: string;
}

export interface AddFeedbackDto {
  feedback: string;
}

export interface ReorderMilestonesDto {
  milestoneOrders: Array<{
    id: string;
    orderIndex: number;
  }>;
}

// API Response types
export interface MilestonesResponse {
  success: boolean;
  data: Milestone[];
  progress: MilestoneProgress;
}

export interface MilestoneResponse {
  success: boolean;
  data: Milestone | MilestoneDetail;
  message?: string;
}

export interface TemplatesResponse {
  success: boolean;
  data: MilestoneTemplate[];
}

export interface TopicsResponse {
  success: boolean;
  data: ThesisTopic[];
}

export interface TemplateTopicsResponse {
  success: boolean;
  data: TemplateTopic[];
}

export interface ProgressResponse {
  success: boolean;
  data: MilestoneProgress;
}

// Helper for status display (labels: single source in lib/thesisLabels)
export const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; color: string; bgColor: string }
> = {
  not_started: {
    label: MILESTONE_STATUS_LABELS.not_started,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  in_progress: {
    label: MILESTONE_STATUS_LABELS.in_progress,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  pending_review: {
    label: MILESTONE_STATUS_LABELS.pending_review,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  revision_needed: {
    label: MILESTONE_STATUS_LABELS.revision_needed,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  completed: {
    label: MILESTONE_STATUS_LABELS.completed,
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
};

// ============================================
// Lecturer Dashboard Types (Thesis Completion)
// ============================================

// Pending milestone item for lecturer dashboard
export interface PendingMilestoneItem {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  progressPercentage: number;
  studentNotes?: string | null;
  targetDate?: string;
  updatedAt: string;
  thesisId: string;
  thesisTitle: string;
  studentName: string;
  studentNim: string;
  activityCount?: number;
}

// Student supervisor info
export interface SupervisorInfo {
  id: string;
  name: string;
  role: string;
}

// Completion status for a student
export interface StudentCompletionStatus {
  thesisId: string;
  thesisTitle: string;
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
  };
  supervisors: SupervisorInfo[];
  progress: {
    total: number;
    completed: number;
    inProgress: number;
    pendingReview: number;
    revisionNeeded: number;
    notStarted: number;
    averageProgress: number;
    percentComplete: number;
    isComplete: boolean;
  };
  milestones: Array<{
    id: string;
    title: string;
    status: MilestoneStatus;
    progressPercentage: number;
    orderIndex: number;
    validatedAt?: string | null;
  }>;
}

// Thesis completion check result
export interface ThesisCompletionCheck {
  isComplete: boolean;
  total: number;
  completed: number;
  missing: Array<{
    id: string;
    title: string;
    status: MilestoneStatus;
  }>;
  message: string;
}

// Bulk validate DTOs
export interface BulkValidateDto {
  milestoneIds: string[];
  supervisorNotes?: string | null;
}

export interface BulkValidateResult {
  validated: number;
  failed: number;
  results: Array<{
    milestoneId: string;
    success: boolean;
    title?: string;
  }>;
  errors: Array<{
    milestoneId: string;
    success: boolean;
    error?: string;
  }>;
}

// Pending milestones response
export interface PendingMilestonesResponse {
  success: boolean;
  data: PendingMilestoneItem[];
  count: number;
}

// Completion status response
export interface CompletionStatusResponse {
  success: boolean;
  data: StudentCompletionStatus[];
}

// Thesis completion response
export interface ThesisCompletionResponse {
  success: boolean;
  data: ThesisCompletionCheck;
}

// ============================================
// Seminar Readiness Approval Types
// ============================================

/** One system requirement of seminar/defence readiness (computed by the backend). */
export interface ReadinessRequirement {
  key: string;
  label: string;
  met: boolean;
  detail: string;
}

/** Latest research-phase guidance attachment: what a supervisor reads as the draft. */
export interface ReadinessAttachment {
  guidanceId: string;
  fileName: string | null;
  filePath: string;
  uploadedAt: string | null;
}

export interface ReadinessSupervisor {
  id: string;
  name: string;
  email: string;
  role: string;
  hasApproved: boolean;
  /** When the supervisor last approved (audit log); null when unknown or not approved. */
  approvedAt?: string | null;
}

export interface ReadinessApproval {
  approvedBySupervisor1: boolean;
  approvedBySupervisor2: boolean;
  isFullyApproved: boolean;
}

/** Fields shared by seminar and defence readiness (the two cards are symmetric). */
export interface ReadinessStatusBase {
  thesisId: string;
  thesisTitle: string;
  thesisStatus: string | null;
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  requirements: ReadinessRequirement[];
  requirementsMet: boolean;
  supervisors: ReadinessSupervisor[];
  currentUserRole: string | null;
  currentUserHasApproved: boolean;
  latestGuidanceAttachment: ReadinessAttachment | null;
  /** Why "Minta Persetujuan" is disabled; null when the student may ask. */
  requestBlockedReason: string | null;
  /** Why "Setujui" is disabled; null when a supervisor may approve. */
  approveBlockedReason: string | null;
  /** Why "Batalkan Persetujuan" is disabled (e.g. the event is already passed). */
  revokeBlockedReason?: string | null;
  /** The seminar (or defence) is passed; the card is read-only. */
  isPassed?: boolean;
  passedAt?: string | null;
}

export interface SeminarReadinessStatus extends ReadinessStatusBase {
  milestoneProgress: {
    total: number;
    completed: number;
    percentComplete: number;
    isComplete: boolean;
  };
  guidanceProgress: {
    completed: number;
    required: number;
    isComplete: boolean;
  };
  seminarReadiness: ReadinessApproval;
  canRegisterSeminar: boolean;
}

export interface SeminarReadinessApprovalResult extends ReadinessApproval {
  thesisId: string;
  thesisTitle: string;
}

export interface StudentReadyForSeminar {
  thesisId: string;
  thesisTitle: string;
  student: {
    name: string;
    nim: string;
    email: string;
  };
  supervisors: Array<{
    name: string;
    role: string;
    seminarReady?: boolean;
  }>;
}

export interface SeminarReadinessNotesDto {
  notes?: string | null;
}

// Seminar readiness responses
export interface SeminarReadinessStatusResponse {
  success: boolean;
  data: SeminarReadinessStatus;
}

export interface SeminarReadinessApprovalResponse {
  success: boolean;
  message: string;
  data: SeminarReadinessApprovalResult;
}

export interface StudentsReadyForSeminarResponse {
  success: boolean;
  data: StudentReadyForSeminar[];
  count: number;
}

// ============================================
// Defence Readiness Approval Types
// ============================================

export interface DefenceReadinessStatus extends ReadinessStatusBase {
  defenceReadiness: ReadinessApproval;
  canRegisterDefence: boolean;
  /** Before the results seminar is passed the card only shows that requirement. */
  seminarPassed?: boolean;
}

export interface DefenceReadinessApprovalResult extends ReadinessApproval {
  thesisId: string;
  thesisTitle: string;
}

export interface StudentReadyForDefence {
  thesisId: string;
  thesisTitle: string;
  student: {
    name: string;
    nim: string;
    email: string;
  };
  supervisors: Array<{
    name: string;
    role: string;
    defenceReady?: boolean;
  }>;
}

export interface DefenceReadinessNotesDto {
  notes?: string | null;
}

/** Result of the student's "Minta Persetujuan" (seminar or defence). */
export interface ReadinessRequestResult {
  thesisId: string;
  notifiedSupervisors: number;
}

// Defence readiness responses
export interface DefenceReadinessStatusResponse {
  success: boolean;
  data: DefenceReadinessStatus;
}

export interface DefenceReadinessApprovalResponse {
  success: boolean;
  message: string;
  data: DefenceReadinessApprovalResult;
}

export interface StudentsReadyForDefenceResponse {
  success: boolean;
  data: StudentReadyForDefence[];
  count: number;
}
