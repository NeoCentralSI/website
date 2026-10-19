import { getApiUrl } from '@/config/api';
import { apiRequest } from '@/services/auth.service';
import { getJson, parse, send } from '@/services/thesis-proposal/api';
import type {
  AssessmentForm,
  AssessmentQueue,
  AssessmentView,
  AssessorParty,
  AttendanceOverview,
  AttendancePreview,
  AttendanceUploadResult,
  ClassMonitoring,
  PromotionPreview,
  PromotionRunResult,
  ScoreInput,
} from '@/types/research-method.types';

const BASE = '/research-method';
const year = (academicYearId?: string | null) => (academicYearId ? `academicYearId=${encodeURIComponent(academicYearId)}` : '');
const withQuery = (path: string, query: string) => (query ? `${path}?${query}` : path);

// Presensi (10.5)
export const getAttendance = (academicYearId: string) =>
  getJson<AttendanceOverview>(withQuery(`${BASE}/attendance-imports`, year(academicYearId)), 'Gagal memuat presensi');

async function postAttendance<T>(path: string, academicYearId: string, files: File[], fallback: string) {
  const body = new FormData();
  body.append('academicYearId', academicYearId);
  files.forEach((file) => body.append('files', file));
  return parse<T>(await apiRequest(getApiUrl(path), { method: 'POST', body }), fallback);
}
export const previewAttendance = (academicYearId: string, files: File[]) =>
  postAttendance<AttendancePreview>(`${BASE}/attendance-imports/preview`, academicYearId, files, 'Gagal membaca berkas presensi');
export const uploadAttendance = (academicYearId: string, files: File[]) =>
  postAttendance<AttendanceUploadResult>(`${BASE}/attendance-imports`, academicYearId, files, 'Gagal mengunggah presensi');

// Penilaian Proposal (10.2)
export const getAssessmentForm = (party: AssessorParty, academicYearId: string) =>
  getJson<AssessmentForm>(withQuery(`${BASE}/assessments/form`, `party=${party}&${year(academicYearId)}`), 'Gagal memuat form penilaian');
export const getSupervisorQueue = (academicYearId?: string | null) =>
  getJson<AssessmentQueue>(withQuery(`${BASE}/assessments/supervisor`, year(academicYearId)), 'Gagal memuat mahasiswa proposal');
export const getCoordinatorQueue = (academicYearId?: string | null) =>
  getJson<AssessmentQueue>(withQuery(`${BASE}/assessments/coordinator`, year(academicYearId)), 'Gagal memuat penilaian proposal');
export const getAssessment = (id: string) => getJson<AssessmentView>(`${BASE}/assessments/${id}`, 'Gagal memuat penilaian');
export const submitScore = (id: string, party: AssessorParty, scores: ScoreInput[]) =>
  send<AssessmentView>('POST', `${BASE}/assessments/${id}/${party}-score`, { scores }, 'Gagal mengirim nilai');
export const setMinimumScore = (academicYearId: string, minimumScore: number) =>
  send<{ academicYearId: string; researchMethodMinimumScore: number }>('PATCH', `${BASE}/academic-years/${academicYearId}/minimum-score`, { minimumScore }, 'Gagal menyimpan nilai minimum');

// Kelulusan, monitoring, ekspor
export const getPromotionPreview = () => getJson<PromotionPreview>(`${BASE}/promotions`, 'Gagal memuat proses kelulusan');
export const runPromotion = () => send<PromotionRunResult>('POST', `${BASE}/promotions/run`, undefined, 'Gagal menjalankan proses kelulusan');
export const getMonitoring = (academicYearId?: string | null) =>
  getJson<ClassMonitoring>(withQuery(`${BASE}/monitoring`, year(academicYearId)), 'Gagal memuat monitoring kelas');
/** Opened with `lib/authenticatedFile` (Authorization header). */
export const scoreRecapUrl = (academicYearId: string) => withQuery(`${BASE}/exports/scores`, year(academicYearId));
export const passedTitlesUrl = (academicYearId: string) => withQuery(`${BASE}/exports/passed-titles`, year(academicYearId));
