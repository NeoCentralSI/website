export type ThesisDefenceStatus =
  | 'registered'
  | 'verified'
  | 'examiner_assigned'
  | 'scheduled'
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
  supervisors: AdminDefenceSupervisor[];
  documents: AdminDefenceDocumentDetail[];
  documentTypes: AdminDefenceDocType[];
  examiners: LecturerDefenceExaminer[];
  rejectedExaminers: RejectedDefenceExaminer[];
}

export interface RespondDefenceAssignmentPayload {
  status: 'available' | 'unavailable';
}

export interface RespondDefenceAssignmentResponse {
  examinerId: string;
  status: string;
  defenceTransitioned: boolean;
}
