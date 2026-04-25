export type StudentYudisiumChecklistItem = {
  label: string;
  met: boolean;
  current?: number;
  required?: number;
  submittedAt?: string | null;
  revisionFinalizedAt?: string | null;
  responseId?: string | null;
};

export type StudentYudisiumChecklist = {
  sks: StudentYudisiumChecklistItem;
  revisiSidang: StudentYudisiumChecklistItem;
  mataKuliahWajib: StudentYudisiumChecklistItem;
  mataKuliahMkwu: StudentYudisiumChecklistItem;
  mataKuliahKerjaPraktik: StudentYudisiumChecklistItem;
  mataKuliahKkn: StudentYudisiumChecklistItem;
  exitSurvey: StudentYudisiumChecklistItem;
};

export type StudentYudisiumRequirement = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  isUploaded: boolean;
  status: 'terunggah' | 'menunggu';
  submittedAt: string | null;
};

export type YudisiumRequirementUploadStatus = {
  id: string;
  name: string;
  description: string | null;
  notes: string | null;
  status: 'submitted' | 'approved' | 'declined' | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  validationNotes: string | null;
  document: {
    id: string;
    fileName: string | null;
    filePath: string | null;
  } | null;
};

export type StudentYudisiumRequirementsResponse = {
  yudisiumId: string;
  participantId: string | null;
  participantStatus: string | null;
  requirements: YudisiumRequirementUploadStatus[];
};

export type StudentYudisiumOverviewResponse = {
  yudisium: {
    id: string;
    name?: string | null;
    status: string;
    registrationOpenDate: string | null;
    registrationCloseDate: string | null;
    eventDate: string | null;
    decreeNumber?: string | null;
    decreeIssuedAt?: string | null;
    decreeDocument?: {
      id: string;
      fileName: string | null;
      filePath: string | null;
    } | null;
    exitSurveyForm: {
      id: string;
      name: string;
    } | null;
  } | null;
  participantStatus: 'registered' | 'under_review' | 'approved' | 'rejected' | 'finalized' | null;
  thesis: {
    id: string;
    title: string;
  } | null;
  checklist: StudentYudisiumChecklist;
  allChecklistMet: boolean;
  allCplVerified: boolean;
  cplScores: {
    code: string | null;
    description: string;
    score: number | null;
    minimalScore: number;
    status: string;
    passed: boolean;
  }[];
  requirements: StudentYudisiumRequirement[];
};
