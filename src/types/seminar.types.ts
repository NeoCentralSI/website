export type ThesisSeminarStatus =
  | 'registered'
  | 'verified'
  | 'examiner_assigned'
  | 'scheduled'
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
  supervisors: AdminSeminarSupervisor[];
  documents: AdminSeminarDocumentDetail[];
  documentTypes: AdminSeminarDocType[];
  examiners: LecturerSeminarExaminer[];
  rejectedExaminers: RejectedExaminer[];
}

export interface RespondAssignmentPayload {
  status: 'available' | 'unavailable';
}

export interface RespondAssignmentResponse {
  examinerId: string;
  availabilityStatus: ExaminerAvailabilityStatus;
  seminarTransitioned: boolean;
}
