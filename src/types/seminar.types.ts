export type ThesisSeminarStatus =
  | 'registered'
  | 'verified'
  | 'examiner_assigned'
  | 'scheduled'
  | 'ongoing'
  | 'passed'
  | 'passed_with_revision'
  | 'failed'
  | 'cancelled';

export type DocumentSubmitStatus = 'submitted' | 'approved' | 'declined';

export type ExaminerAvailabilityStatus = 'pending' | 'available' | 'unavailable';

export interface SeminarChecklistItem {
  met: boolean;
  label: string;
  current?: number;
  required?: number;
  supervisors?: {
    name: string;
    role: string;
    ready: boolean;
  }[];
}

export interface SeminarChecklist {
  bimbingan: SeminarChecklistItem;
  kehadiran: SeminarChecklistItem;
  pembimbing: SeminarChecklistItem;
}

export interface SeminarDocument {
  thesisSeminarId: string;
  documentTypeId: string;
  documentId: string;
  status: DocumentSubmitStatus;
  submittedAt: string;
  verifiedAt: string | null;
  notes: string | null;
  verifiedBy?: string | null;
  fileName?: string | null;
  filePath?: string | null;
}

export interface SeminarDocumentType {
  id: string;
  name: string;
  accept: string[];
  label: string;
}

export interface SeminarDocumentsResponse {
  seminarId: string | null;
  documents: SeminarDocument[];
}

export interface SeminarDocumentUploadResponse {
  documentTypeId: string;
  documentId: string;
  fileName: string;
  filePath: string;
  status: DocumentSubmitStatus;
  submittedAt: string;
}

export interface SeminarExaminer {
  id: string;
  lecturerId: string;
  lecturerName?: string;
  order: number;
  availabilityStatus: ExaminerAvailabilityStatus;
  assessmentScore: number | null;
  assessmentSubmittedAt: string | null;
  revisionNotes: string | null;
}

export interface SeminarInfo {
  id: string;
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingLink: string | null;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
  cancelledReason: string | null;
  room: { id: string; name: string } | null;
  documents: SeminarDocument[];
  examiners: SeminarExaminer[];
}

export interface SeminarOverviewResponse {
  thesisId: string;
  thesisTitle: string;
  checklist: SeminarChecklist;
  allChecklistMet: boolean;
  seminar: SeminarInfo | null;
}

export interface AttendanceRecord {
  seminarId: string;
  presenterName: string;
  thesisTitle: string;
  date: string | null;
  isPresent: boolean;
  approvedAt: string | null;
  approvedBy: string | null;
}

export interface AttendanceSummary {
  attended: number;
  total: number;
  required: number;
  met: boolean;
}

export interface AttendanceHistoryResponse {
  summary: AttendanceSummary;
  records: AttendanceRecord[];
}

// ============================================================
// Admin Seminar Management Types
// ============================================================

export interface AdminSeminarDocumentSummary {
  total: number;
  submitted: number;
  approved: number;
  declined: number;
}

export interface AdminSeminarSupervisor {
  name: string;
  role: string;
}

export interface AdminSeminarListItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminSeminarSupervisor[];
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  documentSummary: AdminSeminarDocumentSummary;
}

export interface AdminSeminarDocumentDetail {
  documentTypeId: string;
  documentId: string;
  status: DocumentSubmitStatus;
  submittedAt: string;
  verifiedAt: string | null;
  notes: string | null;
  verifiedBy: string | null;
  fileName: string | null;
  filePath: string | null;
}

export interface AdminSeminarDocType {
  id: string;
  name: string;
}

export interface AdminSeminarExaminer {
  id: string;
  lecturerName: string;
  order: number;
  availabilityStatus: ExaminerAvailabilityStatus;
}

export interface AdminSeminarDetailResponse {
  id: string;
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingLink: string | null;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
  cancelledReason: string | null;
  room: { id: string; name: string } | null;
  thesis: {
    id: string;
    title: string;
  };
  student: {
    name: string;
    nim: string;
  };
  supervisors: AdminSeminarSupervisor[];
  documents: AdminSeminarDocumentDetail[];
  documentTypes: AdminSeminarDocType[];
  examiners: AdminSeminarExaminer[];
  rejectedExaminers: RejectedExaminer[];
  audiences: SeminarAudienceItem[];
}

