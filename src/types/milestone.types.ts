// Milestone Status
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
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
  supervisorNotes?: string | null;
  evidenceUrl?: string | null;
  evidenceDescription?: string | null;
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
  evidenceUrl?: string | null;
  evidenceDescription?: string | null;
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
  evidenceUrl?: string | null;
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

// Helper for status display
export const MILESTONE_STATUS_CONFIG: Record<
  MilestoneStatus,
  { label: string; color: string; bgColor: string }
> = {
  not_started: {
    label: "Belum Dimulai",
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
  in_progress: {
    label: "Sedang Dikerjakan",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  revision_needed: {
    label: "Perlu Revisi",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
  completed: {
    label: "Selesai",
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
  status: MilestoneStatus;
  progressPercentage: number;
  evidenceUrl?: string | null;
  studentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  thesis: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  activityCount: number;
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

export interface SeminarReadinessSupervisor {
  id: string;
  name: string;
  email: string;
  role: string;
  hasApproved: boolean | null;
}

export interface SeminarReadinessStatus {
  thesisId: string;
  thesisTitle: string;
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  milestoneProgress: {
    total: number;
    completed: number;
    percentComplete: number;
    isComplete: boolean;
  };
  seminarReadiness: {
    approvedBySupervisor1: boolean;
    approvedBySupervisor2: boolean;
    isFullyApproved: boolean;
    approvedAt: string | null;
    notes: string | null;
  };
  supervisors: SeminarReadinessSupervisor[];
  currentUserRole: string | null;
  currentUserHasApproved: boolean | null;
  canRegisterSeminar: boolean;
}

export interface SeminarReadinessApprovalResult {
  thesisId: string;
  thesisTitle: string;
  approvedBySupervisor1: boolean;
  approvedBySupervisor2: boolean;
  isFullyApproved: boolean;
  approvedAt: string | null;
  notes: string | null;
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
  }>;
  approvedAt: string;
  notes: string | null;
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

export interface DefenceReadinessSupervisor {
  id: string;
  name: string;
  email: string;
  role: string;
  hasApproved: boolean | null;
}

export interface DefenceReadinessStatus {
  thesisId: string;
  thesisTitle: string;
  student: {
    id: string;
    userId: string;
    name: string;
    nim: string;
    email: string;
  };
  thesisStatus: {
    id: string;
    name: string;
    isEligible: boolean;
  };
  finalDocument: {
    id: string;
    fileName: string;
    filePath: string;
    uploadedAt: string;
  } | null;
  defenceReadiness: {
    hasRequestedDefence: boolean;
    requestedAt: string | null;
    approvedBySupervisor1: boolean;
    approvedBySupervisor2: boolean;
    isFullyApproved: boolean;
    approvedAt: string | null;
    notes: string | null;
  };
  supervisors: DefenceReadinessSupervisor[];
  currentUserRole: string | null;
  currentUserHasApproved: boolean | null;
  canRegisterDefence: boolean;
}

export interface DefenceReadinessApprovalResult {
  thesisId: string;
  thesisTitle: string;
  approvedBySupervisor1: boolean;
  approvedBySupervisor2: boolean;
  isFullyApproved: boolean;
  approvedAt: string | null;
  notes: string | null;
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
  }>;
  finalDocument: {
    fileName: string;
    filePath: string;
  } | null;
  approvedAt: string;
  notes: string | null;
}

export interface DefenceReadinessNotesDto {
  notes?: string | null;
}

export interface RequestDefenceDto {
  documentId: string;
}

export interface RequestDefenceResult {
  thesisId: string;
  thesisTitle: string;
  finalDocument: {
    id: string;
    fileName: string;
    filePath: string;
  };
  requestedAt: string;
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

export interface RequestDefenceResponse {
  success: boolean;
  message: string;
  data: RequestDefenceResult;
}
