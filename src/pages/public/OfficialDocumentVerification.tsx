import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileText,
  History,
  Loader2,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react'
import logo from '@/assets/images/neocentral-logo.png'
import { Button } from '@/components/ui/button'
import {
  checkOfficialDocumentIntegrity,
  getOfficialDocumentError,
  type OfficialDocumentVerification,
  verifyOfficialDocument,
} from '@/services/official-document.service'

type IntegrityState = 'idle' | 'checking' | 'valid' | 'invalid' | 'error'

function formatIssuedAt(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value))
}

export default function OfficialDocumentVerificationPage() {
  const { token } = useParams<{ token: string }>()
  const inputRef = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<OfficialDocumentVerification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [integrity, setIntegrity] = useState<IntegrityState>('idle')
  const [integrityMessage, setIntegrityMessage] = useState('')
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      if (!token) {
        setError('Token verifikasi dokumen tidak tersedia.')
        setLoading(false)
        return
      }

      try {
        const result = await verifyOfficialDocument(token)
        if (active) setData(result)
      } catch (requestError) {
        if (active) {
          setError(getOfficialDocumentError(requestError, 'Dokumen resmi tidak dapat diverifikasi.'))
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [token])

  async function handleFile(file?: File) {
    if (!file || !token) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setIntegrity('error')
      setIntegrityMessage('Pilih file dengan format PDF.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setIntegrity('error')
      setIntegrityMessage('Ukuran file PDF maksimal 10 MB.')
      return
    }

    setFileName(file.name)
    setIntegrity('checking')
    setIntegrityMessage('Memeriksa hash SHA-256 dokumen...')

    try {
      const result = await checkOfficialDocumentIntegrity(token, file)
      setIntegrity(result.isValid ? 'valid' : 'invalid')
      setIntegrityMessage(result.message)
    } catch (requestError) {
      setIntegrity('error')
      setIntegrityMessage(getOfficialDocumentError(requestError, 'Pemeriksaan integritas gagal.'))
    }
  }

  const statusConfig = data?.status === 'current'
    ? {
        icon: CheckCircle2,
        label: 'Dokumen resmi dan berlaku',
        className: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      }
    : data?.status === 'superseded'
      ? {
          icon: History,
          label: 'Dokumen resmi, tetapi bukan versi terbaru',
          className: 'border-amber-200 bg-amber-50 text-amber-800',
        }
      : {
          icon: XCircle,
          label: 'Dokumen telah dicabut',
          className: 'border-red-200 bg-red-50 text-red-800',
        }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          Memverifikasi dokumen...
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Dokumen Tidak Terverifikasi</h1>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Kembali ke NeoCentral</Link>
          </Button>
        </div>
      </main>
    )
  }

  const StatusIcon = statusConfig.icon

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="NeoCentral" className="h-10 w-auto" />
            <div>
              <div className="font-semibold text-slate-900">NeoCentral</div>
              <div className="text-xs text-slate-500">Sistem Informasi</div>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <ShieldCheck className="h-5 w-5 text-orange-500" />
            Validasi Dokumen
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${statusConfig.className}`}>
              <StatusIcon className="h-4 w-4" />
              {statusConfig.label}
            </div>
            <div className="mt-5 flex items-start gap-4">
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <FileCheck2 className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{data.title}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Tercatat pada registry dokumen resmi NeoCentral, versi {data.version}.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 sm:p-8">
            {data.documentNumber && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Nomor dokumen</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{data.documentNumber}</div>
              </div>
            )}
            {data.subjectName && (
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Subjek dokumen</div>
                <div className="mt-1 text-sm font-medium text-slate-900">{data.subjectName}</div>
                {data.subjectIdentifier && <div className="text-sm text-slate-500">{data.subjectIdentifier}</div>}
              </div>
            )}
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Diterbitkan oleh</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{data.issuerName || 'NeoCentral'}</div>
              {data.issuerRole && <div className="text-sm text-slate-500">{data.issuerRole}</div>}
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Waktu penerbitan</div>
              <div className="mt-1 text-sm font-medium text-slate-900">{formatIssuedAt(data.issuedAt)}</div>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50/70 p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 text-slate-500" />
              <div>
                <h2 className="font-medium text-slate-900">Periksa keutuhan file PDF</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Unggah PDF yang Anda terima untuk mencocokkan hash file dengan versi yang diterbitkan NeoCentral.
                </p>
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              disabled={integrity === 'checking' || !data.integrityCheckAvailable}
              onClick={() => inputRef.current?.click()}
            >
              {integrity === 'checking' ? <Loader2 className="animate-spin" /> : <Upload />}
              {integrity === 'checking' ? 'Memeriksa...' : 'Pilih PDF'}
            </Button>

            {fileName && <p className="mt-3 text-xs text-slate-500">File: {fileName}</p>}

            {integrity !== 'idle' && integrity !== 'checking' && (
              <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 text-sm ${
                integrity === 'valid'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : integrity === 'invalid'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}>
                {integrity === 'valid'
                  ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
                <span>{integrityMessage}</span>
              </div>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-slate-500">
          QR membuktikan penerbitan dan integritas dokumen di NeoCentral; QR bukan tanda tangan elektronik tersertifikasi individual.
        </p>
      </div>
    </main>
  )
}
