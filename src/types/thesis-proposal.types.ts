import type {
  AssignmentBatchStatus,
  ChangeRequestViewStatus,
  ResearchMethodResult,
  SupervisionLoadLevel,
  SupervisorRequestRoute,
  SupervisorRequestStatus,
  ThesisLifecycleStatus,
} from '@/lib/thesisLabels';
import type { ThesisChangeRequestRow } from '@/types/thesis-change-request.types';

export type ResearchPermitStatus = 'approved' | 'in_process' | 'not_approved';

export interface AcademicYearRef {
  id: string;
  semester?: string;
  year?: string;
  isActive?: boolean;
  label: string;
}

export interface PersonRef {
  id: string;
  fullName: string | null;
  identityNumber?: string | null;
  avatarUrl?: string | null;
  scienceGroup?: { id: string; name: string } | null;
}

export interface TopicRef {
  id: string;
  name: string;
  scienceGroupId?: string | null;
  scienceGroup?: { id: string; name: string } | null;
}

export interface SupervisorRequest {
  id: string;
  status: SupervisorRequestStatus;
  route: SupervisorRequestRoute;
  createdAt: string;
  updatedAt: string;
  academicYear: AcademicYearRef | null;
  isCurrentPeriod: boolean | null;
  student: PersonRef | null;
  topic: TopicRef | null;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  problemStatement: string | null;
  proposedSolution: string | null;
  researchObject: string | null;
  researchPermitStatus: ResearchPermitStatus | null;
  studentJustification: string | null;
  lecturer: PersonRef | null;
  redirectTarget: PersonRef | null;
  /** The lecturer who supervises when the request is accepted (redirect target first). */
  supervisor: PersonRef | null;
  lecturerApprovalNote: string | null;
  lecturerOverquotaReason: string | null;
  lecturerRespondedAt: string | null;
  rejectionReason: string | null;
  forwardedToKadepAt: string | null;
  forwardedBy: PersonRef | null;
  kadepNotes: string | null;
  reviewedAt: string | null;
  reviewer: { id: string; fullName: string } | null;
  withdrawnAt: string | null;
  withdrawCount: number;
  acceptedOverNormal: boolean;
  thesis: { id: string; title: string | null; status: ThesisLifecycleStatus; supervisorAssignedAt: string | null } | null;
  /** When the student may pull a waiting request back (72 hours after it was sent). */
  withdrawAvailableAt: string | null;
}

export interface SupervisorLoad {
  activeCount: number;
  softLimit: number;
  hardLimit: number;
  limitSource?: 'period' | 'general' | 'default';
  level: SupervisionLoadLevel;
}

export interface SubmissionState {
  academicYear: AcademicYearRef | null;
  eligibleResearchMethod: boolean | null;
  eligibilitySource: 'sia' | 'devtools' | null;
  eligibilityCapturedAt: string | null;
  canSubmit: boolean;
  blockedReason: string | null;
  revisionRequested: boolean;
  activeRequestId: string | null;
}

export interface SupervisorRequestDraft {
  lecturerId: string | null;
  topicId: string | null;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  problemStatement: string | null;
  proposedSolution: string | null;
  researchObject: string | null;
  researchPermitStatus: ResearchPermitStatus | null;
  studentJustification: string | null;
  topic: TopicRef | null;
  lecturer: PersonRef | null;
  lastSubmittedAt: string | null;
  updatedAt: string;
}

export interface StudentSupervisorRequests {
  submission: SubmissionState;
  requests: SupervisorRequest[];
  activeRequest: SupervisorRequest | null;
  draft: SupervisorRequestDraft | null;
}

export type SupervisorRequestInput = Partial<Omit<SupervisorRequestDraft, 'topic' | 'lecturer' | 'lastSubmittedAt' | 'updatedAt'>>;

export interface CatalogLecturer extends SupervisorLoad {
  lecturerId: string;
  fullName: string | null;
  identityNumber: string | null;
  avatarUrl: string | null;
  scienceGroup: { id: string; name: string } | null;
  acceptingRequests: boolean;
  supervisedTopics: string[];
  /** The topics the lecturer offers (published). */
  offeredTopics?: string[];
}

export interface CandidateLecturer extends CatalogLecturer {
  remaining: number;
  sameTopicCount: number;
  score: number;
}

export interface LecturerInbox {
  academicYear: AcademicYearRef;
  load: SupervisorLoad & { acceptingRequests: boolean };
  waiting: SupervisorRequest[];
  history: SupervisorRequest[];
}

