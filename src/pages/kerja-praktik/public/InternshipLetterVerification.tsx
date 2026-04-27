import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { verifyInternshipLetter } from '@/services/internship';
import { Loading } from '@/components/ui/spinner';
import { Building2, Calendar, FileText, ShieldCheck, User, XCircle } from 'lucide-react';
import logo from '@/assets/images/neocentral-logo.png';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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

    if (loading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative">
                        <div className="h-24 w-24 animate-spin rounded-full border-4 border-[#F7931E]/20 border-t-[#F7931E]" />
                        <ShieldCheck className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-[#F7931E]" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-black text-black uppercase tracking-tighter">Memverifikasi Dokumen</h2>
                        <Loading size="sm" text="Sedang mengecek keaslian sistem..." />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4">
                <Card className="w-full max-w-md border-none shadow-2xl rounded-[2.5rem] overflow-hidden ring-1 ring-gray-100">
                    <CardHeader className="text-center pb-2 pt-12 px-8">
                        <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-red-50 p-5 flex items-center justify-center">
                            <XCircle className="h-full w-full text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-black text-black tracking-tight uppercase">Verifikasi Gagal</CardTitle>
                        <CardDescription className="text-gray-500 font-bold">Dokumen tidak ditemukan atau data tidak valid.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center px-8 py-4">
                        <p className="text-sm text-gray-400 font-medium leading-relaxed italic">
                            Pastikan Anda memindai kode QR yang tertera pada dokumen resmi "NeoCentral" Departemen Sistem Informasi.
                        </p>
                    </CardContent>
                    <CardFooter className="flex justify-center p-12 pt-4">
                        <Button asChild className="bg-black text-white hover:bg-gray-800 px-10 py-6 rounded-full font-black transition-all active:scale-95 shadow-xl">
                            <Link to="/">KEMBALI KE BERANDA</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 sm:p-8 relative overflow-hidden">
            {/* Background Decorative Element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 pointer-events-none opacity-[0.03] select-none text-center">
                <div className="text-[12rem] sm:text-[25rem] font-black text-black leading-none whitespace-nowrap uppercase tracking-tighter">
                    NEO CENTRAL
                </div>
            </div>

            <div className="w-full max-w-4xl relative z-10">
                {/* Header Branding */}
                <div className="mb-12 flex flex-col items-center text-center">
                    <div className="mb-4 flex items-center gap-4">
                        <img src={logo} alt="NeoCentral Logo" className="h-16 w-16 object-contain" />
                        <div className="text-left">
                            <h1 className="text-4xl font-black tracking-tighter text-black leading-none uppercase">
                                NEO<span className="text-[#F7931E]">CENTRAL</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F7931E] mt-1">Sistem Informasi Universitas Andalas</p>
                        </div>
                    </div>
                </div>

                <Card className="overflow-hidden border-none rounded-[3rem] bg-white ring-1 ring-gray-100">
                    <CardHeader className="bg-white pb-8 pt-14 text-center">
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-white">
                            <ShieldCheck className="h-4 w-4 text-[#F7931E]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">VERIFIED DIGITAL</span>
                        </div>
                        <CardTitle className="mt-4 text-5xl font-black text-black tracking-tighter uppercase leading-none">DOKUMEN ASLI</CardTitle>
                        <CardDescription className="text-gray-400 font-bold mt-3 max-w-sm mx-auto uppercase tracking-widest text-[10px]">
                            Integritas dokumen divalidasi oleh infrastruktur digital NeoCentral
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="bg-white px-8 sm:px-16 pb-1">
                        <div className="grid gap-8 rounded-[2.5rem] bg-gray-50/50 p-10 sm:grid-cols-2 ring-1 ring-gray-100">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F7931E]">
                                    <FileText className="h-3 w-3" /> Jenis Dokumen
                                </label>
                                <p className="text-xl font-black text-black uppercase tracking-tight leading-none">
                                    {data.type === 'APPLICATION' ? 'Surat Permohonan' : 
                                     data.type === 'ASSIGNMENT' ? 'Surat Tugas' : 
                                     data.type === 'LECTURER_ASSIGNMENT' ? 'Surat Tugas Dosen' :
                                     'Berita Acara Seminar (KP-006)'}
                                </p>

                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F7931E]">
                                    <Calendar className="h-3 w-3" /> Nomor Surat
                                </label>
                                <p className="text-lg font-mono font-black text-black bg-white px-4 py-1.5 rounded-xl border border-gray-100">
                                    {data.documentNumber}
                                </p>
                            </div>

                            <Separator className="bg-gray-200/50 sm:col-span-2" />

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F7931E]">
                                    <User className="h-3 w-3" /> 
                                    {data.type === 'LECTURER_ASSIGNMENT' ? 'Dosen Pembimbing' : 
                                     data.type === 'SEMINAR_MINUTES' ? 'Mahasiswa' : 'Koordinator'}
                                </label>

                                <p className="font-black text-black text-xl tracking-tight leading-none uppercase">{data.coordinatorName}</p>
                                <div className="inline-block mt-1">
                                    <div className="bg-black text-[#F7931E] px-2 py-0.5 rounded text-[10px] font-black tracking-widest">
                                        NIM {data.coordinatorNim}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F7931E]">
                                    <Building2 className="h-3 w-3" /> Instansi Tujuan
                                </label>
                                <p className="font-black text-black text-xl leading-tight tracking-tight uppercase">
                                    {data.type === 'SEMINAR_MINUTES' ? 'Seminar Kerja Praktik' : 
                                     data.type === 'LECTURER_ASSIGNMENT' ? 'Departemen Sistem Informasi' : 
                                     data.companyName}
                                </p>
                            </div>


                            <Separator className="bg-gray-200/50 sm:col-span-2" />

                            <div className="space-y-4 sm:col-span-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#F7931E]">
                                    <ShieldCheck className="h-3 w-3" /> Pengesahan Digital
                                </label>
                                <div className="bg-black text-white p-8 rounded-4xl relative overflow-hidden group border-b-4 border-[#F7931E]">
                                    <div className="absolute right-[-10%] bottom-[-10%] opacity-10 group-hover:scale-110 transition-transform duration-500 select-none pointer-events-none">
                                        <img src={logo} alt="NeoCentral Logo" className="h-48 w-48 text-white grayscale brightness-200" />
                                    </div>
                                    <p className="text-2xl font-black uppercase tracking-tighter relative z-10 leading-none">{data.signedBy}</p>
                                    <p className="text-[10px] font-bold text-[#F7931E] uppercase tracking-widest mt-1 relative z-10 opacity-80">
                                        {data.type === 'SEMINAR_MINUTES' ? 'DOSEN PEMBIMBING' : 'KETUA DEPARTEMEN'}
                                    </p>


                                    <div className="flex items-center gap-3 mt-8 bg-white/5 p-4 rounded-2xl relative z-10 ring-1 ring-white/10">
                                        <div className="h-3 w-3 rounded-full bg-[#F7931E] animate-pulse shadow-[0_0_10px_#F7931E]" />
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black text-[#F7931E] uppercase tracking-widest opacity-60">Waktu Penandatanganan</p>
                                            <p className="text-xs font-black uppercase tracking-tighter">
                                                {data.signedAt ? format(new Date(data.signedAt), "d MMMM yyyy, HH:mm 'WIB'", { locale: localeId }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Integrity Checker Section */}
                        <div className="mt-8 px-8 sm:px-16">
                            <div className="rounded-[2.5rem] bg-slate-50 p-8 ring-1 ring-gray-100 space-y-6">
                                <div className="flex flex-col items-center text-center space-y-2">
                                    <h3 className="text-sm font-black text-black uppercase tracking-widest">Alat Cek Integritas File</h3>
                                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider max-w-xs">
                                        Unggah file PDF surat ini untuk memastikan kontennya belum dimodifikasi/diedit
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
                                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all group-hover:border-[#F7931E]/40 group-hover:bg-white">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#F7931E] group-hover:bg-[#F7931E]/10 transition-colors">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Drop file atau klik untuk upload</p>
                                        </div>
                                    </div>
                                )}

                                {checkingHash && (
                                    <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center gap-4 ring-1 ring-gray-100 animate-pulse">
                                        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-100 border-t-black" />
                                        <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Mengkalkulasi Hash SHA-256...</p>
                                    </div>
                                )}

                                {integrityStatus === 'MATCH' && (
                                    <div className="bg-emerald-50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 ring-1 ring-emerald-100 animate-in zoom-in-95 duration-300 relative">
                                        <button 
                                            onClick={resetIntegrityCheck}
                                            className="absolute top-4 right-4 text-emerald-300 hover:text-emerald-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 className="h-8 w-8" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-black text-emerald-900 uppercase tracking-widest leading-none">INTEGRITAS_SESUAI</p>
                                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight opacity-70">
                                                {uploadedFile?.name} identik dengan versi sistem (ASLI)
                                            </p>
                                        </div>
                                        <div className="mt-2 text-[8px] font-mono text-emerald-400 uppercase bg-white/50 px-3 py-1 rounded-full border border-emerald-100">
                                            Checksum Verified: SHA-256 OK
                                        </div>
                                    </div>
                                )}

                                {integrityStatus === 'TAMPERED' && (
                                    <div className="bg-red-50 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 ring-1 ring-red-100 animate-in shake duration-500 relative">
                                        <button 
                                            onClick={resetIntegrityCheck}
                                            className="absolute top-4 right-4 text-red-300 hover:text-red-500 transition-colors"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 animate-bounce">
                                            <AlertTriangle className="h-8 w-8" />
                                        </div>
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-black text-red-900 uppercase tracking-widest leading-none">DOKUMEN_DIMODIFIKASI</p>
                                            <p className="text-[10px] text-red-600 font-bold uppercase tracking-tight">
                                                Peringatan: {uploadedFile?.name} telah dimanipulasi!
                                            </p>
                                        </div>
                                        <div className="mt-2 text-[8px] font-mono text-red-400 uppercase bg-white/50 px-3 py-1 rounded-full border border-red-100">
                                            Checksum mismatch: Integrity Broken
                                        </div>
                                    </div>
                                )}

                                {integrityStatus === 'ERROR' && (
                                    <div className="bg-amber-50 rounded-3xl p-6 flex items-center justify-between ring-1 ring-amber-100">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-2xl bg-amber-200 flex items-center justify-center text-amber-700">
                                                <XCircle className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Verifikasi Gagal</p>
                                                <p className="text-[8px] text-amber-600 font-bold mt-1 uppercase">Gagal membandingkan hash</p>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={resetIntegrityCheck}
                                            className="text-amber-700 hover:bg-amber-100 rounded-xl text-[10px] font-black"
                                        >
                                            COBA LAGI
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col items-center gap-8 bg-gray-50/50 p-14 border-t border-gray-100/50">
                        <Button asChild className="bg-black text-white hover:bg-gray-800 px-14 py-8 rounded-full font-black text-lg transition-all active:scale-95 shadow-2xl shadow-black/10 tracking-widest uppercase">
                            <Link to="/">KEMBALI KE BERANDA</Link>
                        </Button>
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-gray-500 leading-relaxed uppercase tracking-[0.2em]">
                                Verifikasi Sistem Informasi Kerja Praktek
                            </p>
                            <p className="text-[9px] font-bold text-gray-400 italic leading-relaxed mx-auto uppercase">
                                *Halaman ini dihasilkan oleh sistem secara otomatis dan merupakan bukti otentik.
                            </p>
                        </div>
                    </CardFooter>
                </Card>

                {/* Bottom Signature */}
                <div className="mt-12 text-center opacity-30 select-none">
                    <p className="text-[10px] font-black text-black uppercase tracking-[0.5em]">NeoCentral &bull; Unand &bull; 2026</p>
                </div>
            </div>
        </div>
    );
}
