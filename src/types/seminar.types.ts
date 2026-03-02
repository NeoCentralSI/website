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
