export type ThesisDefenceStatus =
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

export interface DefenceChecklistItem {
  met: boolean;
  label: string;
}

export interface DefenceChecklistSks extends DefenceChecklistItem {
  current: number;
  required: number;
}

export interface DefenceChecklistSeminar extends DefenceChecklistItem {
  seminarStatus: 'passed' | 'passed_with_revision' | null;
}

export interface DefenceChecklistRevisi extends DefenceChecklistItem {
  /** 'passed' = no revision needed, 'passed_with_revision' = revisions required */
  seminarStatus: 'passed' | 'passed_with_revision' | null;
  total: number;
  finished: number;
}

export interface DefenceChecklistPembimbing extends DefenceChecklistItem {
  supervisors: {
    name: string;
    role: string;
    ready: boolean;
  }[];
}

export interface DefenceChecklist {
  lulusSeminar: DefenceChecklistSeminar;
  sks: DefenceChecklistSks;
  revisiSeminar: DefenceChecklistRevisi;
  pembimbing: DefenceChecklistPembimbing;
}

export interface DefenceExaminer {
  id: string;
  lecturerId: string;
  lecturerName: string;
  order: number;
  availabilityStatus: string;
  assessmentScore: number | null;
  assessmentSubmittedAt: string | null;
}

export interface DefenceDocument {
  thesisDefenceId: string;
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

export interface DefenceInfo {
  id: string;
  status: ThesisDefenceStatus;
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
  documents: DefenceDocument[];
  examiners: DefenceExaminer[];
}

export interface DefenceOverviewResponse {
  thesisId: string;
  thesisTitle: string;
  checklist: DefenceChecklist;
  allChecklistMet: boolean;
  defence: DefenceInfo | null;
}

export interface DefenceDocumentType {
  id: string;
  name: string;
}

export interface DefenceDocumentsResponse {
  documents: DefenceDocument[];
}

// ============================================================
// Admin Defence Management Types
// ============================================================

export interface AdminDefenceDocumentSummary {
  total: number;
  submitted: number;
  approved: number;
  declined: number;
}

export interface AdminDefenceSupervisor {
  name: string;
  role: string;
}

export interface AdminDefenceListItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminDefenceSupervisor[];
  status: ThesisDefenceStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  documentSummary: AdminDefenceDocumentSummary;
}

export interface AdminDefenceDocumentDetail {
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

export interface AdminDefenceDocType {
  id: string;
  name: string;
}

export interface AdminDefenceExaminer {
  id: string;
  lecturerName: string;
  order: number;
  availabilityStatus: string;
}

export interface AdminDefenceDetailResponse {
  id: string;
  status: ThesisDefenceStatus;
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
  supervisors: AdminDefenceSupervisor[];
  documents: AdminDefenceDocumentDetail[];
  documentTypes: AdminDefenceDocType[];
  examiners: AdminDefenceExaminer[];
  rejectedExaminers?: RejectedDefenceExaminer[];
}

export interface RejectedDefenceExaminer {
  id: string;
  lecturerName: string;
  order: number;
  availabilityStatus: string;
  respondedAt: string | null;
  assignedAt: string | null;
}

export interface ValidateDefenceDocumentPayload {
  action: 'approve' | 'decline';
  notes?: string;
}

export interface ValidateDefenceDocumentResponse {
  documentTypeId: string;
  status: DocumentSubmitStatus;
  defenceTransitioned: boolean;
  newDefenceStatus: ThesisDefenceStatus;
}

// ============================================================
// Admin Defence Scheduling Types
// ============================================================

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface DefenceLecturerAvailabilitySlot {
  id: string;
  lecturerId: string;
  lecturerName: string;
  day: DayOfWeek;
  startTime: string;
  endTime: string;
  validFrom: string;
  validUntil: string;
}

export interface DefenceRoomOption {
  id: string;
  name: string;
}

export interface DefenceCurrentSchedule {
  date: string;
  startTime: string | null;
  endTime: string | null;
  isOnline: boolean;
  meetingLink: string | null;
  room: DefenceRoomOption | null;
}

export interface DefenceSchedulingData {
  rooms: DefenceRoomOption[];
  lecturerAvailabilities: DefenceLecturerAvailabilitySlot[];
  currentSchedule: DefenceCurrentSchedule | null;
}

export interface SetDefenceSchedulePayload {
  roomId?: string | null;
  isOnline?: boolean;
  meetingLink?: string | null;
  date: string;
  startTime: string;
  endTime: string;
}

export interface SetDefenceScheduleResponse {
  defenceId: string;
  status: ThesisDefenceStatus;
}

export interface DefenceDocumentUploadResponse {
  documentId: string;
  documentTypeId: string;
  fileName: string;
  status: string;
}

// ============================================================
// Lecturer Defence Types
// ============================================================

export type ExaminerAvailabilityStatus = 'pending' | 'available' | 'unavailable';

export type ExaminerAssignmentStatus = 'unassigned' | 'pending' | 'rejected' | 'partially_rejected' | 'confirmed';

export interface LecturerDefenceExaminer {
  id: string;
  lecturerId: string;
  lecturerName: string;
  order: number;
  availabilityStatus: ExaminerAvailabilityStatus;
  respondedAt: string | null;
}

export interface AssignmentDefenceItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminDefenceSupervisor[];
  status: ThesisDefenceStatus;
  registeredAt: string | null;
  assignmentStatus: ExaminerAssignmentStatus;
  examiners: LecturerDefenceExaminer[];
}

export interface ExaminerDefenceRequestItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminDefenceSupervisor[];
  status: ThesisDefenceStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { id: string; name: string } | null;
  myExaminerStatus: ExaminerAvailabilityStatus | null;
  myExaminerId: string | null;
  myExaminerOrder: number | null;
}

export interface SupervisedStudentDefenceItem {
  id: string;
  thesisId: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: AdminDefenceSupervisor[];
  status: ThesisDefenceStatus;
  registeredAt: string | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  room: { id: string; name: string } | null;
  myRole: string;
  examiners: LecturerDefenceExaminer[];
}

export interface EligibleDefenceExaminer {
  id: string;
  fullName: string;
  identityNumber: string;
  scienceGroup: string;
}

export interface LecturerDefenceDetailResponse {
  id: string;
  status: ThesisDefenceStatus;
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
  canOpenSupervisorAssessment: boolean;
  canOpenSupervisorFinalization: boolean;
  resultFinalizedAt: string | null;
  allExaminerSubmitted: boolean;
  supervisorAssessmentSubmitted: boolean;
  supervisors: AdminDefenceSupervisor[];
  documents: AdminDefenceDocumentDetail[];
  documentTypes: AdminDefenceDocType[];
  examiners: LecturerDefenceExaminer[];
  rejectedExaminers: RejectedDefenceExaminer[];
}

