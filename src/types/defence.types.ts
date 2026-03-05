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

export interface DefenceDocumentUploadResponse {
  documentId: string;
  documentTypeId: string;
  fileName: string;
  status: string;
}
