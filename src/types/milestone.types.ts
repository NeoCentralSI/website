// Milestone Status
export type MilestoneStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "revision_needed"
  | "completed";

// Milestone Template
export interface MilestoneTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Template Category
export interface TemplateCategory {
  name: string;
  count: number;
}

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
  _count?: {
    activityLogs: number;
  };
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
  activityLogs?: MilestoneLog[];
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

// Milestone Log
export interface MilestoneLog {
  id: string;
  milestoneId: string;
  action: string;
  previousStatus?: MilestoneStatus | null;
  newStatus?: MilestoneStatus | null;
  previousProgress?: number | null;
  newProgress?: number | null;
  notes?: string | null;
  performedBy: string;
  createdAt: string;
  milestone?: {
    id: string;
    title: string;
  };
}

// Milestone Progress Summary
export interface MilestoneProgress {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  pendingReview: number;
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

export interface CategoriesResponse {
  success: boolean;
  data: TemplateCategory[];
}

export interface LogsResponse {
  success: boolean;
  data: MilestoneLog[];
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
  pending_review: {
    label: "Menunggu Review",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
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
