import { describe, expect, it } from 'vitest'
import { getOfficialDocumentKindLabel } from './official-document.service'

describe('getOfficialDocumentKindLabel', () => {
  it('names the TA-07 attendance form on the Cek Dokumen page', () => {
    expect(getOfficialDocumentKindLabel('seminar_attendance_certificate')).toBe('Bukti Kehadiran Seminar (TA-07)')
  })

  it('falls back for an unknown kind', () => {
    expect(getOfficialDocumentKindLabel('unknown_kind')).toBe('Dokumen resmi')
  })
})
