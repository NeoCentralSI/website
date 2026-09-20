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
  integrityCheckAvailable: boolean
}

export async function verifyOfficialDocument(token: string) {
  const response = await axios.get<{ success: true; data: OfficialDocumentVerification }>(
    `${ENV.API_BASE_URL}/official-documents/${token}`,
  )
  return response.data.data
}

export async function checkOfficialDocumentIntegrity(token: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axios.post<{
    success: true
    isValid: boolean
    status: OfficialDocumentStatus
    message: string
  }>(`${ENV.API_BASE_URL}/official-documents/${token}/check-hash`, formData)

  return response.data
}

export function getOfficialDocumentError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback
  }
  return error instanceof Error ? error.message : fallback
}
