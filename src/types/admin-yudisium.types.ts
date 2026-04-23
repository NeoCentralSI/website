export type AdminYudisiumEvent = {
  id: string;
  name: string;
  status: string;
  registrationOpenDate: string | null;
  registrationCloseDate: string | null;
  eventDate: string | null;
  createdAt: string;
  participantCount: number;
};

export type YudisiumDocumentSummary = {
  total: number;
  submitted: number;
  approved: number;
  declined: number;
};

export type AdminYudisiumParticipant = {
  id: string;
  status: string;
  registeredAt: string | null;
  appointedAt: string | null;
  notes: string | null;
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  thesisId: string | null;
  documentSummary: YudisiumDocumentSummary;
};

export type AdminYudisiumParticipantsResponse = {
  yudisium: {
    id: string;
    name: string;
    status: string;
  };
  participants: AdminYudisiumParticipant[];
};

export type AdminYudisiumParticipantDocument = {
  requirementId: string;
  requirementName: string;
  description: string | null;
  order: number;
  status: 'submitted' | 'approved' | 'declined' | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  notes: string | null;
  verifiedBy: string | null;
  document: {
    id: string;
    fileName: string | null;
    filePath: string | null;
  } | null;
};

export type AdminYudisiumParticipantDetailResponse = {
  id: string;
  status: string;
  registeredAt: string | null;
  appointedAt: string | null;
  notes: string | null;
  yudisium: {
    id: string;
    name: string;
    status: string;
  };
  studentName: string;
  studentNim: string;
  thesisTitle: string;
  supervisors: { name: string; role: string }[];
  documents: AdminYudisiumParticipantDocument[];
};

export type ValidateDocumentPayload = {
  action: 'approve' | 'decline';
  notes?: string;
};

export type ValidateDocumentResponse = {
  requirementId: string;
  status: string;
  participantTransitioned: boolean;
  newParticipantStatus: string;
};

export type CplScoreItem = {
  cplId: string;
  code: string | null;
  description: string;
  score: number | null;
  minimalScore: number;
  status: 'calculated' | 'verified' | 'finalized';
  passed: boolean;
};

export type CplRecommendationItem = {
  id: string;
  cplId: string;
  recommendation: string | null;
  description: string | null;
  status: 'open' | 'in_progress' | 'resolved' | 'dismissed';
  resolvedAt: string | null;
  createdAt: string;
  createdBy: string | null;
  resolvedBy: string | null;
};

export type ParticipantCplResponse = {
  participantId: string;
  participantStatus: string;
  cplScores: CplScoreItem[];
  recommendations: CplRecommendationItem[];
};
