import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, FileUp, History, Loader2, SearchX } from 'lucide-react'

import { Footer, LandingNavbar } from '@/components/landing'
import {
  extractDocumentToken,
  findOfficialDocumentByFile,
  getOfficialDocumentError,
  getOfficialDocumentKindLabel,
  isNotFoundError,
  verifyOfficialDocument,
  type OfficialDocumentVerification,
} from '@/services/official-document.service'

const MAX_PDF_BYTES = 10 * 1024 * 1024

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(new Date(value))
}

/**
 * Cek Keaslian Dokumen: public check of a NeoCentral official document, by its QR link or code,
 * or by uploading the PDF (compared by its hash, never stored). The file itself is never shown.
 */
export default function CekDokumenPage() {
  const { token } = useParams<{ token: string }>()
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <LandingNavbar solid />
      <main className="flex flex-1 items-start justify-center bg-[#FFF8F0] px-4 pb-16 pt-28 sm:px-6">
        <div className="w-full max-w-xl">
          <div className="mb-6 text-center">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Cek Keaslian <span className="text-[#F5A623]">Dokumen</span>
            </h1>
            <p className="mt-2 font-body text-base text-gray-600">Pastikan dokumen benar diterbitkan oleh NeoCentral</p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {token ? <DocumentResult token={token} /> : <CheckForm />}
          </div>
        </div>
      </main>
      <Footer showLocation={false} />
    </div>
  )
}

function CheckForm() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const submitCode = (event: FormEvent) => {
    event.preventDefault()
    const found = extractDocumentToken(code)
    if (!found) {
      setCodeError('Tempel tautan dari QR atau kode dokumen.')
      return
    }
    navigate(`/cek-dokumen/${found}`)
  }

  const checkFile = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    setFileError(null)
    if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
      setFileError('Hanya berkas PDF yang dapat diperiksa.')
      return
    }
    if (file.size > MAX_PDF_BYTES) {
      setFileError('Ukuran berkas maksimal 10 MB.')
      return
    }
    setChecking(true)
    try {
      const document = await findOfficialDocumentByFile(file)
      navigate(`/cek-dokumen/${document.token}`)
    } catch (error) {
      setFileError(getOfficialDocumentError(error, 'Berkas tidak dapat diperiksa.'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-6 font-body">
      <form onSubmit={submitCode} className="space-y-2">
        <label htmlFor="document-code" className="block text-sm font-semibold text-gray-900">
          Tautan atau kode dokumen
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="document-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value)
              setCodeError(null)
            }}
            placeholder="https://…/cek-dokumen/… atau kodenya"
            className="h-11 min-w-0 flex-1 rounded-lg border border-gray-300 px-3 text-sm outline-none transition-colors focus:border-[#F5A623] focus:ring-2 focus:ring-[#F5A623]/20"
          />
          <button
            type="submit"
            className="h-11 rounded-lg bg-[#F5A623] px-5 text-sm font-medium text-white transition-colors hover:bg-[#e0951a]"
          >
            Periksa
          </button>
        </div>
        {codeError && <p className="text-sm text-red-600">{codeError}</p>}
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        atau
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-semibold text-gray-900">Unggah PDF</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          aria-label="Unggah PDF"
          onChange={(event) => void checkFile(event.target.files?.[0])}
        />
        <button
          type="button"
          disabled={checking}
          onClick={() => inputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600 transition-colors hover:border-[#F5A623] hover:bg-[#FFF8F0] hover:text-gray-900 disabled:opacity-60"
        >
          {checking ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileUp className="h-5 w-5" />}
          {checking ? 'Memeriksa berkas…' : 'Pilih PDF untuk diperiksa (maks. 10 MB)'}
        </button>
        {fileError && <p className="text-sm text-red-600">{fileError}</p>}
      </div>
    </div>
  )
}

function DocumentResult({ token }: { token: string }) {
  const [data, setData] = useState<OfficialDocumentVerification | null>(null)
  const [state, setState] = useState<'loading' | 'found' | 'not-found' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    setState('loading')
    verifyOfficialDocument(token)
      .then((result) => {
        if (!active) return
        setData(result)
        setState('found')
      })
      .catch((error) => {
        if (!active) return
        setState(isNotFoundError(error) ? 'not-found' : 'error')
        setMessage(getOfficialDocumentError(error, 'Dokumen tidak dapat diperiksa saat ini.'))
      })
    return () => {
      active = false
    }
  }, [token])

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-10 font-body text-sm text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Memeriksa dokumen…
      </div>
    )
  }

  return (
    <div className="space-y-6 font-body">
      {state === 'found' && data ? (
        <>
          <StatusBanner data={data} />
          <dl className="grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-3 text-sm">
            <Row label="Jenis dokumen" value={getOfficialDocumentKindLabel(data.documentKind)} />
            <Row label="Judul" value={data.title} />
            {data.documentNumber && <Row label="Nomor dokumen" value={data.documentNumber} />}
            {(data.subjectName || data.subjectIdentifier) && (
              <Row label="Atas nama" value={[data.subjectName, data.subjectIdentifier].filter(Boolean).join(' · ')} />
            )}
            <Row label="Diterbitkan oleh" value={[data.issuerName, data.issuerRole].filter(Boolean).join(', ') || 'NeoCentral'} />
            <Row label="Tanggal terbit" value={formatDate(data.issuedAt)} />
            <Row label="Versi" value={String(data.version)} />
          </dl>
        </>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <SearchX className="mt-0.5 h-6 w-6 shrink-0 text-gray-500" />
          <div>
            <p className="font-display text-lg font-bold text-gray-900">
              {state === 'not-found' ? 'Tidak ditemukan' : 'Belum dapat diperiksa'}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              {state === 'not-found' ? 'Kode ini tidak cocok dengan dokumen resmi NeoCentral mana pun.' : message}
            </p>
          </div>
        </div>
      )}
      <Link
        to="/cek-dokumen"
        className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-gray-300 text-sm font-medium text-gray-900 transition-colors hover:border-[#F5A623] hover:text-[#F5A623]"
      >
        Periksa dokumen lain
      </Link>
    </div>
  )
}

function StatusBanner({ data }: { data: OfficialDocumentVerification }) {
  if (data.isCurrent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
        <div>
          <p className="font-display text-lg font-bold text-green-800">Dokumen resmi</p>
          <p className="mt-1 text-sm text-green-800/80">Versi terbaru yang diterbitkan NeoCentral</p>
        </div>
      </div>
    )
  }
  if (data.status === 'revoked') {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <SearchX className="mt-0.5 h-6 w-6 shrink-0 text-red-600" />
        <p className="font-display text-lg font-bold text-red-800">Dokumen telah dicabut</p>
      </div>
    )
  }
  const replacedOn = data.replacedByIssuedAt ?? data.supersededAt
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <History className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
      <div>
        <p className="font-display text-lg font-bold text-amber-800">Sudah diganti versi baru</p>
        <p className="mt-1 text-sm text-amber-800/80">
          {replacedOn ? `Versi pengganti terbit ${formatDate(replacedOn)}` : 'Dokumen ini resmi, tetapi bukan versi terbaru'}
        </p>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900 [overflow-wrap:anywhere]">{value}</dd>
    </>
  )
}