export interface ValidateDocumentPayload {
  action: 'approve' | 'decline';
  notes?: string;
}

export interface ValidateDocumentResponse {
  documentTypeId: string;
  status: DocumentSubmitStatus;
  seminarTransitioned: boolean;
  newSeminarStatus: ThesisSeminarStatus;
}

// ============================================================
// Admin Seminar Scheduling Types
// ============================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface LecturerAvailabilitySlot {
  id: string;
  lecturerId: string;
  lecturerName: string;
  day: DayOfWeek;
  startTime: string; // ISO string from DB Time field
  endTime: string;   // ISO string from DB Time field
  validFrom: string;
  validUntil: string;
}

export interface RoomOption {
  id: string;
  name: string;
}

export interface SeminarCurrentSchedule {
  date: string;
  startTime: string | null;
  endTime: string | null;
  isOnline: boolean;
  meetingLink: string | null;
  room: RoomOption | null;
}

export interface SeminarSchedulingData {
  rooms: RoomOption[];
  lecturerAvailabilities: LecturerAvailabilitySlot[];
  currentSchedule: SeminarCurrentSchedule | null;
}

export interface SetSchedulePayload {
  roomId?: string | null;
  isOnline?: boolean;
  meetingLink?: string | null;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
}

export interface SetScheduleResponse {
  seminarId: string;
  status: ThesisSeminarStatus;
}

// ============================================================
// Lecturer Seminar Types
// ============================================================

export type ExaminerAssignmentStatus = 'unassigned' | 'pending' | 'rejected' | 'partially_rejected' | 'confirmed';

/** Rejected examiner historical log entry */
export interface RejectedExaminer {
  id: string;
  lecturerId: string;
  lecturerName: string;
  order: number;
  availabilityStatus: ExaminerAvailabilityStatus;
  respondedAt: string | null;
  assignedAt: string | null;
}

export interface LecturerSeminarExaminer {
  id: string;
  lecturerId: string;
  lecturerName: string;
  order: number;
  availabilityStatus: ExaminerAvailabilityStatus;
  respondedAt: string | null;
}

/** Item in the Kadep "Tetapkan Penguji" list */
export interface AssignmentSeminarItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminSeminarSupervisor[];
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  assignmentStatus: ExaminerAssignmentStatus;
  examiners: LecturerSeminarExaminer[];
}

/** Combined seminar list item for lecturer views */
export interface LecturerSeminarListItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminSeminarSupervisor[];
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { id: string; name: string } | null;
  myRoles: string[];
  myExaminerStatus: ExaminerAvailabilityStatus | null;
  myExaminerId: string | null;
  myExaminerOrder: number | null;
}

/** Item in the Lecturer "Permintaan Menguji" list */
export interface ExaminerRequestItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminSeminarSupervisor[];
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { id: string; name: string } | null;
  myExaminerStatus: ExaminerAvailabilityStatus | null;
  myExaminerId: string | null;
  myExaminerOrder: number | null;
}

/** Item in the Lecturer "Mahasiswa Bimbingan" seminar list */
export interface SupervisedStudentSeminarItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminSeminarSupervisor[];
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { id: string; name: string } | null;
  myRole: string;
  examiners: LecturerSeminarExaminer[];
}

/** Eligible examiner candidate */
export interface EligibleExaminer {
  id: string;
  fullName: string;
  identityNumber: string;
  scienceGroup: string;
}

