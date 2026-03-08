import { API_CONFIG, getApiUrl } from '@/config/api';
import { apiRequest } from './auth.service';
import type {
  AssignmentDefenceItem,
  ExaminerDefenceRequestItem,
  SupervisedStudentDefenceItem,
  LecturerDefenceDetailResponse,
  EligibleDefenceExaminer,
  RespondDefenceAssignmentPayload,
  RespondDefenceAssignmentResponse,
  DefenceAssessmentFormResponse,
  SubmitDefenceAssessmentPayload,
  SubmitDefenceAssessmentResponse,
  DefenceFinalizationDataResponse,
  FinalizeDefencePayload,
  FinalizeDefenceResponse,
  DefenceRevisionBoardItem,
} from '@/types/defence.types';

const EP = API_CONFIG.ENDPOINTS.THESIS_DEFENCE_LECTURER;

// ============================================================
// Lecturer — Examiner Requests
// ============================================================

export async function getDefenceExaminerRequests(params?: {
  search?: string;
}): Promise<ExaminerDefenceRequestItem[]> {
  let endpoint = EP.EXAMINER_REQUESTS;
  const qp: string[] = [];
  if (params?.search) qp.push(`search=${encodeURIComponent(params.search)}`);
  if (qp.length) endpoint += `?${qp.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat permintaan penguji sidang');
  return json.data;
}

// ============================================================
// Lecturer — Supervised Student Defences
// ============================================================

export async function getSupervisedStudentDefences(params?: {
  search?: string;
}): Promise<SupervisedStudentDefenceItem[]> {
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
// Lecturer — Defence Detail & Response
// ============================================================

export async function getLecturerDefenceDetail(
  defenceId: string,
): Promise<LecturerDefenceDetailResponse> {
  const res = await apiRequest(getApiUrl(EP.DEFENCE_DETAIL(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat detail sidang');
  return json.data;
}

export async function respondDefenceExaminerAssignment(
  examinerId: string,
  payload: RespondDefenceAssignmentPayload,
): Promise<RespondDefenceAssignmentResponse> {
  const res = await apiRequest(getApiUrl(EP.RESPOND(examinerId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal mengirim respons');
  return json.data;
}

export async function getDefenceAssessmentForm(
  defenceId: string,
): Promise<DefenceAssessmentFormResponse> {
  const res = await apiRequest(getApiUrl(EP.DEFENCE_ASSESSMENT(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat form penilaian sidang');
  return json.data;
}

export async function submitDefenceAssessment(
  defenceId: string,
  payload: SubmitDefenceAssessmentPayload,
): Promise<SubmitDefenceAssessmentResponse> {
  const res = await apiRequest(getApiUrl(EP.DEFENCE_ASSESSMENT(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal submit penilaian sidang');
  return json.data;
}

export async function getDefenceFinalizationData(
  defenceId: string,
): Promise<DefenceFinalizationDataResponse> {
  const res = await apiRequest(getApiUrl(EP.FINALIZATION_DATA(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data berita acara sidang');
  return json.data;
}

export async function finalizeDefenceBySupervisor(
  defenceId: string,
  payload: FinalizeDefencePayload,
): Promise<FinalizeDefenceResponse> {
  const res = await apiRequest(getApiUrl(EP.FINALIZE_DEFENCE(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menetapkan hasil sidang');
  return json.data;
}

export async function getDefenceRevisionBoard(
  defenceId: string,
): Promise<DefenceRevisionBoardItem[]> {
  const res = await apiRequest(getApiUrl(EP.DEFENCE_REVISIONS(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data revisi sidang');
  return json.data;
}

export async function approveDefenceRevision(
  defenceId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(EP.APPROVE_REVISION(defenceId, revisionId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menyetujui revisi sidang');
  return json.data;
}

export async function unapproveDefenceRevision(
  defenceId: string,
  revisionId: string,
): Promise<{ id: string; isFinished: boolean }> {
  const res = await apiRequest(getApiUrl(EP.UNAPPROVE_REVISION(defenceId, revisionId)), {
    method: 'PUT',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal membatalkan persetujuan revisi sidang');
  return json.data;
}

export async function finalizeDefenceRevisions(
  defenceId: string,
): Promise<{ defenceId: string; revisionFinalizedAt: string | null; revisionFinalizedBy: string | null }> {
  const res = await apiRequest(getApiUrl(EP.FINALIZE_REVISIONS(defenceId)), {
    method: 'POST',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memfinalisasi revisi sidang');
  return json.data;
}

// ============================================================
// Kadep — Assignment
// ============================================================

export async function getDefenceAssignmentSeminars(params?: {
  search?: string;
}): Promise<AssignmentDefenceItem[]> {
  let endpoint = EP.ASSIGNMENT_LIST;
  const qp: string[] = [];
  if (params?.search) qp.push(`search=${encodeURIComponent(params.search)}`);
  if (qp.length) endpoint += `?${qp.join('&')}`;

  const res = await apiRequest(getApiUrl(endpoint));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat data penetapan penguji');
  return json.data;
}

export async function getDefenceEligibleExaminers(
  defenceId: string,
): Promise<EligibleDefenceExaminer[]> {
  const res = await apiRequest(getApiUrl(EP.ELIGIBLE_EXAMINERS(defenceId)));
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal memuat daftar dosen');
  return json.data;
}

export async function assignDefenceExaminers(
  defenceId: string,
  examinerIds: string[],
): Promise<unknown> {
  const res = await apiRequest(getApiUrl(EP.ASSIGN_EXAMINERS(defenceId)), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ examinerIds }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message || 'Gagal menetapkan penguji');
  return json.data;
}
