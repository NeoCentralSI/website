import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from '../auth.service';
import type {
  SeminarOverviewResponse,
  AttendanceHistoryResponse,
  SeminarDocumentType,
  SeminarDocumentsResponse,
  SeminarDocumentUploadResponse,
  SeminarAnnouncementItem,
  StudentRevisionResponse,
  CreateRevisionPayload,
  SubmitRevisionActionPayload,
  SaveRevisionActionPayload,
  SeminarHistoryItem,
  StudentSeminarDetailResponse,
  StudentAssessmentResponse,
} from '@/types/seminar.types';

/**
 * Get student seminar overview (checklist, status, documents)
 */
export async function getStudentSeminarOverview(): Promise<SeminarOverviewResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.OVERVIEW)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data seminar');
  return json.data;
}

/**
 * Get student seminar attendance history
 */
export async function getStudentAttendanceHistory(): Promise<AttendanceHistoryResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.ATTENDANCE)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat kehadiran');
  return json.data;
}

/**
 * Get seminar document types
 */
export async function getSeminarDocumentTypes(): Promise<SeminarDocumentType[]> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENT_TYPES)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat tipe dokumen');
  return json.data;
}

/**
 * Get all student seminar documents
 */
export async function getStudentSeminarDocuments(): Promise<SeminarDocumentsResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENTS)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat dokumen seminar');
  return json.data;
}

/**
 * Upload a seminar document
 */
export async function uploadSeminarDocument(
  file: File,
  documentTypeName: string
): Promise<SeminarDocumentUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentTypeName', documentTypeName);

  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.DOCUMENT_UPLOAD),
    {
      method: 'POST',
      body: formData,
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengupload dokumen');
  return json.data;
}

/**
 * Get all seminar announcements (scheduled/past) visible to the student
 */
export async function getSeminarAnnouncements(): Promise<SeminarAnnouncementItem[]> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.ANNOUNCEMENTS)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat pengumuman seminar');
  return json.data;
}

/**
 * Register the student as an audience for a seminar
 */
export async function registerToSeminar(seminarId: string): Promise<{ message: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REGISTER_AUDIENCE(seminarId)),
    { method: 'POST' }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mendaftar seminar');
  return json.data;
}

/**
 * Cancel the student's audience registration for a seminar
 */
export async function cancelSeminarRegistration(seminarId: string): Promise<{ message: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REGISTER_AUDIENCE(seminarId)),
    { method: 'DELETE' }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan pendaftaran');
  return json.data;
}

/**
 * Get student's revision items
 */
export async function getStudentRevisions(): Promise<StudentRevisionResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISIONS)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data revisi');
  return json.data;
}

/**
 * Create a new revision item
 */
export async function createRevision(payload: CreateRevisionPayload): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISIONS),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membuat item revisi');
  return json.data;
}

/**
 * Submit revision action for a revision item
 */
export async function submitRevisionAction(
  revisionId: string,
  payload: SubmitRevisionActionPayload
): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISION_SUBMIT(revisionId)),
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengsubmit perbaikan');
  return json.data;
}

/**
 * Get student's seminar history
 */
export async function getStudentSeminarHistory(): Promise<SeminarHistoryItem[]> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.HISTORY)
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat riwayat seminar');
  return json.data;
}

/**
 * Get student's specific seminar detail (for history detail page)
 */
export async function getStudentSeminarDetail(seminarId: string): Promise<StudentSeminarDetailResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.SEMINAR_DETAIL(seminarId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail seminar');
  return json.data;
}

/**
 * Get student's assessment/rubric data (read-only)
 */
export async function getStudentSeminarAssessment(seminarId: string): Promise<StudentAssessmentResponse> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.SEMINAR_ASSESSMENT(seminarId))
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data penilaian');
  return json.data;
}

/**
 * Save perbaikan text (revisionAction) without submitting
 */
export async function saveRevisionAction(
  revisionId: string,
  payload: SaveRevisionActionPayload
): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISION_SAVE_ACTION(revisionId)),
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyimpan perbaikan');
  return json.data;
}

/**
 * Submit revision (set studentSubmittedAt)
 */
export async function submitRevision(revisionId: string): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISION_SUBMIT_NEW(revisionId)),
    { method: 'POST' }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengajukan revisi');
  return json.data;
}

/**
 * Cancel revision submission (clear studentSubmittedAt)
 */
export async function cancelRevisionSubmission(revisionId: string): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISION_CANCEL_SUBMIT(revisionId)),
    { method: 'POST' }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan pengajuan');
  return json.data;
}

/**
 * Delete revision while still draft (before submission)
 */
export async function deleteRevision(revisionId: string): Promise<{ id: string }> {
  const res = await apiRequest(
    getApiUrl(API_CONFIG.ENDPOINTS.THESIS_SEMINAR_STUDENT.REVISION_DELETE(revisionId)),
    { method: 'DELETE' }
  );
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menghapus revisi');
  return json.data;
}