/** Lecturer seminar detail response */
export interface LecturerSeminarDetailResponse {
  id: string;
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingLink: string | null;
  finalScore: number | null;
  grade: string | null;
  room: { id: string; name: string } | null;
  thesis: { id: string; title: string };
  student: { name: string; nim: string };
  viewerRole: 'examiner' | 'supervisor' | 'none';
  mySupervisorRole: string | null;
  myExaminerId: string | null;
  myExaminerOrder: number | null;
  myExaminerAvailabilityStatus: ExaminerAvailabilityStatus | null;
  myAssessmentSubmittedAt: string | null;
  canOpenExaminerAssessment: boolean;
  canOpenSupervisorFinalization: boolean;
  canOpenSupervisorRevision: boolean;
  resultFinalizedAt: string | null;
  allExaminerSubmitted: boolean;
  supervisors: AdminSeminarSupervisor[];
  documents: AdminSeminarDocumentDetail[];
  documentTypes: AdminSeminarDocType[];
  examiners: LecturerSeminarExaminer[];
  rejectedExaminers: RejectedExaminer[];
  audiences: SeminarAudienceItem[];
}

export interface SeminarAssessmentCriterionInput {
  id: string;
  name: string;
  maxScore: number;
  score: number | null;
  rubrics: {
    id: string;
    minScore: number;
    maxScore: number;
    description: string;
  }[];
}

export interface SeminarAssessmentGroup {
  id: string;
  code: string;
  description: string;
  criteria: SeminarAssessmentCriterionInput[];
}

export interface ExaminerAssessmentFormResponse {
  seminar: {
    id: string;
    status: ThesisSeminarStatus;
    studentName: string;
    studentNim: string;
    thesisTitle: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    room: { id: string; name: string } | null;
  };
  examiner: {
    id: string;
    order: number;
    assessmentScore: number | null;
    revisionNotes: string | null;
    assessmentSubmittedAt: string | null;
  };
  criteriaGroups: SeminarAssessmentGroup[];
}

export interface SubmitExaminerAssessmentPayload {
  scores: { assessmentCriteriaId: string; score: number }[];
  revisionNotes?: string | null;
}

export interface SubmitExaminerAssessmentResponse {
  examinerId: string;
  assessmentScore: number | null;
  assessmentSubmittedAt: string | null;
}

export interface SupervisorFinalizationDataResponse {
  seminar: {
    id: string;
    status: ThesisSeminarStatus;
    finalScore: number | null;
    grade: string | null;
    resultFinalizedAt?: string | null;
    revisionFinalizedAt?: string | null;
    studentName: string;
    studentNim: string;
    thesisTitle: string;
  };
  supervisor: {
    roleName: string;
    canFinalize: boolean;
  };
  examiners: {
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
    assessmentScore: number | null;
    revisionNotes: string | null;
    assessmentSubmittedAt: string | null;
    assessmentDetails: {
      id: string;
      code: string;
      description: string;
      criteria: {
        id: string;
        name: string;
        maxScore: number;
        score: number;
        displayOrder: number;
      }[];
    }[];
  }[];
  allExaminerSubmitted: boolean;
  averageScore: number | null;
  averageGrade: string | null;
  recommendationUnlocked: boolean;
}

export interface FinalizeSeminarPayload {
  status: 'passed' | 'passed_with_revision' | 'failed';
}

export interface FinalizeSeminarResponse {
  seminarId: string;
  status: ThesisSeminarStatus;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
}

export interface SeminarRevisionBoardItem {
  id: string;
  examinerOrder: number | null;
  examinerLecturerId: string | null;
  description: string;
  revisionAction: string | null;
  isFinished: boolean;
  studentSubmittedAt: string | null;
  supervisorApprovedAt: string | null;
  approvedBySupervisorId: string | null;
  approvedBySupervisorName: string | null;
}

export interface RespondAssignmentPayload {
  status: 'available' | 'unavailable';
}

export interface RespondAssignmentResponse {
  examinerId: string;
  availabilityStatus: ExaminerAvailabilityStatus;
  seminarTransitioned: boolean;
}

// ============================================================
// Student Seminar Announcement Types
// ============================================================

export interface AnnouncementSupervisor {
  role: string;
  name: string;
}

export interface AnnouncementExaminer {
  order: number;
  name: string;
}

export interface SeminarAnnouncementItem {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  status: ThesisSeminarStatus;
  meetingLink: string | null;
  room: { id: string; name: string } | null;
  thesisTitle: string;
  presenterName: string;
  presenterStudentId: string | null;
  supervisors: AnnouncementSupervisor[];
  examiners: AnnouncementExaminer[];
  isOwn: boolean;
  isPast: boolean;
  isRegistered: boolean;
  isPresent: boolean;
  registeredAt: string | null;
}

