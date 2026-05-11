import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

async function parseResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Request gagal' }));
    throw new Error(errorData.message || `Request gagal (${response.status})`);
  }
  return response.json();
}

/**
 * P0-05 + BR-18 + P1-11: Snapshot 5 syarat TA-04 untuk UI KaDep checklist.
 * Re-validasi `takingThesisCourse` tetap dilakukan di backend pada accept-time.
 */
export type Ta04Requirements = {
  supervisorAssigned: boolean;
  proposalFinalSubmitted: boolean;
  ta03aComplete: boolean;
  ta03bComplete: boolean;
  takingThesisCourse: boolean;
};

export type PendingTitleReportRow = {
  thesisId: string;
  title: string | null;
  studentName: string;
  studentNim: string;
  supervisors: string;
  submittedAt: string;
  academicYear: { id: string; year: string | null; semester: string } | null;
  /** P0-05/P1-11: 5 syarat checklist TA-04. */
  requirements?: Ta04Requirements;
  finalScore?: number | null;
  isFinalized?: boolean;
  hasP2?: boolean;
};

export type StudentProposalThesis = {
  id: string;
  title: string | null;
  proposalStatus: string | null;
  titleApprovalDocumentId: string | null;
  proposalReviewNotes: string | null;
  proposalReviewedAt: string | null;
  updatedAt: string;
  titleApprovalDocument: { id: string; fileName: string; filePath: string } | null;
} | null;

/**
 * BR-23 (canon §5.13): Detail arsip Metopel mahasiswa pasca TA-04.
 * 4 kategori: substansi awal, detail rubrik TA-03A, detail rubrik TA-03B, dokumen SK TA-04.
 */
export type StudentArchiveAdvisorRequest = {
  id: string;
  requestType: string;
  status: string;
  proposedTitle: string | null;
  backgroundSummary: string | null;
  problemStatement: string | null;
  proposedSolution: string | null;
  researchObject: string | null;
  researchPermitStatus: string | null;
  justificationText: string | null;
  createdAt: string;
  lecturer: { user: { fullName: string | null } | null } | null;
  topic: { name: string | null } | null;
};

export type StudentArchiveScoreDetail = {
  researchMethodScoreId: string;
  assessmentCriteriaId: string;
  assessmentRubricId: string | null;
  score: number;
  criteria: {
    id: string;
    name: string | null;
    maxScore: number | null;
    cpmk?: { code?: string | null; description?: string | null; type?: string | null } | null;
  };
  assessmentRubric: {
    id: string;
    minScore: number;
    maxScore: number;
    description: string | null;
  } | null;
};

export type StudentArchiveData = {
  thesisId: string;
  thesisTitle: string | null;
  proposalStatus: string | null;
  advisorRequests: StudentArchiveAdvisorRequest[];
  score: {
    supervisorScore: number | null;
    lecturerScore: number | null;
    finalScore: number | null;
    isFinalized: boolean;
    coSignedAt: string | null;
    coSignNote: string | null;
    coSignerName: string | null;
    supervisorName: string | null;
    lecturerAssessorName: string | null;
    details: StudentArchiveScoreDetail[];
    ta03aDetailIds: string[];
  } | null;
  titleApproval: {
    reviewNotes: string | null;
    reviewedAt: string | null;
    document: { id: string; fileName: string; filePath: string } | null;
  };
  readOnly: true;
} | null;

export const metopenTitleService = {
  getPendingTitleReports: async (academicYearId?: string): Promise<ApiResponse<PendingTitleReportRow[]>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_PENDING_TITLE_REPORTS(academicYearId));
    const response = await apiRequest(url);
    return parseResponse<PendingTitleReportRow[]>(response);
  },

  reviewTitleReport: async (
    thesisId: string,
    body: { action: 'accept'; notes?: string | null },
  ): Promise<ApiResponse<{ thesisId: string; proposalStatus: string; notes?: string | null }>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_TITLE_REPORT_REVIEW(thesisId));
    const response = await apiRequest(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return parseResponse(response);
  },

  getMyProposalApproval: async (): Promise<ApiResponse<{ thesis: StudentProposalThesis }>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_PROPOSAL_APPROVAL);
    const response = await apiRequest(url);
    return parseResponse(response);
  },

  getMySeminarEligibilitySnapshot: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_SEMINAR_ELIGIBILITY);
    const response = await apiRequest(url);
    return parseResponse(response);
  },

  syncMyProposalQueue: async (): Promise<ApiResponse<Record<string, unknown>>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_PROPOSAL_QUEUE_SYNC);
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse(response);
  },

  /** BR-23: ambil arsip Metopel mahasiswa (substansi + rubrik + SK TA-04). */
  getMyArchive: async (): Promise<ApiResponse<StudentArchiveData>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_ARCHIVE);
    const response = await apiRequest(url);
    return parseResponse<StudentArchiveData>(response);
  },
};
