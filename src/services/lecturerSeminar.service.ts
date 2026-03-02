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
