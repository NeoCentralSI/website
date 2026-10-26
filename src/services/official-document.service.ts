import axios from 'axios'
import { ENV } from '@/config/env'

export type OfficialDocumentStatus = 'current' | 'superseded' | 'revoked'

export interface OfficialDocumentVerification {
  token: string
  documentKind: string
  title: string
  documentNumber: string | null
  subjectName: string | null
  subjectIdentifier: string | null
  issuerName: string | null
  issuerRole: string | null
  issuedAt: string
  version: number
  status: OfficialDocumentStatus
  isCurrent: boolean
  supersededAt?: string | null
  /** Issue date of the version that replaced this one. */
  replacedByIssuedAt?: string | null
  integrityCheckAvailable: boolean
}

/** Label of each `documentKind` for the Cek Dokumen page. */
export const OFFICIAL_DOCUMENT_KIND_LABELS: Record<string, string> = {
  supervisor_assignment: 'Penetapan Pembimbing',
  seminar_invitation: 'Undangan Seminar Hasil',
  seminar_assessment_result: 'Berita Acara Seminar Hasil',
  seminar_audience_list: 'Daftar Hadir Seminar Hasil',
  seminar_attendance_certificate: 'Bukti Kehadiran Seminar (TA-07)',
  defence_invitation: 'Undangan Sidang Tugas Akhir',
  defence_assessment_result: 'Berita Acara Sidang Tugas Akhir',
  yudisium_participant_list: 'Daftar Peserta Yudisium',
  yudisium_cpl_report: 'Penilaian Capaian Pembelajaran Lulusan',
  yudisium_learning_certificate: 'Surat Keterangan Capaian Pembelajaran',
}

export const getOfficialDocumentKindLabel = (kind: string) => OFFICIAL_DOCUMENT_KIND_LABELS[kind] ?? 'Dokumen resmi'

/** A pasted QR link (`…/cek-dokumen/<token>` or the old `…/verify/document/<token>`) or a bare token. */
export function extractDocumentToken(input: string): string | null {
  const text = input.trim()
  if (!text) return null
  const fromLink = /(?:cek-dokumen|verify\/document)\/([A-Za-z0-9]+)/.exec(text)
  if (fromLink) return fromLink[1]
  return /^[A-Za-z0-9]{16,128}$/.test(text) ? text : null
}

export async function verifyOfficialDocument(token: string) {
  const response = await axios.get<{ success: true; data: OfficialDocumentVerification }>(
    `${ENV.API_BASE_URL}/official-documents/${token}`,
  )
  return response.data.data
}

/** The official document whose file has the same SHA-256 as the uploaded PDF (not stored). */
export async function findOfficialDocumentByFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post<{ success: true; data: OfficialDocumentVerification }>(
    `${ENV.API_BASE_URL}/official-documents/find-by-file`,
    formData,
  )
  return response.data.data
}

export function getOfficialDocumentError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}

export function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}