/** A row of Tugas Akhir > Permohonan, the lecturer's approval inbox. */
export type LecturerApprovalRow =
  | { kind: 'supervisor_request'; id: string; viewStatus: SupervisorRequestStatus; createdAt: string; supervisorRequest: SupervisorRequest }
  | { kind: 'change_request'; id: string; viewStatus: ChangeRequestViewStatus; createdAt: string; changeRequest: ThesisChangeRequestRow }
  // A student asks the lecturer to be Pembimbing 2; always "Menunggu Persetujuan Anda".
  | { kind: 'supervisor2_request'; id: string; viewStatus: 'awaiting_me'; createdAt: string; supervisor2Request: Supervisor2InboxItem };

export interface Supervisor2InboxItem {
  requestId: string;
  thesisId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string | null;
  studentNim: string | null;
  thesisTitle: string;
  requestedAt: string;
  /** What the student proposed (the accepted Pengajuan Pembimbing of the thesis). */
  supervisorRequest?: SupervisorRequest | null;
}

/**
 * One page of Tugas Akhir > Permohonan, "Semua" by default and sorted by status priority on the
 * server; `counts.waiting` (both kinds) is the sidebar badge.
 */
export interface LecturerApprovalInbox {
  data: LecturerApprovalRow[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
  counts: { waiting: number; waitingRequests: number; waitingChanges: number; waitingSupervisor2?: number };
}

export interface LecturerResponseDto {
  action: 'accept' | 'reject';
  approvalNote?: string | null;
  lecturerOverquotaReason?: string | null;
  rejectionReason?: string | null;
}

export interface KadepQueue {
  academicYear: AcademicYearRef;
  department: SupervisorRequest[];
  overQuota: (SupervisorRequest & { lecturerLoad: (SupervisorLoad & { projectedCount: number; overBy: number }) | null })[];
  history: SupervisorRequest[];
}

export interface KadepDecisionDto {
  action: 'approve' | 'redirect' | 'request_revision' | 'reject';
  targetLecturerId?: string | null;
  notes?: string | null;
}

export interface SupervisionLimits {
  softLimit: number;
  hardLimit: number;
  updatedAt?: string;
}

export interface LecturerLoadRow {
  lecturerId: string;
  fullName: string | null;
  identityNumber: string | null;
  scienceGroup: { id: string; name: string } | null;
  acceptingRequests: boolean;
  activeCount: number;
  level: SupervisionLoadLevel;
  breakdown: {
    total: number;
    waitingAssignment: number;
    proposal: number;
    research: number;
    onLeave: number;
    asSupervisor2: number;
  };
}

export interface SupervisionLoadOverview {
  academicYear: AcademicYearRef | null;
  general: SupervisionLimits | null;
  period: SupervisionLimits | null;
  applicable: SupervisionLimits & { source: 'period' | 'general' | 'default' };
  lecturers: LecturerLoadRow[];
}

export interface AssignedSupervisor {
  lecturerId: string;
  fullName: string | null;
  role: string | null;
}

export interface AssignmentEntry {
  thesisId: string;
  studentName: string;
  studentNim: string;
  title: string;
  /** Names exactly as printed in the PDF. */
  supervisorNames: string;
  supervisors: AssignedSupervisor[];
  supervisorAssignedAt: string | null;
  inCurrentBatch: boolean;
}

export interface AssignmentBatch {
  id: string;
  version: number;
  status: AssignmentBatchStatus;
  generatedAt: string;
  generatedBy: { id: string; fullName: string | null } | null;
  fileName: string;
  fileSize: number | null;
  memberCount: number;
  fileUrl: string;
}

export interface AssignmentOverview {
  academicYear: AcademicYearRef;
  entries: AssignmentEntry[];
  currentBatch: AssignmentBatch | null;
  batches: AssignmentBatch[];
  /** The current batch lists exactly the cohort below. */
  upToDate: boolean;
  needsIssue: boolean;
  newCount: number;
}

/** The "Pengajuan" column of the Penetapan panel. */
export type AssignmentBoardSubmission =
  | 'department_waiting'
  | 'over_quota_waiting'
  | 'supervisor2_waiting'
  | 'approved'
  | 'revision_requested'
  | 'rejected'
  | 'other';

export interface AssignmentBoardLecturer {
  lecturerId: string;
  fullName: string | null;
  role: string | null;
  load: SupervisorLoad | null;
  /** "Menerima pengajuan baru" of the lecturer. */
  acceptingRequests: boolean;
}

/** One student of the chosen semester. */
export interface AssignmentBoardRow {
  studentId: string;
  thesisId: string | null;
  student: { fullName: string | null; identityNumber: string | null };
  title: string | null;
  supervisors: AssignmentBoardLecturer[];
  /** The lecturer a waiting decision is about (over quota: Pembimbing 1; Pembimbing 2). */
  candidate: AssignmentBoardLecturer | null;
  submission: AssignmentBoardSubmission;
  waiting: boolean;
  requestStatus: SupervisorRequestStatus | null;
  assignment: { inCohort: boolean; assigned: boolean; version: number | null };
  request: (SupervisorRequest & { lecturerLoad?: (SupervisorLoad & { projectedCount: number; overBy: number }) | null }) | null;
  supervisor2Request: {
    requestId: string;
    thesisId: string;
    studentId: string;
    lecturerId: string;
    studentName: string;
    studentNim?: string | null;
    lecturerName: string;
    thesisTitle: string;
    requestedAt: string;
    lecturerLoad: SupervisorLoad | null;
  } | null;
  history: SupervisorRequest[];
  proposal: { fileName: string | null; url: string | null; submittedAt: string | null } | null;
  requestedAt: string | null;
}

export interface AssignmentBoard {
  academicYear: AcademicYearRef & { isOperational: boolean };
  rows: AssignmentBoardRow[];
  counts: { waiting: number; cohort: number };
  currentBatch: AssignmentBatch | null;
  batches: AssignmentBatch[];
  upToDate: boolean;
  needsIssue: boolean;
  newCount: number;
}

export interface IssueAssignmentResult extends AssignmentOverview {
  alreadyIssued: boolean;
  newlyAssigned?: number;
}

export interface FinalProposalAttempt {
  id: string;
  academicYear: { id: string; label: string | null };
  file: { fileName: string | null; fileSize: number | null; url: string | null; submittedAt: string | null } | null;
  supervisorScored: boolean;
  coordinatorScored: boolean;
  /** The two parts of the final score, sent once it is final. */
  supervisorScore?: number | null;
  coordinatorScore?: number | null;
  isFinalized: boolean;
  finalScore: number | null;
  result: ResearchMethodResult | null;
  attendanceAutoZeroed: boolean;
  minimumScore?: number;
  attendance?: { attendancePercentage: number; isEligible: boolean } | null;
}

export interface FinalProposalState {
  academicYear: AcademicYearRef | null;
  /** Attempt of the running period (one per semester). */
  current: FinalProposalAttempt | null;
  canSubmit: boolean;
  blockReason: string | null;
  history: FinalProposalAttempt[];
}

export type ProposalRevisionStatus = 'submitted' | 'revision_requested' | 'approved';

/** One upload of a revised proposal (TA mengulang proposal lewat evaluasi bimbingan). */
export interface ProposalRevision {
  id: string;
  status: ProposalRevisionStatus;
  file: { fileName: string; fileSize: number; url: string; submittedAt: string };
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewerName: string | null;
}

interface ProposalRevisionCycle {
  /** True only for a thesis in Proposal sent back by an approved "Mengulang Proposal" evaluation. */
  applicable: boolean;
  evaluation: { id: string; approvedAt: string | null } | null;
  current: ProposalRevision | null;
  history: ProposalRevision[];
}

export interface StudentProposalRevisionState extends ProposalRevisionCycle {
  canSubmit: boolean;
  blockReason: string | null;
  /** The next upload replaces the one still waiting for review. */
  replacesCurrent: boolean;
}

export interface LecturerProposalRevisionState extends ProposalRevisionCycle {
  canReview: boolean;
  reviewBlockReason: string | null;
}

export type ProposalRevisionAction = 'approve' | 'request_revision';

export interface StudentProposalOverview {
  thesis: {
    id: string;
    title: string | null;
    status: ThesisLifecycleStatus;
    startDate: string | null;
    topic: { id: string; name: string } | null;
    academicYear: AcademicYearRef | null;
    supervisors: (AssignedSupervisor & { identityNumber: string | null })[];
  } | null;
  assignment: {
    assigned: boolean;
    assignedAt: string | null;
    semesterLabel: string | null;
    version: number | null;
    waitingReason: string | null;
  } | null;
  finalProposal: FinalProposalState;
  proposalRevision: StudentProposalRevisionState;
}

export type { ResearchMethodResult };
