import { useState, useEffect, useRef } from 'react';
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
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // State for dragging signature
    const [dragState, setDragState] = useState<{
        index: number;
        startX: number;
        startY: number;
        startSigX: number;
        startSigY: number;
        pageWidth: number;
        pageHeight: number;
        containerWidth: number;
        containerHeight: number;
    } | null>(null);

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
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Handle Drag Events
    useEffect(() => {
        if (!dragState) return;

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const deltaX = e.clientX - dragState.startX;
            const deltaY = e.clientY - dragState.startY;

            // Calculate new position in PDF coordinates
            // deltaX (px) / containerWidth (px) * pageWidth (pdf units)
            const deltaPdfX = (deltaX / dragState.containerWidth) * dragState.pageWidth;
            const deltaPdfY = (deltaY / dragState.containerHeight) * dragState.pageHeight;

            const newX = Math.max(0, Math.min(dragState.pageWidth, dragState.startSigX + deltaPdfX));
            const newY = Math.max(0, Math.min(dragState.pageHeight, dragState.startSigY + deltaPdfY));

            setSignaturePositions(prev => {
                const next = [...prev];
                if (next[dragState.index]) {
                    next[dragState.index] = {
                        ...next[dragState.index],
                        x: newX,
                        y: newY
                    };
                }
                return next;
            });
        };

        const handleMouseUp = () => {
            setDragState(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState]);

    const startDrag = (e: React.MouseEvent, index: number, pageNum: number) => {
        e.stopPropagation(); // Prevent adding new signature on page click
        e.preventDefault(); // Prevent selection

        const pageDim = pageDimensions.get(pageNum);
        if (!pageDim) return;

        // Find the page container element to get current rendered dimensions
        const pageContainer = (e.currentTarget.closest('.relative') as HTMLElement);
        const rect = pageContainer.getBoundingClientRect();

        setDragState({
            index,
            startX: e.clientX,
            startY: e.clientY,
            startSigX: signaturePositions[index].x,
            startSigY: signaturePositions[index].y,
            pageWidth: pageDim.width,
            pageHeight: pageDim.height,
            containerWidth: rect.width,
            containerHeight: rect.height
        });
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
                    <Button variant="outline" size="icon" className="shrink-0" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Tanda Tangani Dokumen</h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <Info className="h-3 w-3" />
                            Klik pada dokumen untuk menambahkan posisi tanda tangan. Drag untuk memindahkan posisi.
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
                    <Card className="border">
                        <CardHeader className="flex flex-row items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <CardTitle className="text-lg">Detail Dokumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-5 text-sm">
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

                    <Card className="border">
                        <CardHeader>
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
                                    <span>Klik dan tahan (drag) pada tanda tangan untuk memindahkan posisi.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">3</span>
                                    <span>Klik pada list di kiri untuk menghapus posisi.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">4</span>
                                    <span>Klik <strong>Selesaikan & Simpan</strong> untuk memproses.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    {signaturePositions.length > 0 && (
                        <Card className="border bg-green-50/30 animate-in slide-in-from-bottom duration-300">
                            <CardHeader>
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
                                                size="lg"
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
                <div className="lg:col-span-2 h-[calc(100vh-140px)] sticky top-6">
                    <Card className="bg-slate-100/50 border h-full flex flex-col overflow-hidden shadow-inner">
                        <CardContent ref={scrollContainerRef} className="p-0 flex-1 overflow-y-auto w-full flex flex-col items-center py-8 gap-6 scroll-smooth">
                            <Document
                                file={fileUrl}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center gap-4 my-auto h-full justify-center">
                                        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
                                        <p className="text-muted-foreground animate-pulse font-medium text-sm">Menyiapkan dokumen...</p>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center gap-4 my-auto h-full justify-center text-destructive">
                                        <Info className="h-12 w-12 opacity-50" />
                                        <p className="font-medium">Gagal memuat dokumen PD.</p>
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
                                                .map((pos) => {
                                                    // Find the original index of this signature position to handle updates correctly
                                                    const globalIndex = signaturePositions.indexOf(pos);

                                                    return (
                                                        <div
                                                            key={`sig_${globalIndex}`}
                                                            className={`absolute border-2 border-green-500 bg-green-500/20 flex items-center justify-center transition-all duration-75 ring-4 ring-green-500/10 ${dragState?.index === globalIndex ? 'cursor-grabbing scale-105 z-50' : 'cursor-grab hover:scale-110 z-10'}`}
                                                            style={{
                                                                left: `${(pos.x / (pageDim?.width || 595)) * 100}%`,
                                                                top: `${(pos.y / (pageDim?.height || 842)) * 100}%`,
                                                                width: `${60 * scale}px`,
                                                                height: `${60 * scale}px`,
                                                                transform: 'translate(-50%, -50%)',
                                                                // If dragging, disable transitions for smooth movement
                                                                transition: dragState?.index === globalIndex ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                            }}
                                                            onMouseDown={(e) => startDrag(e, globalIndex, pageNum)}
                                                        >
                                                            <div className="bg-green-600 rounded-full h-5 w-5 flex items-center justify-center -mt-8 -mr-8 absolute top-0 right-0 pointer-events-none select-none">
                                                                <span className="text-[10px] text-white font-bold">{
                                                                    globalIndex + 1
                                                                }</span>
                                                            </div>
                                                            <MousePointer2 className="text-green-600 h-6 w-6 pointer-events-none select-none" />
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    );
                                })}
                            </Document>

                            {/* Footer for navigation help */}
                            <div className="mt-4 mb-8 flex justify-center">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:bg-white/50" onClick={scrollToTop}>
                                    <ChevronUp className="h-3 w-3 mr-2" /> Kembali ke Atas
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SignLetterPage;
