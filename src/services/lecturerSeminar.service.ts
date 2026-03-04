import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AssignmentSeminarItem,
  ExaminerRequestItem,
  SupervisedStudentSeminarItem,
  LecturerSeminarDetailResponse,
  EligibleExaminer,
  LecturerSeminarExaminer,
  RespondAssignmentPayload,
  RespondAssignmentResponse,
  ExaminerAssessmentFormResponse,
  SubmitExaminerAssessmentPayload,
  SubmitExaminerAssessmentResponse,
  SupervisorFinalizationDataResponse,
  FinalizeSeminarPayload,
  FinalizeSeminarResponse,
  SeminarRevisionBoardItem,
  LecturerAudienceItem,
} from '@/types/seminar.types';

const EP = API_CONFIG.ENDPOINTS.THESIS_SEMINAR_LECTURER;

// ============================================================
// Lecturer — Examiner Requests (Permintaan Menguji)
// ============================================================

export async function getExaminerRequests(params?: {
  search?: string;
}): Promise<ExaminerRequestItem[]> {
  let endpoint = EP.EXAMINER_REQUESTS;
  const qp: string[] = [];
  if (params?.search) qp.push(`search=${encodeURIComponent(params.search)}`);
  if (qp.length) endpoint += `?${qp.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat permintaan penguji');
  return json.data;
}

// ============================================================
// Lecturer — Supervised Student Seminars (Mahasiswa Bimbingan)
// ============================================================

export async function getSupervisedStudentSeminars(params?: {
  search?: string;
}): Promise<SupervisedStudentSeminarItem[]> {
  let endpoint = EP.SUPERVISED_STUDENTS;
  const qp: string[] = [];
  if (params?.search) qp.push(`search=${encodeURIComponent(params.search)}`);
  if (qp.length) endpoint += `?${qp.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data mahasiswa bimbingan');
  return json.data;
}

// ============================================================
// Lecturer — Seminar Detail & Response
// ============================================================

export async function getLecturerSeminarDetail(
  seminarId: string,
): Promise<LecturerSeminarDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.SEMINAR_DETAIL(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail seminar');
  return json.data;
}

export async function respondExaminerAssignment(
  examinerId: string,
  payload: RespondAssignmentPayload,
): Promise<RespondAssignmentResponse> {
  const res = await apiRequest(getApiUrl(EP.RESPOND(examinerId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengirim respons');
  return json.data;
}

export async function getExaminerAssessmentForm(
  seminarId: string,
): Promise<ExaminerAssessmentFormResponse> {
  const res = await apiRequest(getApiUrl(EP.EXAMINER_ASSESSMENT(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat form penilaian');
  return json.data;
}

export async function submitExaminerAssessment(
  seminarId: string,
  payload: SubmitExaminerAssessmentPayload,
): Promise<SubmitExaminerAssessmentResponse> {
  const res = await apiRequest(getApiUrl(EP.EXAMINER_ASSESSMENT(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal submit penilaian');
  return json.data;
}

export async function getSupervisorFinalizationData(
  seminarId: string,
): Promise<SupervisorFinalizationDataResponse> {
  const res = await apiRequest(getApiUrl(EP.FINALIZATION_DATA(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data finalisasi');
  return json.data;
}

export async function finalizeSeminarBySupervisor(
  seminarId: string,
  payload: FinalizeSeminarPayload,
): Promise<FinalizeSeminarResponse> {
  const res = await apiRequest(getApiUrl(EP.FINALIZE_SEMINAR(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menetapkan hasil seminar');
  return json.data;
}

export async function getSeminarRevisionBoard(
  seminarId: string,
): Promise<SeminarRevisionBoardItem[]> {
  const res = await apiRequest(getApiUrl(EP.SEMINAR_REVISIONS(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data revisi');
  return json.data;
}

export async function approveRevision(
  seminarId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(EP.APPROVE_REVISION(seminarId, revisionId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyetujui revisi');
  return json.data;
}

export async function unapproveRevision(
  seminarId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(EP.UNAPPROVE_REVISION(seminarId, revisionId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan persetujuan revisi');
  return json.data;
}

// ============================================================
// Lecturer — Audience Management
// ============================================================

export async function getSeminarAudiences(seminarId: string): Promise<LecturerAudienceItem[]> {
  const res = await apiRequest(getApiUrl(EP.SEMINAR_AUDIENCES(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar hadir');
  return json.data;
}

export async function approveAudience(seminarId: string, studentId: string): Promise<void> {
  const res = await apiRequest(getApiUrl(EP.APPROVE_AUDIENCE(seminarId, studentId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyetujui kehadiran');
}

export async function unapproveAudience(seminarId: string, studentId: string): Promise<void> {
  const res = await apiRequest(getApiUrl(EP.UNAPPROVE_AUDIENCE(seminarId, studentId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan persetujuan');
}

export async function toggleAudiencePresence(
  seminarId: string,
  studentId: string,
  isPresent: boolean,
): Promise<void> {
  const res = await apiRequest(getApiUrl(EP.TOGGLE_AUDIENCE_PRESENCE(seminarId, studentId)), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPresent }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengubah status kehadiran');
}

// ============================================================
// Kadep — assignment
// ============================================================

export async function getAssignmentSeminars(params?: {
  search?: string;
}): Promise<AssignmentSeminarItem[]> {
  let endpoint = EP.ASSIGNMENT_LIST;
  const qp: string[] = [];
  if (params?.search) qp.push(`search=${encodeURIComponent(params.search)}`);
  if (qp.length) endpoint += `?${qp.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data penetapan penguji');
  return json.data;
}

export async function getEligibleExaminers(
  seminarId: string,
): Promise<EligibleExaminer[]> {
  const res = await apiRequest(getApiUrl(EP.ELIGIBLE_EXAMINERS(seminarId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar dosen');
  return json.data;
}

export async function assignExaminers(
  seminarId: string,
  examinerIds: string[],
): Promise<LecturerSeminarExaminer[]> {
  const res = await apiRequest(getApiUrl(EP.ASSIGN_EXAMINERS(seminarId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examinerIds }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menetapkan penguji');
  return json.data;
}