// ============================================================
// Student Revision Types
// ============================================================

export interface StudentRevisionExaminerNote {
  examinerOrder: number;
  lecturerName: string;
  revisionNotes: string;
}

export interface StudentRevisionItem {
  id: string;
  examinerOrder: number | null;
  examinerLecturerId: string | null;
  examinerName: string;
  description: string;
  revisionAction: string | null;
  isFinished: boolean;
  studentSubmittedAt: string | null;
  supervisorApprovedAt: string | null;
  approvedBySupervisorName: string | null;
}

export interface StudentRevisionResponse {
  seminarId: string;
  examinerNotes: StudentRevisionExaminerNote[];
  summary: {
    total: number;
    finished: number;
    pendingApproval: number;
  };
  revisions: StudentRevisionItem[];
}

export interface CreateRevisionPayload {
  seminarExaminerId: string;
  description: string;
}

export interface SubmitRevisionActionPayload {
  revisionAction: string;
}

// ============================================================
// Student Seminar History Types
// ============================================================

export interface SeminarHistoryExaminer {
  order: number;
  lecturerName: string;
  assessmentScore: number | null;
}

export interface SeminarHistoryItem {
  id: string;
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingLink: string | null;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
  cancelledReason: string | null;
  room: { id: string; name: string } | null;
  examiners: SeminarHistoryExaminer[];
}

// ============================================================
// Student Seminar Detail Types (for history detail page)
// ============================================================

export interface StudentSeminarDetailDocument {
  documentTypeId: string;
  documentTypeName: string;
  fileName: string | null;
  filePath: string | null;
  status: DocumentSubmitStatus;
  submittedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
}

export interface StudentSeminarDetailExaminer {
  id: string;
  order: number;
  lecturerName: string;
  assessmentScore: number | null;
  assessmentSubmittedAt: string | null;
}

export interface SeminarAudienceItem {
  studentName: string;
  nim: string;
  registeredAt: string | null;
  isPresent: boolean;
  approvedAt: string | null;
  approvedByName?: string | null;
}

export interface StudentSeminarDetailResponse {
  id: string;
  status: ThesisSeminarStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  meetingLink: string | null;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
  cancelledReason: string | null;
  room: { id: string; name: string } | null;
  thesis: {
    id: string;
    title: string;
    supervisors: {
      role: string;
      lecturerName: string;
    }[];
  };
  examiners: StudentSeminarDetailExaminer[];
  documents: StudentSeminarDetailDocument[];
  examinerNotes: StudentRevisionExaminerNote[];
  revisions: StudentRevisionItem[];
  revisionSummary: {
    total: number;
    finished: number;
    pendingApproval: number;
  };
  audiences: SeminarAudienceItem[];
}

// ============================================================
// Lecturer Audience Types
// ============================================================

export interface LecturerAudienceItem {
  studentId: string;
  studentName: string;
  nim: string;
  registeredAt: string | null;
  isPresent: boolean;
  approvedAt: string | null;
  approvedByName: string | null;
}

// ============================================================
// Student Assessment View Types (read-only rubric)
// ============================================================

export interface StudentAssessmentResponse {
  seminar: {
    id: string;
    status: ThesisSeminarStatus;
    finalScore: number | null;
    grade: string | null;
    resultFinalizedAt: string | null;
  };
  examiners: {
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
    assessmentScore: number | null;
    revisionNotes: string | null;
    assessmentSubmittedAt: string | null;
    assessmentDetails: {
      id: string;
      code: string;
      description: string;
      criteria: {
        id: string;
        name: string;
        maxScore: number;
        score: number;
        displayOrder: number;
      }[];
    }[];
  }[];
  allExaminerSubmitted: boolean;
  averageScore: number | null;
  averageGrade: string | null;
}

export interface SaveRevisionActionPayload {
  revisionAction?: string;
  description?: string;
}
