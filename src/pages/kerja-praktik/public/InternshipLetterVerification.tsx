import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { verifyInternshipLetter } from '@/services/internship';
import { Loading } from '@/components/ui/spinner';
import { Building2, Calendar, FileText, ShieldCheck, User, XCircle } from 'lucide-react';
import logo from '@/assets/images/neocentral-logo.png';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { checkInternshipLetterHash } from '@/services/internship/public.service';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Upload, X } from 'lucide-react';

interface VerificationData {
    id: string;
    type: 'APPLICATION' | 'ASSIGNMENT' | 'SEMINAR_MINUTES' | 'LECTURER_ASSIGNMENT';

    documentNumber: string;
    dateIssued: string;
    coordinatorName: string;
    coordinatorNim: string;
    companyName: string;
    lecturerName?: string;
    lecturerNip?: string;
    isSigned: boolean;
    signedBy: string;
    signedAt: string;
}

const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function InternshipLetterVerification() {
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<VerificationData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Hash Integrity States
    const [checkingHash, setCheckingHash] = useState(false);
    const [integrityStatus, setIntegrityStatus] = useState<'IDLE' | 'MATCH' | 'TAMPERED' | 'ERROR'>('IDLE');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const queryParams = new URLSearchParams(window.location.search);
                const queryType = queryParams.get('type') as any;

                // Detect type from path
                const isSeminarPath = window.location.pathname.includes('seminar-minutes');
                const isLecturerPath = window.location.pathname.includes('lecturer-assignment');
                
                let type: 'APPLICATION' | 'ASSIGNMENT' | 'SEMINAR_MINUTES' | 'LECTURER_ASSIGNMENT' = queryType || 'APPLICATION';
                if (isSeminarPath) type = 'SEMINAR_MINUTES';
                else if (isLecturerPath) type = 'LECTURER_ASSIGNMENT';

                const res = await verifyInternshipLetter(id, type);
                setData(res.data);
            } catch (err: any) {
                setError(err.message || "Gagal memverifikasi dokumen.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id || !data) return;

        if (file.type !== 'application/pdf') {
            toast.error("Hanya file PDF yang diperbolehkan untuk pengecekan integritas.");
            return;
        }

        try {
            setUploadedFile(file);
            setCheckingHash(true);
            setIntegrityStatus('IDLE');
            
            const res = await checkInternshipLetterHash(id, file, data.type);
            
            if (res.isValid) {
                setIntegrityStatus('MATCH');
            } else {
                setIntegrityStatus('TAMPERED');
            }
        } catch (err: any) {
            setIntegrityStatus('ERROR');
            toast.error(err.message || "Terjadi kesalahan saat mengecek integritas file.");
        } finally {
            setCheckingHash(false);
        }
    };

    const resetIntegrityCheck = () => {
        setUploadedFile(null);
        setIntegrityStatus('IDLE');
    };

    const getDocTypeLabel = (type: string) => {
        switch (type) {
            case 'APPLICATION': return 'Surat Permohonan';
            case 'ASSIGNMENT': return 'Surat Tugas';
            case 'LECTURER_ASSIGNMENT': return 'Surat Tugas Dosen';
            case 'SEMINAR_MINUTES': return 'Berita Acara Seminar (KP-006)';
            default: return type;
        }
    };

    const getPersonLabel = (type: string) => {
        switch (type) {
            case 'LECTURER_ASSIGNMENT': return 'Dosen Pembimbing';
            case 'SEMINAR_MINUTES': return 'Mahasiswa';
            default: return 'Koordinator';
        }
    };

    const getCompanyLabel = (type: string, companyName: string) => {
        switch (type) {
            case 'SEMINAR_MINUTES': return 'Seminar Kerja Praktik';
            case 'LECTURER_ASSIGNMENT': return 'Departemen Sistem Informasi';
            default: return companyName;
        }
    };

    const getSignerRole = (type: string) => {
        return type === 'SEMINAR_MINUTES' ? 'Dosen Pembimbing' : 'Ketua Departemen';
    };

    // ─── Loading State ────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="flex flex-col items-center gap-6 text-center"
                >
                    <div className="relative">
                        <div className="h-20 w-20 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#F5A623]" />
                        <ShieldCheck className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#F5A623]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-display text-xl font-extrabold tracking-tight text-gray-900">Memverifikasi Dokumen</h2>
                        <Loading size="sm" text="Sedang mengecek keaslian sistem..." />
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────
    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-md text-center"
                >
                    <div className="rounded-lg border border-gray-200/60 bg-white p-10 shadow-sm">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="font-display text-2xl font-extrabold tracking-tight text-gray-900">
                            Verifikasi <span className="text-red-500">Gagal</span>
                        </h2>
                        <p className="mt-2 font-body text-sm leading-relaxed text-gray-500">
                            Dokumen tidak ditemukan atau data tidak valid.
                        </p>
                        <p className="mt-4 font-body text-xs leading-relaxed text-gray-400">
                            Pastikan Anda memindai kode QR yang tertera pada dokumen resmi NeoCentral Departemen Sistem Informasi.
                        </p>
                        <Button asChild className="mt-8 rounded-lg bg-[#F5A623] px-6 py-3 font-body text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:bg-[#e0951a]">
                            <Link to="/">Kembali ke Beranda</Link>
                        </Button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ─── Success State ────────────────────────────────────────
    return (
        <div className="min-h-screen bg-white">
            {/* Navbar-style header */}
            <header className="border-b border-gray-200/60 bg-white/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src={logo} alt="NeoCentral Logo" className="h-9 w-auto" />
                        <span className="hidden font-display text-base font-bold text-gray-900 sm:inline">NeoCentral</span>
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="font-body text-xs font-semibold">Terverifikasi</span>
                    </span>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
                {/* Hero-style verification badge */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mb-10 sm:mb-14"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl lg:text-4xl">
                                Dokumen <span className="text-[#F5A623]">Terverifikasi</span>
                            </h1>
                            <p className="font-body text-sm text-gray-500 sm:text-base">
                                Integritas dokumen divalidasi oleh infrastruktur digital NeoCentral
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Document details grid */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                    className="grid gap-6 sm:grid-cols-2"
                >
                    {/* Document Type */}
                    <div className="space-y-1.5 rounded-lg border border-gray-200/60 bg-white p-5 transition-colors duration-200 hover:border-[#F5A623]/30">
                        <div className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wider text-gray-400">
                            <FileText className="h-3.5 w-3.5 text-[#F5A623]" />
                            Jenis Dokumen
                        </div>
                        <p className="font-display text-lg font-semibold text-gray-900">
                            {getDocTypeLabel(data.type)}
                        </p>
                    </div>

                    {/* Document Number */}
                    <div className="space-y-1.5 rounded-lg border border-gray-200/60 bg-white p-5 transition-colors duration-200 hover:border-[#F5A623]/30">
                        <div className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wider text-gray-400">
                            <Calendar className="h-3.5 w-3.5 text-[#F5A623]" />
                            Nomor Surat
                        </div>
                        <p className="font-mono text-base font-semibold text-gray-900">
                            {data.documentNumber}
                        </p>
                    </div>

                    {/* Person / Coordinator */}
                    <div className="space-y-1.5 rounded-lg border border-gray-200/60 bg-white p-5 transition-colors duration-200 hover:border-[#F5A623]/30">
                        <div className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wider text-gray-400">
                            <User className="h-3.5 w-3.5 text-[#F5A623]" />
                            {getPersonLabel(data.type)}
                        </div>
                        <p className="font-display text-lg font-semibold text-gray-900">{data.coordinatorName}</p>
                        <span className="inline-block rounded-sm bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                            NIM {data.coordinatorNim}
                        </span>
                    </div>

                    {/* Institution */}
                    <div className="space-y-1.5 rounded-lg border border-gray-200/60 bg-white p-5 transition-colors duration-200 hover:border-[#F5A623]/30">
                        <div className="flex items-center gap-2 font-body text-xs font-medium uppercase tracking-wider text-gray-400">
                            <Building2 className="h-3.5 w-3.5 text-[#F5A623]" />
                            Instansi Tujuan
                        </div>
                        <p className="font-display text-lg font-semibold text-gray-900">
                            {getCompanyLabel(data.type, data.companyName)}
                        </p>
                    </div>
                </motion.div>

                {/* Digital Signature Block */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                    className="mt-6"
                >
                    <div className="relative overflow-hidden rounded-lg bg-gray-950 p-6 sm:p-8">
                        {/* Background texture */}
                        <div className="pointer-events-none absolute right-[-5%] bottom-[-5%] opacity-[0.06] select-none">
                            <img src={logo} alt="" className="h-40 w-40 grayscale brightness-200" aria-hidden="true" />
                        </div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <ShieldCheck className="h-4 w-4 text-[#F5A623]" />
                                <span className="font-body text-xs font-medium uppercase tracking-wider text-gray-500">Pengesahan Digital</span>
                            </div>

                            <p className="font-display text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                                {data.signedBy}
                            </p>
                            <p className="mt-1 font-body text-sm font-medium text-[#F5A623]">
                                {getSignerRole(data.type)}
                            </p>

                            <div className="mt-6 flex items-center gap-3 rounded-lg bg-white/5 p-4 ring-1 ring-white/10">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#F5A623] shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
                                <div>
                                    <p className="font-body text-xs text-gray-500">Waktu Penandatanganan</p>
                                    <p className="font-body text-sm font-semibold text-white">
                                        {data.signedAt ? format(new Date(data.signedAt), "d MMMM yyyy, HH:mm 'WIB'", { locale: localeId }) : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Integrity Checker Section */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
                    className="mt-6"
                >
                    <div className="rounded-lg border border-gray-200/60 bg-gray-50/50 p-6 sm:p-8 space-y-5">
                        <div className="text-center space-y-1">
                            <h3 className="font-display text-base font-semibold text-gray-900">Cek Integritas File</h3>
                            <p className="font-body text-sm text-gray-500 max-w-sm mx-auto">
                                Unggah file PDF surat ini untuk memastikan kontennya belum dimodifikasi
                            </p>
                        </div>

                        {integrityStatus === 'IDLE' && !checkingHash && (
                            <div className="relative group">
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                />
                                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-200 p-8 transition-all duration-200 group-hover:border-[#F5A623]/40 group-hover:bg-white">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors duration-200 group-hover:bg-[#F5A623]/10 group-hover:text-[#F5A623]">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <p className="font-body text-sm text-gray-400">
                                        Klik atau drop file PDF di sini
                                    </p>
                                </div>
                            </div>
                        )}

                        {checkingHash && (
                            <div className="flex flex-col items-center justify-center gap-4 rounded-lg bg-white p-8 ring-1 ring-gray-100">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
                                <p className="font-body text-sm font-medium text-gray-600">Mengkalkulasi Hash SHA-256...</p>
                            </div>
                        )}

                        {integrityStatus === 'MATCH' && (
                            <div className="relative rounded-lg bg-emerald-50 p-6 ring-1 ring-emerald-100">
                                <button 
                                    onClick={resetIntegrityCheck}
                                    className="absolute top-4 right-4 text-emerald-300 hover:text-emerald-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                        <CheckCircle2 className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-display text-base font-semibold text-emerald-900">Integritas Sesuai</p>
                                        <p className="font-body text-sm text-emerald-600">
                                            <span className="font-medium">{uploadedFile?.name}</span> identik dengan versi sistem (Asli)
                                        </p>
                                    </div>
                                    <span className="inline-block rounded-sm bg-white/60 px-3 py-1 font-mono text-xs text-emerald-500 ring-1 ring-emerald-100">
                                        Checksum Verified: SHA-256 OK
                                    </span>
                                </div>
                            </div>
                        )}

                        {integrityStatus === 'TAMPERED' && (
                            <div className="relative rounded-lg bg-red-50 p-6 ring-1 ring-red-100">
                                <button 
                                    onClick={resetIntegrityCheck}
                                    className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <div className="flex flex-col items-center text-center gap-3">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20">
                                        <AlertTriangle className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-display text-base font-semibold text-red-900">Dokumen Dimodifikasi</p>
                                        <p className="font-body text-sm text-red-600">
                                            Peringatan: <span className="font-medium">{uploadedFile?.name}</span> telah dimanipulasi!
                                        </p>
                                    </div>
                                    <span className="inline-block rounded-sm bg-white/60 px-3 py-1 font-mono text-xs text-red-500 ring-1 ring-red-100">
                                        Checksum Mismatch: Integrity Broken
                                    </span>
                                </div>
                            </div>
                        )}

                        {integrityStatus === 'ERROR' && (
                            <div className="flex items-center justify-between rounded-lg bg-amber-50 p-5 ring-1 ring-amber-100">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                                        <XCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-display text-sm font-semibold text-amber-900">Verifikasi Gagal</p>
                                        <p className="font-body text-xs text-amber-600">Gagal membandingkan hash file</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={resetIntegrityCheck}
                                    className="text-amber-700 hover:bg-amber-100 rounded-lg font-body text-sm font-medium"
                                >
                                    Coba Lagi
                                </Button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Footer CTA */}
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
                    className="mt-10 flex flex-col items-center gap-6 text-center"
                >
                    <Button asChild className="rounded-lg bg-[#F5A623] px-8 py-3.5 font-body text-sm font-semibold text-white shadow-lg shadow-black/10 transition-all duration-200 hover:bg-[#e0951a]">
                        <Link to="/">Kembali ke Beranda</Link>
                    </Button>
                    <div className="space-y-1">
                        <p className="font-body text-xs font-medium text-gray-400">
                            Verifikasi Sistem Informasi Kerja Praktek
                        </p>
                        <p className="font-body text-xs text-gray-400">
                            Halaman ini dihasilkan oleh sistem secara otomatis dan merupakan bukti otentik.
                        </p>
                    </div>
                </motion.div>
            </main>

            {/* Minimal footer bar */}
            <footer className="mt-10 border-t border-gray-100 bg-gray-50/50 py-6">
                <p className="text-center font-body text-xs text-gray-400">
                    &copy; 2026 NeoCentral &bull; Universitas Andalas
                </p>
            </footer>
        </div>
    );
}
