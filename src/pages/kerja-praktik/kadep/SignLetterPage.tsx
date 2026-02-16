import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Check, MousePointer2, FileText, Info, Building2, User, ChevronUp } from 'lucide-react';
import { getKadepPendingLetters, approveKadepLetter } from '@/services/internship.service';
import { API_CONFIG } from '@/config/api';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Set worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SignaturePos {
    x: number;
    y: number;
    pageNumber: number;
}

const SignLetterPage = () => {
    const { type, id } = useParams<{ type: 'APPLICATION' | 'ASSIGNMENT'; id: string }>();
    const navigate = useNavigate();

    const [numPages, setNumPages] = useState<number>(0);
    const [scale, setScale] = useState(1.1);
    const [signaturePositions, setSignaturePositions] = useState<SignaturePos[]>([]);
    const [pageDimensions, setPageDimensions] = useState<Map<number, { width: number; height: number }>>(new Map());

    // Fetch letters to find the one we need
    const { data: letters, isLoading } = useQuery({
        queryKey: ['kadep-pending-letters'],
        queryFn: async () => {
            const res = await getKadepPendingLetters();
            return res.data;
        }
    });

    const queryClient = useQueryClient();

    const letter = (type === 'APPLICATION' ? letters?.applicationLetters : letters?.assignmentLetters)?.find(l => l.id === id);

    const approveMutation = useMutation({
        mutationFn: (positions: SignaturePos[]) => {
            if (letter?.signedById) throw new Error("Dokumen ini sudah ditandatangani.");
            return approveKadepLetter(id!, type!, positions);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kadep-pending-letters'] });
            toast.success("Dokumen berhasil ditandatangani");
            navigate('/kelola/kerja-praktik/kadep/persetujuan');
        },
        onError: (err: any) => {
            toast.error(err.message || "Gagal menandatangani dokumen");
        }
    });

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
    };

    const handleConfirmSign = () => {
        if (signaturePositions.length === 0) {
            toast.error("Silakan pilih minimal satu letak tanda tangan");
            return;
        }
        approveMutation.mutate(signaturePositions);
    };

    const removeSignature = (index: number) => {
        setSignaturePositions(prev => prev.filter((_, i) => i !== index));
        toast.info("Posisi tanda tangan dihapus");
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!letter || !letter.document) {
        return (
            <div className="p-10 text-center">
                <h1 className="text-xl font-bold">Dokumen tidak ditemukan</h1>
                <Button onClick={() => navigate(-1)} className="mt-4"><ArrowLeft className="mr-2 h-4" /> Kembali</Button>
            </div>
        );
    }

    const fileUrl = `${API_CONFIG.BASE_URL}/${letter.document.filePath}`;

    return (
        <div className="p-6 mx-auto space-y-6 w-full">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tanda Tangani Dokumen</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <Info className="h-3 w-3" />
                            Klik pada dokumen untuk menentukan posisi tanda tangan digital. Anda bisa menambahkan lebih dari satu posisi.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex items-center gap-2 mr-4 bg-muted px-3 py-1.5 rounded-lg border">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Zoom</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}> - </Button>
                            <span className="text-xs w-8 text-center">{Math.round(scale * 100)}%</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}> + </Button>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="default"
                                size="lg"
                                disabled={signaturePositions.length === 0 || approveMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 shadow-md transition-all active:scale-95"
                            >
                                {approveMutation.isPending ? <Loader2 className="mr-2 h-4 animate-spin" /> : <Check className="mr-2 h-4" />}
                                Selesaikan & Simpan
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Tanda Tangan</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Apakah Anda yakin ingin menyelesaikan tanda tangan dokumen ini?
                                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs">
                                        <strong>Penting:</strong> Setelah ditandatangani, data pada dokumen ini tidak dapat diubah kembali oleh Admin untuk menjaga validitas tanda tangan digital.
                                    </div>
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmSign}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    Ya, Tanda Tangani
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Sidebar: Info & Instructions (1/3 ratio - lg:col-span-1) */}
                <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6">
                    <Card className="shadow-sm border-primary/10">
                        <CardHeader className="pb-3 flex flex-row items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Detail Dokumen</CardTitle>
                        </CardHeader>
                        <Separator className="mx-6 opacity-50" />
                        <CardContent className="pt-4 space-y-5 text-sm">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nomor Surat</p>
                                <p className="font-mono text-primary font-medium">{letter.documentNumber}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-muted-foreground lowercase first-letter:uppercase">
                                    <User className="h-4 w-4 shrink-0" />
                                    <span className="truncate" title={letter.coordinatorName}>{letter.coordinatorName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground lowercase first-letter:uppercase">
                                    <Building2 className="h-4 w-4 shrink-0" />
                                    <span className="truncate" title={letter.companyName}>{letter.companyName}</span>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1.5 text-xs">
                                <p className="font-medium text-muted-foreground">Tipe Dokumen</p>
                                <Badge variant="secondary" className="px-2 py-0.5 text-[10px] font-bold">
                                    {type === 'APPLICATION' ? 'SURAT PERMOHONAN' : 'SURAT TUGAS'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-amber-500/10 bg-amber-50/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-bold text-amber-800 flex items-center gap-2">
                                <Info className="h-4 w-4" />
                                Petunjuk
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-xs space-y-3 text-amber-900/80 list-none">
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">1</span>
                                    <span>Klik pada dokumen untuk menambahkan posisi tanda tangan.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">2</span>
                                    <span>Klik pada indicator di dokumen atau list di bawah untuk menghapus posisi.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">3</span>
                                    <span>Klik <strong>Selesaikan & Simpan</strong> untuk memproses.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {signaturePositions.length > 0 && (
                        <Card className="shadow-sm border-green-500/20 bg-green-50/30 animate-in slide-in-from-bottom duration-300">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-bold text-green-800 flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Posisi Tanda Tangan ({signaturePositions.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-green-200/50">
                                    {signaturePositions.map((pos, idx) => (
                                        <div key={idx} className="px-6 py-3 flex items-center justify-between text-xs text-green-900/80 group">
                                            <div>
                                                <p className="font-semibold">Posisi #{idx + 1}</p>
                                                <p className="text-[10px] opacity-70">Hal {pos.pageNumber} • {Math.round(pos.x)}, {Math.round(pos.y)}</p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => removeSignature(idx)}
                                            >
                                                ×
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Main: PDF Preview Scrollable (2/3 ratio - lg:col-span-2) */}
                <div className="lg:col-span-2">
                    <Card className="shadow-xl bg-slate-100 border-inner min-h-[800px] relative overflow-hidden">
                        <CardContent className="p-0 overflow-auto flex flex-col items-center py-10 gap-8 h-[calc(100vh-280px)]">
                            <Document
                                file={fileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center gap-4 my-20">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                                        <p className="text-muted-foreground animate-pulse">Menyiapkan dokumen...</p>
                                    </div>
                                }
                            >
                                {/* Sequential Page Rendering */}
                                {Array.from(new Array(numPages), (_, index) => {
                                    const pageNum = index + 1;
                                    const pageDim = pageDimensions.get(pageNum);

                                    return (
                                        <div key={`page_${pageNum}`} className="relative shadow-2xl group cursor-crosshair mb-4 last:mb-0">
                                            <Page
                                                pageNumber={pageNum}
                                                scale={scale}
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                onLoadSuccess={(page) => {
                                                    setPageDimensions(prev => {
                                                        const newMap = new Map(prev);
                                                        newMap.set(pageNum, { width: page.originalWidth, height: page.originalHeight });
                                                        return newMap;
                                                    });
                                                }}
                                                onClick={(e) => {
                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                    const x = e.clientX - rect.left;
                                                    const y = e.clientY - rect.top;

                                                    const pageDim = pageDimensions.get(pageNum);
                                                    if (pageDim) {
                                                        const pointX = (x / rect.width) * pageDim.width;
                                                        const pointY = (y / rect.height) * pageDim.height;

                                                        setSignaturePositions(prev => [...prev, {
                                                            x: pointX,
                                                            y: pointY,
                                                            pageNumber: pageNum
                                                        }]);

                                                        toast.success(`Posisi tanda tangan ditambahkan pada Halaman ${pageNum}`);
                                                    }
                                                }}
                                                className="transition-transform duration-300"
                                            />

                                            {/* Page Number Badge */}
                                            <div className="absolute -left-12 top-0 bg-white/80 border text-xs font-bold px-2 py-1 rounded shadow-sm text-muted-foreground">
                                                HAL {pageNum}
                                            </div>

                                            {/* Signature Indicator Overlays */}
                                            {signaturePositions
                                                .filter(pos => pos.pageNumber === pageNum)
                                                .map((pos, sIdx) => (
                                                    <div
                                                        key={`sig_${sIdx}`}
                                                        className="absolute border-2 border-green-500 bg-green-500/20 flex items-center justify-center pointer-events-none transition-all duration-300 ring-4 ring-green-500/10"
                                                        style={{
                                                            left: `${(pos.x / (pageDim?.width || 595)) * 100}%`,
                                                            top: `${(pos.y / (pageDim?.height || 842)) * 100}%`,
                                                            width: `${60 * scale}px`,
                                                            height: `${60 * scale}px`,
                                                            transform: 'translate(-50%, -50%)'
                                                        }}
                                                    >
                                                        <div className="bg-green-600 rounded-full h-5 w-5 flex items-center justify-center -mt-8 -mr-8 absolute top-0 right-0">
                                                            <span className="text-[10px] text-white font-bold">{
                                                                signaturePositions.indexOf(pos) + 1
                                                            }</span>
                                                        </div>
                                                        <MousePointer2 className="text-green-600 h-6 w-6 animate-pulse" />
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    );
                                })}
                            </Document>
                        </CardContent>
                    </Card>

                    {/* Footer for navigation help */}
                    <div className="mt-8 flex justify-center pb-20">
                        <Button variant="ghost" className="text-muted-foreground" onClick={scrollToTop}>
                            <ChevronUp className="h-4 w-4 mr-2" /> Kembali ke Atas
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignLetterPage;
