/**
 * Labels of the Log Aktivitas page: actions, object types, and the changed fields with a
 * readable value. The server sends the codes (`audit_logs.action`, `entity`, the keys of
 * `changes`); the page never shows them raw.
 */
import { formatDateShortId, formatDateTimeWib, formatRoleName } from '@/lib/text';
import {
  STUDENT_STATUS_LABELS,
  THESIS_STATUS_LABELS,
  THESIS_TERMINATION_REASON_LABELS,
  type ThesisLifecycleStatus,
  type ThesisTerminationReason,
} from '@/lib/thesisLabels';

export const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Buat pengguna',
  USER_UPDATED: 'Ubah data pengguna',
  USER_ROLES_UPDATED: 'Ubah peran',
  USER_ACTIVATION_CHANGED: 'Ubah status verifikasi',
  USERS_IMPORTED: 'Impor pengguna',
  STUDENT_STATUS_CHANGED: 'Ubah status mahasiswa',
  STUDENT_ACADEMIC_UPDATED: 'Ubah data akademik',
  STUDENT_PERIOD_FLAGS_SET: 'Ubah keikutsertaan semester',
  STUDENT_PERIOD_FLAGS_FOLLOW_SIA: 'Ikuti data SIA',
  STUDENT_PERIOD_FLAGS_IMPORTED: 'Impor keikutsertaan',
  LECTURER_UPDATED: 'Ubah data dosen',
  THESIS_CREATED: 'Tambah tugas akhir',
  THESIS_UPDATED: 'Ubah tugas akhir',
  THESIS_STATUS_CHANGED: 'Ubah status tugas akhir',
  THESIS_DELETED: 'Hapus tugas akhir',
  ACADEMIC_YEAR_CREATED: 'Tambah tahun ajaran',
  ACADEMIC_YEAR_UPDATED: 'Ubah tahun ajaran',
  SUPERVISION_LIMIT_UPDATED: 'Ubah batas bimbingan',
  ASSESSMENT_MASTER_CHANGED: 'Ubah CPMK atau rubrik',
  SUPERVISOR_ASSIGNMENT_ISSUED: 'Terbitkan penetapan pembimbing',
  SUPERVISOR_REQUEST_KADEP_APPROVED: 'Setujui pengajuan di atas kuota',
  SUPERVISOR_REQUEST_KADEP_REJECTED: 'Tolak pengajuan pembimbing',
  SUPERVISOR_REQUEST_KADEP_REDIRECTED: 'Alihkan pengajuan pembimbing',
  SUPERVISOR_REQUEST_KADEP_REVISION_REQUESTED: 'Minta revisi pengajuan pembimbing',
  CHANGE_REQUEST_APPROVED: 'Setujui perubahan tugas akhir',
  CHANGE_REQUEST_REJECTED: 'Tolak perubahan tugas akhir',
  GUIDANCE_EVALUATION_APPROVED: 'Setujui evaluasi bimbingan',
  GUIDANCE_EVALUATION_REJECTED: 'Tolak evaluasi bimbingan',
};

export const ACTIVITY_ENTITY_LABELS: Record<string, string> = {
  USER: 'Pengguna',
  STUDENT: 'Mahasiswa',
  LECTURER: 'Dosen',
  THESIS: 'Tugas akhir',
  ACADEMIC_YEAR: 'Tahun ajaran',
  SUPERVISION_QUOTA: 'Batas bimbingan',
  CPMK: 'CPMK',
  ASSESSMENT_CRITERIA: 'Kriteria penilaian',
  ASSESSMENT_RUBRIC: 'Rubrik penilaian',
  THESIS_SUPERVISOR_REQUEST: 'Pengajuan pembimbing',
  SUPERVISOR_ASSIGNMENT_BATCH: 'Penetapan pembimbing',
  THESIS_CHANGE_REQUEST: 'Perubahan tugas akhir',
  THESIS_GUIDANCE_EVALUATION: 'Evaluasi bimbingan',
};

export const getActivityActionLabel = (action: string) => ACTIVITY_ACTION_LABELS[action] ?? 'Tindakan lain';
export const getActivityEntityLabel = (entity: string) => ACTIVITY_ENTITY_LABELS[entity] ?? 'Objek lain';

export const ACTIVITY_ACTION_OPTIONS = Object.entries(ACTIVITY_ACTION_LABELS).map(([value, label]) => ({ value, label }));
export const ACTIVITY_ENTITY_OPTIONS = Object.entries(ACTIVITY_ENTITY_LABELS).map(([value, label]) => ({ value, label }));

/** Field names of `changes`, as shown in the detail. Unknown fields are left out. */
const FIELD_LABELS: Record<string, string> = {
  fullName: 'Nama',
  email: 'Email',
  identityNumber: 'NIM/NIP',
  identityType: 'Tipe identitas',
  gender: 'Jenis kelamin',
  isVerified: 'Terverifikasi',
  roles: 'Peran',
  status: 'Status',
  sksCompleted: 'SKS selesai',
  enrollmentYear: 'Tahun masuk',
  currentSemester: 'Semester berjalan',
  gpa: 'IPK',
  graduationPredicate: 'Predikat kelulusan',
  mandatoryCoursesCompleted: 'Mata kuliah wajib lulus',
  mkwuCompleted: 'MKWU lulus',
  internshipCompleted: 'Kerja praktik lulus',
  kknCompleted: 'KKN lulus',
  researchMethodCompleted: 'Metode Penelitian lulus',
  scienceGroupId: 'Kelompok keilmuan',
  title: 'Judul',
  thesisTopicId: 'Topik',
  academicYearId: 'Tahun ajaran',
  startDate: 'Tanggal mulai',
  supervisors: 'Pembimbing',
  terminationReason: 'Alasan penghentian',
  terminationNote: 'Catatan penghentian',
  semesterQuota: 'Kuota semester',
  totalLimit: 'Batas total',
  semester: 'Semester',
  year: 'Tahun',
  endDate: 'Tanggal selesai',
  name: 'Nama',
  code: 'Kode',
  description: 'Deskripsi',
  maxScore: 'Skor maksimum',
  minScore: 'Skor minimum',
  minimumScore: 'Nilai minimum',
  takingResearchMethod: 'Mengambil Metode Penelitian',
  takingThesisCourse: 'Mengambil Tugas Akhir',
  created: 'Dibuat',
  updated: 'Diperbarui',
  failed: 'Gagal',
  kind: 'Jenis impor',
  notes: 'Catatan',
};

