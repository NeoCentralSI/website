import { getJson, send } from '@/services/thesis-proposal/api';
import type {
  AssessmentForm,
  AssessmentQueue,
  AssessmentScoreForm,
  AssessmentView,
  AssessorParty,
  ClassMonitoring,
  ScoreInput,
} from '@/types/research-method.types';

const BASE = '/research-method';
const year = (academicYearId?: string | null) => (academicYearId ? `academicYearId=${encodeURIComponent(academicYearId)}` : '');
const withQuery = (path: string, query: string) => (query ? `${path}?${query}` : path);

// Penilaian Proposal
export const getAssessmentForm = (party: AssessorParty, academicYearId: string) =>
  getJson<AssessmentForm>(withQuery(`${BASE}/assessments/form`, `party=${party}&${year(academicYearId)}`), 'Gagal memuat form penilaian');
export const getSupervisorQueue = (academicYearId?: string | null) =>
  getJson<AssessmentQueue>(withQuery(`${BASE}/assessments/supervisor`, year(academicYearId)), 'Gagal memuat mahasiswa proposal');
export const getCoordinatorQueue = (academicYearId?: string | null) =>
  getJson<AssessmentQueue>(withQuery(`${BASE}/assessments/coordinator`, year(academicYearId)), 'Gagal memuat penilaian proposal');
export const getAssessment = (id: string) => getJson<AssessmentView>(`${BASE}/assessments/${id}`, 'Gagal memuat penilaian');
/** The score form of one attempt for the supervisor or the coordinator (own draft, the other party's sent score). */
export const getAssessmentScoreForm = (id: string, party: AssessorParty) =>
  getJson<AssessmentScoreForm>(`${BASE}/assessments/${id}/${party}-form`, 'Gagal memuat form penilaian');
/** A draft can be saved again and again; sending locks the score. */
export const submitScore = (id: string, party: AssessorParty, scores: ScoreInput[], isDraft: boolean) =>
  send<AssessmentView>('POST', `${BASE}/assessments/${id}/${party}-score`, { scores, isDraft }, isDraft ? 'Gagal menyimpan draf' : 'Gagal mengirim nilai');
export const setMinimumScore = (academicYearId: string, minimumScore: number) =>
  send<{ academicYearId: string; researchMethodMinimumScore: number }>('PATCH', `${BASE}/academic-years/${academicYearId}/minimum-score`, { minimumScore }, 'Gagal menyimpan nilai minimum');

// Monitoring and exports
export const getMonitoring = (academicYearId?: string | null) =>
  getJson<ClassMonitoring>(withQuery(`${BASE}/monitoring`, year(academicYearId)), 'Gagal memuat monitoring kelas');
/** Opened with `lib/authenticatedFile` (Authorization header). */
export const scoreRecapUrl = (academicYearId: string) => withQuery(`${BASE}/exports/scores`, year(academicYearId));
export const passedTitlesUrl = (academicYearId: string) => withQuery(`${BASE}/exports/passed-titles`, year(academicYearId));
