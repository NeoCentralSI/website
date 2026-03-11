// ==================== Metopen Milestone Types ====================

export type MetopenMilestoneStatus = 'not_started' | 'in_progress' | 'pending_review' | 'revision_needed' | 'completed';

export interface MetopenTemplateAttachment {
  id: string;
  templateId: string;
  documentId: string;
  document?: {
    id: string;
    fileName: string | null;
    filePath: string | null;
    fileSize: number | null;
    mimeType: string | null;
    description: string | null;
    createdAt: string;
  };
}

export interface MetopenTemplate {
  id: string;
  name: string;
  description: string | null;
  topicId: string | null;
  phase: 'metopen';
  orderIndex: number;
  isActive: boolean;
  defaultDueDays: number | null;
  weightPercentage: number | null;
  isGateToAdvisorSearch: boolean;
  meetingLink?: string | null;
  createdAt: string;
  updatedAt: string;
  topic?: {
    id: string;
    name: string;
  } | null;
  templateCriterias?: TemplateCriteria[];
  attachments?: MetopenTemplateAttachment[];
}

export interface TemplateCriteria {
  milestoneTemplateId: string;
  assessmentCriteriaId: string;
  weightPercentage: number | null;
  assessmentCriteria?: {
    id: string;
    code: string;
    name: string;
    assessmentRubrics?: AssessmentRubric[];
  };
}

export interface AssessmentRubric {
  id: string;
  code: string;
  description: string;
  minScore: number;
  maxScore: number;
}


export interface MetopenTask {
  id: string;
  thesisId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  targetDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: MetopenMilestoneStatus;
  progressPercentage: number;
  studentNotes: string | null;
  supervisorNotes: string | null;
  feedback: string | null;
  submittedAt: string | null;
  assessedBy: string | null;
  assessedAt: string | null;
  totalScore: number | null;
  isLate: boolean;
  milestoneTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
  milestoneTemplate?: MetopenTemplate | null;
  milestoneDocuments?: MetopenDocument[];
  assessor?: {
    id: string;
    fullName: string;
  } | null;
  assessmentDetails?: MetopenAssessmentDetail[];
  thesis?: {
    id: string;
    student?: {
      id: string;
      user?: {
        id: string;
        fullName: string;
        identityNumber: string;
      };
    };
  };
}

export interface MetopenDocument {
  id: string;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  version: number;
  isLatest: boolean;
  createdAt: string;
}

export interface MetopenAssessmentDetail {
  id: string;
  milestoneId: string;
  lecturerId: string;
  rubricId: string;
  score: number;
  notes: string | null;
  assessedAt: string;
  rubric?: AssessmentRubric;
  lecturer?: {
    user?: {
      fullName: string;
    };
  };
}

// ==================== DTOs ====================

export interface CreateTemplateDto {
  name: string;
  description?: string;
  topicId?: string;
  orderIndex?: number;
  isActive?: boolean;
  defaultDueDays?: number;
  weightPercentage?: number;
  isGateToAdvisorSearch?: boolean;
}

export type UpdateTemplateDto = Partial<CreateTemplateDto>;

export interface ReorderTemplatesDto {
  orders: Array<{
    id: string;
    orderIndex: number;
  }>;
}

export interface PublishTasksDto {
  startDate?: string;
  templateDeadlines?: Record<string, string>; // { templateId: ISOdate }
  studentIds?: string[];
  templateIds?: string[];
  classId?: string;
}

export interface PublishTasksResponse {
  assignedCount: number;
  tasksPerStudent: number;
  totalCreated: number;
}

export interface SubmitTaskDto {
  notes?: string;
  files?: File[];
}

export interface GradeDto {
  status: "completed" | "revision_needed";
  score?: number | null;
  feedback?: string;
  rubricId?: string | null;
}

// ==================== Response Types ====================

export interface MyTasksResponse {
  thesisId?: string;
  tasks: MetopenTask[];
  progress: number;
  gateOpen: boolean;
}

export interface ProgressResponse {
  progress: number;
  totalTasks: number;
  completedTasks: number;
  gateOpen: boolean;
  milestones: Array<{
    id: string;
    title: string;
    status: MetopenMilestoneStatus;
    weight: number;
    isGate: boolean;
  }>;
}

