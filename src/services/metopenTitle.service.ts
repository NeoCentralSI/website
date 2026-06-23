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

/** F-5.2: baris thesis TA-04 accepted yang belum terhubung ke Formulir TA-04 batch resmi. */
export type MissingTitleDocumentRow = {
  thesisId: string;
  title: string | null;
  studentName: string;
  studentNim: string;
  approvedAt: string | null;
  academicYear: { id: string; year: string | null; semester: string } | null;
};

/** Riwayat keputusan TA-04 (accepted/rejected) untuk dashboard KaDep. */
export type TitleApprovalDocumentKind = 'batch' | 'legacy';

export type TitleReportHistoryRow = {
  thesisId: string;
  title: string | null;
  studentName: string;
  studentNim: string;
  supervisors: string;
  proposalStatus: 'accepted' | 'rejected';
  reviewedAt: string | null;
  reviewedByName: string | null;
  reviewNotes: string | null;
  academicYear: { id: string; year: string | null; semester: string } | null;
  titleApprovalDocument: { id: string; fileName: string } | null;
  documentKind: TitleApprovalDocumentKind | null;
};

export type StudentProposalThesis = {
  id: string;
  title: string | null;
  proposalStatus: string | null;
  queueReadiness?: {
    ready: boolean;
    block: string | null;
    proposalStatus: string | null;
  } | null;
  titleApprovalDocumentId: string | null;
  proposalReviewNotes: string | null;
  proposalReviewedAt: string | null;
  updatedAt: string;
  titleApprovalDocument: { id: string; fileName: string; filePath: string } | null;
} | null;

/**
 * BR-23 (canon §5.13): Detail arsip Metopel mahasiswa pasca TA-04.
 * 4 kategori: substansi awal, detail rubrik TA-03A, detail rubrik TA-03B, Formulir TA-04.
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
    /** "batch" = Formulir TA-04 resmi per periode; null = belum difinalisasi batch. */
    documentKind: 'batch' | null;
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

  /** F-5.2: thesis TA-04 accepted yang belum terhubung ke Formulir TA-04 batch resmi. */
  getMissingTitleDocuments: async (
    academicYearId?: string,
  ): Promise<ApiResponse<MissingTitleDocumentRow[]>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_TITLE_REPORTS_MISSING_DOCUMENT(academicYearId));
    const response = await apiRequest(url);
    return parseResponse<MissingTitleDocumentRow[]>(response);
  },

  /** Legacy endpoint; Formulir TA-04 resmi diterbitkan melalui finalisasi batch periode. */
  regenerateTitleReport: async (
    thesisId: string,
  ): Promise<ApiResponse<{ thesisId: string; document: { id: string; fileName: string } | null }>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_TITLE_REPORT_REGENERATE(thesisId));
    const response = await apiRequest(url, { method: 'POST' });
    return parseResponse(response);
  },

  /** Riwayat keputusan TA-04 (accepted/rejected) antar-periode untuk KaDep. */
  getKadepTitleReportHistory: async (
    academicYearId?: string,
  ): Promise<ApiResponse<TitleReportHistoryRow[]>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_TITLE_REPORTS_HISTORY(academicYearId));
    const response = await apiRequest(url);
    return parseResponse<TitleReportHistoryRow[]>(response);
  },

  /** FR-ARC-05: Mahasiswa mengunduh Formulir TA-04 PDF miliknya (stream terautentikasi). */
  downloadMyTitleApprovalDocument: async (): Promise<void> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_TITLE_APPROVAL_DOCUMENT);
    await downloadPdfStream(url, 'Formulir-TA-04.pdf');
  },

  /** KaDep mengunduh Formulir TA-04 PDF untuk thesis yang sudah terhubung ke batch. */
  downloadKadepTitleApprovalDocument: async (thesisId: string): Promise<void> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.KADEP_TITLE_REPORT_DOCUMENT(thesisId));
    await downloadPdfStream(url, `Formulir-TA-04-${thesisId}.pdf`);
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

  /** Detail read-only TA-03 untuk mahasiswa sejak skor tersedia, termasuk sebelum TA-04. */
  getMyAssessmentHistory: async (): Promise<ApiResponse<StudentArchiveData>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_ASSESSMENT_HISTORY);
    const response = await apiRequest(url);
    return parseResponse<StudentArchiveData>(response);
  },

  /** BR-23: ambil arsip Metopel mahasiswa (substansi + rubrik + Formulir TA-04). */
  getMyArchive: async (): Promise<ApiResponse<StudentArchiveData>> => {
    const url = getApiUrl(API_CONFIG.ENDPOINTS.METOPEN.ME_ARCHIVE);
    const response = await apiRequest(url);
    return parseResponse<StudentArchiveData>(response);
  },
};

/** Helper: unduh stream PDF terautentikasi + trigger browser download. */
async function downloadPdfStream(url: string, fallbackFilename: string): Promise<void> {
  const res = await apiRequest(url, { method: 'GET' });
  if (!res.ok) {
    let message = 'Gagal mengunduh Formulir TA-04';
    try {
      const err = await res.json();
      if (err?.message) message = err.message as string;
    } catch {
      // Response bukan JSON (mis. 500 HTML) — pakai pesan default.
    }
    throw new Error(message);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('content-disposition') ?? '';
  const filename =
    extractFilenameFromContentDisposition(disposition) ?? fallbackFilename;

  const blobUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(blobUrl);
}

function extractFilenameFromContentDisposition(header: string): string | null {
  if (!header) return null;
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const quotedMatch = header.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];
  const bareMatch = header.match(/filename=([^;]+)/i);
  if (bareMatch?.[1]) return bareMatch[1].trim();
  return null;
}