export interface DefenceAssessmentCriterionInput {
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

export interface DefenceAssessmentGroup {
  id: string;
  code: string;
  description: string;
  criteria: DefenceAssessmentCriterionInput[];
}

export interface DefenceAssessmentFormResponse {
  defence: {
    id: string;
    status: ThesisDefenceStatus;
    studentName: string;
    studentNim: string;
    thesisTitle: string;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    room: { id: string; name: string } | null;
  };
  assessorRole: 'examiner' | 'supervisor';
  examiner: {
    id: string;
    order: number;
    assessmentScore: number | null;
    revisionNotes: string | null;
    assessmentSubmittedAt: string | null;
  } | null;
  supervisor: {
    roleName: string;
    assessmentScore: number | null;
    supervisorNotes: string | null;
    assessmentSubmittedAt: string | null;
  } | null;
  criteriaGroups: DefenceAssessmentGroup[];
}

export interface SubmitDefenceAssessmentPayload {
  scores: { assessmentCriteriaId: string; score: number }[];
  revisionNotes?: string | null;
  supervisorNotes?: string | null;
}

export interface SubmitDefenceAssessmentResponse {
  assessorRole: 'examiner' | 'supervisor';
  examinerId?: string;
  defenceId?: string;
  assessmentScore: number | null;
  assessmentSubmittedAt: string | null;
}

export interface DefenceFinalizationDataResponse {
  defence: {
    id: string;
    status: ThesisDefenceStatus;
    examinerAverageScore: number | null;
    supervisorScore: number | null;
    finalScore: number | null;
    computedFinalScore: number | null;
    grade: string | null;
    resultFinalizedAt: string | null;
    studentName: string;
    studentNim: string;
    thesisTitle: string;
  };
  supervisor: {
    roleName: string;
    name: string;
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
  supervisorAssessment: {
    assessmentScore: number | null;
    supervisorNotes: string | null;
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
  };
  allExaminerSubmitted: boolean;
  supervisorAssessmentSubmitted: boolean;
  recommendationUnlocked: boolean;
}

export interface FinalizeDefencePayload {
  status: 'passed' | 'passed_with_revision' | 'failed';
}

export interface FinalizeDefenceResponse {
  defenceId: string;
  status: ThesisDefenceStatus;
  examinerAverageScore: number | null;
  supervisorScore: number | null;
  finalScore: number | null;
  grade: string | null;
  resultFinalizedAt: string | null;
}

export interface RespondDefenceAssignmentPayload {
  status: 'available' | 'unavailable';
}

export interface RespondDefenceAssignmentResponse {
  examinerId: string;
  status: string;
  defenceTransitioned: boolean;
}

export interface StudentDefenceHistoryItem {
  id: string;
  status: ThesisDefenceStatus;
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
  examiners: {
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
    assessmentScore: number | null;
    assessmentSubmittedAt: string | null;
  }[];
}

export interface StudentDefenceDetailResponse {
  id: string;
  thesisId: string;
  status: ThesisDefenceStatus;
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
    studentId: string;
    title: string;
    thesisSupervisors: {
      role: { name: string };
      lecturer: { user: { fullName: string } };
    }[];
  };
  examiners: {
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
    assessmentScore: number | null;
    assessmentSubmittedAt: string | null;
    revisionNotes: string | null;
  }[];
  documents: {
    thesisDefenceId: string;
    documentTypeId: string;
    documentTypeName: string;
    documentId: string;
    status: DocumentSubmitStatus;
    submittedAt: string;
    verifiedAt: string | null;
    notes: string | null;
    fileName: string | null;
    filePath: string | null;
  }[];
}

export interface StudentDefenceAssessmentResponse {
  defence: {
    id: string;
    status: ThesisDefenceStatus;
    examinerAverageScore: number | null;
    supervisorScore: number | null;
    finalScore: number | null;
    grade: string | null;
    resultFinalizedAt: string | null;
    room: { id: string; name: string } | null;
    date: string | null;
    startTime: string | null;
    endTime: string | null;
    meetingLink: string | null;
  };
  examiners: {
    id: string;
    lecturerId: string;
    lecturerName: string;
    order: number;
    assessmentScore: number | null;
    assessmentSubmittedAt: string | null;
    revisionNotes?: string | null;
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
  supervisorAssessment: {
    name: string;
    assessmentScore: number | null;
    supervisorNotes: string | null;
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
  };
}

export interface StudentDefenceRevisionItem {
  id: string;
  defenceExaminerId: string;
  description: string;
  revisionAction: string | null;
  studentSubmittedAt: string | null;
  isFinished: boolean;
  supervisorApprovedAt: string | null;
  approvedBySupervisorName?: string | null;
  examinerOrder?: number | null;
  examinerName?: string;
}

export interface CreateDefenceRevisionPayload {
  defenceExaminerId: string;
  description: string;
}

export interface SaveDefenceRevisionActionPayload {
  revisionAction: string;
}