export interface GateStatusResponse {
  gateOpen: boolean;
  reason?: string;
  gates?: Array<{
    id: string;
    title: string;
    templateName: string;
    status: MetopenMilestoneStatus;
    isCompleted: boolean;
  }>;
}

export interface GradingQueueItem extends MetopenTask {
  studentName?: string;
  studentNim?: string;
  templateName?: string;
  metopenClassId?: string | null;
  className?: string;
}

export interface MonitoringSummaryResponse {
  overview: {
    totalStudents: number;
    gateOpenCount: number;
    gateOpenPercentage: number;
    stuckCount: number;
  };
  students: Array<{
    thesisId: string;
    studentId: string;
    studentName: string;
    studentNim: string;
    progress: number;
    gateOpen: boolean;
    totalTasks: number;
    completedTasks: number;
    pendingReview: number;
  }>;
}

export interface EligibleStudent {
  thesisId: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  topicId: string | null;
  className?: string;
  classId?: string | null;
}

// ==================== Academic Year Types ====================

export interface AcademicYear {
  id: string;
  year: string;
  semester: 'ganjil' | 'genap';
  isActive: boolean;
}

export interface AutoSyncResult {
  classId: string;
  className: string;
  totalStudents: number;
  newEnrollments: number;
  syncedAt: string;
}

// ==================== Metopen Class Types ====================

export interface MetopenClass {
  id: string;
  name: string;
  academicYearId: string;
  lecturerId: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  academicYear?: { semester: string; year: string; isActive: boolean };
  lecturer?: { user?: { fullName: string; identityNumber?: string } };
  _count?: { enrollments: number; milestones: number };
  enrollments?: MetopenClassEnrollment[];
}

export interface MetopenClassEnrollment {
  classId: string;
  studentId: string;
  enrolledAt: string;
  student?: {
    id: string;
    user?: { fullName: string; identityNumber: string };
    thesis?: Array<{ id: string; title: string | null }>;
  };
}

export interface CreateClassDto {
  name: string;
  description?: string;
  academicYearId?: string;
}

export type UpdateClassDto = Partial<CreateClassDto> & { isActive?: boolean };

export interface PublishToClassDto {
  templateIds: string[];
  templateDeadlines?: Record<string, string>;
}

export interface PublishToClassResponse {
  assignedCount: number;
  templatesPublished: number;
  totalCreated: number;
}

export interface ClassTaskGroup {
  template: {
    id: string;
    name: string;
    description: string | null;
    orderIndex: number;
    weightPercentage: number | null;
    isGateToAdvisorSearch: boolean;
  };
  deadline: string | null;
  submissions: ClassTaskSubmission[];
}

export interface ClassTaskSubmission {
  milestoneId: string;
  studentId: string;
  studentName: string;
  studentNim: string;
  status: MetopenMilestoneStatus;
  submittedAt: string | null;
  totalScore: number | null;
  isLate: boolean;
}

// ==================== Publish Stats Types ====================

export interface PublishStatStudent {
  studentId: string;
  studentName: string;
  studentNim: string;
  status: MetopenMilestoneStatus;
  submittedAt: string | null;
  isLate: boolean;
  targetDate: string | null;
}

export interface PublishStatItem {
  templateId: string;
  classId: string;
  className: string;
  deadline: string | null;
  total: number;
  submitted: number;
  completed: number;
  late: number;
  notStarted: number;
  inProgress: number;
  pendingReview: number;
  students: PublishStatStudent[];
}

// ==================== Status Display Config ====================

export const METOPEN_STATUS_CONFIG: Record<MetopenMilestoneStatus, { label: string; color: string; bgColor: string }> = {
  not_started: { label: 'Belum Dikerjakan', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  in_progress: { label: 'Sedang Dikerjakan', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  pending_review: { label: 'Menunggu Penilaian', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  revision_needed: { label: 'Perlu Revisi', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  completed: { label: 'Selesai Dinilai', color: 'text-green-600', bgColor: 'bg-green-100' },
};
