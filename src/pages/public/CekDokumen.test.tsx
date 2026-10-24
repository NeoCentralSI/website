import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as service from '@/services/official-document.service'
import type { OfficialDocumentVerification } from '@/services/official-document.service'
import CekDokumenPage from './CekDokumen'

vi.mock('motion/react', () => ({
  motion: new Proxy({}, { get: () => (props: Record<string, unknown>) => <div>{props.children as never}</div> }),
  AnimatePresence: ({ children }: { children: unknown }) => children,
  useInView: () => true,
}))
vi.mock('@/services/official-document.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/official-document.service')>()),
  verifyOfficialDocument: vi.fn(),
  findOfficialDocumentByFile: vi.fn(),
}))

const TOKEN = 'a'.repeat(64)
const doc = (overrides: Partial<OfficialDocumentVerification> = {}): OfficialDocumentVerification => ({
  token: TOKEN,
  documentKind: 'supervisor_assignment',
  title: 'Penetapan Pembimbing Tugas Akhir',
  documentNumber: null,
  subjectName: 'Semester Ganjil 2026/2027',
  subjectIdentifier: '11 mahasiswa',
  issuerName: 'Dr. Ketua Departemen',
  issuerRole: 'Ketua Departemen Sistem Informasi',
  issuedAt: '2026-10-01T03:00:00.000Z',
  version: 2,
  status: 'current',
  isCurrent: true,
  integrityCheckAvailable: true,
  ...overrides,
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/cek-dokumen" element={<CekDokumenPage />} />
        <Route path="/cek-dokumen/:token" element={<CekDokumenPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.clearAllMocks())

describe('Cek Dokumen', () => {
  it('without a token: the code field and the PDF upload; a pasted QR link opens its result', async () => {
    vi.mocked(service.verifyOfficialDocument).mockResolvedValue(doc())
    renderAt('/cek-dokumen')
    expect(screen.getByRole('heading', { name: /Cek Keaslian/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Tautan atau kode dokumen')).toBeInTheDocument()
    expect(screen.getByLabelText('Unggah PDF')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Tautan atau kode dokumen'), { target: { value: `https://neocentral.dev/cek-dokumen/${TOKEN}` } })
    fireEvent.click(screen.getByRole('button', { name: 'Periksa' }))
    expect(await screen.findByText('Dokumen resmi')).toBeInTheDocument()
    expect(service.verifyOfficialDocument).toHaveBeenCalledWith(TOKEN)
  })

  it('a valid token: Dokumen resmi with the short label-value list, no file', async () => {
    vi.mocked(service.verifyOfficialDocument).mockResolvedValue(doc())
    renderAt(`/cek-dokumen/${TOKEN}`)
    expect(await screen.findByText('Dokumen resmi')).toBeInTheDocument()
    expect(screen.getByText('Penetapan Pembimbing')).toBeInTheDocument()
    expect(screen.getByText('Semester Ganjil 2026/2027 · 11 mahasiswa')).toBeInTheDocument()
    expect(screen.getByText('1 Oktober 2026')).toBeInTheDocument()
    expect(screen.queryByText('Nomor dokumen')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /unduh|download/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Periksa dokumen lain' })).toHaveAttribute('href', '/cek-dokumen')
  })

  it('a superseded version: Sudah diganti versi baru, with the date of the replacing version', async () => {
    vi.mocked(service.verifyOfficialDocument).mockResolvedValue(
      doc({ status: 'superseded', isCurrent: false, version: 1, replacedByIssuedAt: '2026-10-20T03:00:00.000Z' }),
    )
    renderAt(`/cek-dokumen/${TOKEN}`)
    expect(await screen.findByText('Sudah diganti versi baru')).toBeInTheDocument()
    expect(screen.getByText('Versi pengganti terbit 20 Oktober 2026')).toBeInTheDocument()
  })

  it('an unknown token: Tidak ditemukan', async () => {
    const notFound = Object.assign(new Error('x'), { isAxiosError: true, response: { status: 404, data: { message: 'x' } } })
    vi.mocked(service.verifyOfficialDocument).mockRejectedValue(notFound)
    renderAt(`/cek-dokumen/${'b'.repeat(64)}`)
    expect(await screen.findByText('Tidak ditemukan')).toBeInTheDocument()
  })

  it('an uploaded PDF that matches no document says so', async () => {
    const mismatch = Object.assign(new Error('x'), {
      isAxiosError: true,
      response: { status: 404, data: { message: 'Berkas tidak cocok dengan dokumen resmi mana pun. Dokumen mungkin telah diubah atau bukan terbitan NeoCentral.' } },
    })
    vi.mocked(service.findOfficialDocumentByFile).mockRejectedValue(mismatch)
    renderAt('/cek-dokumen')
    const file = new File(['%PDF-1.7'], 'dokumen.pdf', { type: 'application/pdf' })
    fireEvent.change(screen.getByLabelText('Unggah PDF'), { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText(/Berkas tidak cocok dengan dokumen resmi mana pun/)).toBeInTheDocument())
  })

  it('reads a bare code, a QR link and an old verification link', () => {
    expect(service.extractDocumentToken(TOKEN)).toBe(TOKEN)
    expect(service.extractDocumentToken(`http://localhost:5173/verify/document/${TOKEN}`)).toBe(TOKEN)
    expect(service.extractDocumentToken('bukan kode')).toBeNull()
  })
})