/** Metadata keys worth showing, with their label. */
const METADATA_LABELS: Record<string, string> = {
  source: 'Sumber',
  operation: 'Operasi',
  scope: 'Lingkup',
  thesisEffect: 'Akibat pada tugas akhir',
  releasedSupervisors: 'Pembimbing dilepas',
  cancelledGuidances: 'Sesi dibatalkan',
  cancelledChangeRequests: 'Pengajuan perubahan ditutup',
  closedEvaluations: 'Evaluasi ditutup',
};

const SOURCE_LABELS: Record<string, string> = {
  admin: 'Admin',
  import: 'Impor',
  devtools: 'DevTools',
  'master-data-ta': 'Data TA',
  'student-status': 'Status mahasiswa',
  'guidance-evaluation': 'Evaluasi bimbingan',
  defence: 'Sidang',
  sia: 'SIA',
};
const OPERATION_LABELS: Record<string, string> = { create: 'Tambah', update: 'Ubah', delete: 'Hapus', copy: 'Salin dari periode lain' };
const SCOPE_LABELS: Record<string, string> = { proposal: 'Metode Penelitian', thesis: 'Tugas Akhir' };
const THESIS_EFFECT_LABELS: Record<string, string> = { paused: 'Dijeda', resumed: 'Dilanjutkan', terminated: 'Dihentikan (Gagal)' };
const IMPORT_KIND_LABELS: Record<string, string> = { users: 'Pengguna', students: 'Mahasiswa', lecturers: 'Dosen' };

const DATE_KEYS = new Set(['startDate', 'endDate']);

/** A value of `changes` as readable text. */
export function formatActivityValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (key === 'gender') return value ? 'Perempuan' : 'Laki-laki';
  if (key === 'status' && typeof value === 'string') {
    return STUDENT_STATUS_LABELS[value] ?? THESIS_STATUS_LABELS[value as ThesisLifecycleStatus] ?? value;
  }
  if (key === 'terminationReason' && typeof value === 'string') {
    return THESIS_TERMINATION_REASON_LABELS[value as ThesisTerminationReason] ?? value;
  }
  if (key === 'semester' && typeof value === 'string') return value === 'genap' ? 'Genap' : value === 'ganjil' ? 'Ganjil' : value;
  if (key === 'identityType' && value === 'OTHER') return 'Lainnya';
  if (key === 'source' && typeof value === 'string') return SOURCE_LABELS[value] ?? value;
  if (key === 'operation' && typeof value === 'string') return OPERATION_LABELS[value] ?? value;
  if (key === 'scope' && typeof value === 'string') return SCOPE_LABELS[value] ?? value;
  if (key === 'thesisEffect' && typeof value === 'string') return THESIS_EFFECT_LABELS[value] ?? value;
  if (key === 'kind' && typeof value === 'string') return IMPORT_KIND_LABELS[value] ?? value;
  if (DATE_KEYS.has(key) && typeof value === 'string') return formatDateShortId(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '-';
    return value
      .map((item) => {
        if (item && typeof item === 'object' && 'name' in item) {
          const role = item as { name?: string | null; status?: string | null };
          return `${formatRoleName(role.name ?? '-')}${role.status && role.status !== 'active' ? ' (nonaktif)' : ''}`;
        }
        return String(item);
      })
      .join(', ');
  }
  if (typeof value === 'object') return 'Berubah';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTimeWib(value);
  return String(value);
}

export interface ActivityChangeRow {
  label: string;
  before: string | null;
  after: string;
}

/**
 * The detail of a log entry as label, before and after. Only known fields are listed;
 * ids and internal values are left out.
 */
export function describeActivityChanges(changes: { oldValues?: unknown; newValues?: unknown; metadata?: unknown } | null) {
  const asRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const oldValues = asRecord(changes?.oldValues);
  const newValues = asRecord(changes?.newValues);
  const metadata = asRecord(changes?.metadata);
  const hasOld = Object.keys(oldValues).length > 0;

  const keys = [...new Set([...Object.keys(oldValues), ...Object.keys(newValues)])].filter((key) => FIELD_LABELS[key]);
  const fields: ActivityChangeRow[] = keys.map((key) => ({
    label: FIELD_LABELS[key],
    before: hasOld ? formatActivityValue(key, oldValues[key]) : null,
    after: key in newValues ? formatActivityValue(key, newValues[key]) : '-',
  }));
  const notes = Object.keys(metadata)
    .filter((key) => METADATA_LABELS[key] && metadata[key] !== null && metadata[key] !== undefined)
    .map((key) => ({ label: METADATA_LABELS[key], value: formatActivityValue(key, metadata[key]) }));
  return { fields, notes, hasBefore: hasOld };
}
