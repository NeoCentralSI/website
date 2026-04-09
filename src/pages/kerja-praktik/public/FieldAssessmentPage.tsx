import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { API_CONFIG } from "@/config/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/spinner";
import { SignaturePad, type SignaturePadRef } from "@/components/ui/signature-pad";
import { AlertCircle, CheckCircle2, User, Eraser, Send, FileText, Info } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Direct API calls (no auth needed)
const API_BASE = API_CONFIG.BASE_URL;

interface Rubric {
    id: string;
    levelName: string;
    rubricLevelDescription: string;
    minScore: number;
    maxScore: number;
}

interface Cpmk {
    id: string;
    code: string;
    name: string;
    weight: number;
    rubrics: Rubric[];
}

interface InternshipInfo {
    id: string;
    studentName: string;
    studentNim: string;
    companyName: string;
    companyAddress: string;
    fieldSupervisorName: string;
    unitSection: string;
    actualStartDate: string;
    actualEndDate: string;
    academicYear: string;
    companyReportDoc?: {
        id: string;
        fileName: string;
        filePath: string;
    } | null;
}

type PageState = "loading" | "invalid" | "form" | "submitting" | "success";

export default function FieldAssessmentPage() {
    const { token } = useParams<{ token: string }>();
    const [pageState, setPageState] = useState<PageState>("loading");
    const [errorMessage, setErrorMessage] = useState("");
    const [internship, setInternship] = useState<InternshipInfo | null>(null);
    const [cpmks, setCpmks] = useState<Cpmk[]>([]);
    const [selectedRubrics, setSelectedRubrics] = useState<Record<string, { rubricId: string; score: number }>>({});
    const [showConfirm, setShowConfirm] = useState(false);
    const signatureRef = useRef<SignaturePadRef>(null);

    const getPublicFileUrl = (filePath?: string) => {
        if (!filePath) return null;
        if (/^https?:\/\//i.test(filePath)) return filePath;
        const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
        return `${API_BASE}${normalized}`;
    };

    const validateToken = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/insternship/field-assessment/validate/${token}`);
            const json = await res.json();

            if (!res.ok) {
                setPageState("invalid");
                setErrorMessage(json.message || "Link tidak valid.");
                return;
            }

            setInternship(json.data.internship);
            setCpmks(json.data.cpmks);
            setPageState("form");
        } catch {
            setPageState("invalid");
            setErrorMessage("Gagal terhubung ke server. Silakan coba lagi nanti.");
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            setPageState("invalid");
            setErrorMessage("Token tidak ditemukan pada URL.");
            return;
        }
        validateToken();
    }, [token, validateToken]);

    const handleRubricSelect = (cpmkId: string, rubric: Rubric) => {
        setSelectedRubrics((prev) => {
            const current = prev[cpmkId];
            let newScore = current?.score || rubric.maxScore;
            if (newScore < rubric.minScore || newScore > rubric.maxScore) {
                newScore = rubric.maxScore;
            }

            return {
                ...prev,
                [cpmkId]: { rubricId: rubric.id, score: newScore },
            };
        });
    };

    const handleScoreChange = (cpmkId: string, value: string) => {
        const numValue = parseFloat(value);
        if (isNaN(numValue) && value !== "") return;

        setSelectedRubrics((prev) => {
            const current = prev[cpmkId];
            if (!current) return prev;

            const cpmk = cpmks.find((c) => c.id === cpmkId);
            const rubric = cpmk?.rubrics.find((r) => r.id === current.rubricId);

            let score = isNaN(numValue) ? 0 : numValue;
            if (rubric && score > rubric.maxScore) score = rubric.maxScore;

            return {
                ...prev,
                [cpmkId]: { ...current, score },
            };
        });
    };

    const handleScoreBlur = (cpmkId: string) => {
        setSelectedRubrics((prev) => {
            const current = prev[cpmkId];
            if (!current) return prev;

            const cpmk = cpmks.find((c) => c.id === cpmkId);
            const rubric = cpmk?.rubrics.find((r) => r.id === current.rubricId);

            if (rubric) {
                let score = current.score;
                if (score < rubric.minScore) score = rubric.minScore;
                if (score > rubric.maxScore) score = rubric.maxScore;

                return {
                    ...prev,
                    [cpmkId]: { ...current, score },
                };
            }
            return prev;
        });
    };

    const allCpmksFilled = cpmks.length > 0 && cpmks.every((c) => selectedRubrics[c.id]);

    const handleSubmit = async () => {
        if (signatureRef.current?.isEmpty()) {
            toast.error("Tanda tangan wajib diisi sebelum mengirim penilaian.");
            setShowConfirm(false);
            return;
        }

        setShowConfirm(false);
        setPageState("submitting");

        try {
            const scores = Object.values(selectedRubrics).map((r) => ({
                chosenRubricId: r.rubricId,
                score: r.score,
            }));

            const signature = signatureRef.current?.toDataURL() || "";

            const res = await fetch(`${API_BASE}/insternship/field-assessment/submit/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scores, signature }),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message || "Gagal mengirim penilaian.");
                setPageState("form");
                return;
            }

            setPageState("success");
        } catch {
            toast.error("Terjadi kesalahan jaringan. Silakan coba lagi.");
            setPageState("form");
        }
    };

    if (pageState === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading size="lg" text="Memvalidasi link penilaian..." />
            </div>
        );
    }

    if (pageState === "invalid") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
                        <h1 className="text-xl font-bold">Link Tidak Valid</h1>
                        <p className="text-muted-foreground text-sm">{errorMessage}</p>
                        <p className="text-xs text-muted-foreground">
                            Jika Anda merasa ini adalah kesalahan, silakan hubungi pihak kampus untuk mendapatkan link penilaian yang baru.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (pageState === "success") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full text-center">
                    <CardContent className="pt-8 pb-8 space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
                        <h1 className="text-xl font-bold text-green-700">Penilaian Berhasil Dikirim!</h1>
                        <p className="text-muted-foreground text-sm">
                            Terima kasih atas partisipasi Bapak/Ibu dalam menilai mahasiswa Kerja Praktik. Penilaian telah disimpan dan dokumen PDF telah dibuat secara otomatis.
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Halaman ini dapat ditutup. Link penilaian tidak dapat digunakan kembali.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (pageState === "submitting") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading size="lg" text="Mengirim penilaian dan membuat dokumen PDF..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50/50 p-6 md:p-10">
            <div className="max-w-360 mx-auto">
                <div className="grid grid-cols-1 gap-8 items-start">
                    <div className="text-center space-y-2">
                        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mx-auto">
                            <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-neutral-900 leading-tight">
                            Penilaian Kerja Praktik
                        </h1>
                        <p className="text-sm text-neutral-500 font-medium tracking-tight">
                            Pembimbing Lapangan
                        </p>
                    </div>

                    {/* Student Info Card */}
                    <Card className="rounded-2xl border-gray-200 overflow-hidden">
                            <CardHeader className="py-4 border-b bg-neutral-50/50">
                                <CardTitle className="text-xs font-bold flex items-center gap-2 text-neutral-700 uppercase tracking-widest leading-none">
                                    <User className="h-3.5 w-3.5 text-primary" /> Data Mahasiswa
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-5 space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Nama Lengkap</p>
                                    <p className="font-bold text-neutral-800 text-sm whitespace-pre-wrap">{internship?.studentName}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">NIM</p>
                                        <p className="font-mono font-bold text-neutral-800 text-xs">{internship?.studentNim}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Tahun Akademik</p>
                                        <p className="font-bold text-neutral-800 text-xs">{internship?.academicYear}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Instansi</p>
                                    <p className="font-bold text-neutral-800 text-sm leading-snug whitespace-pre-wrap">{internship?.companyName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Laporan Instansi</p>
                                    {internship?.companyReportDoc?.filePath ? (
                                        <a
                                            href={getPublicFileUrl(internship.companyReportDoc.filePath) || "#"}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-sm font-bold text-primary hover:underline break-all"
                                        >
                                            {internship.companyReportDoc.fileName || "Lihat file laporan instansi"}
                                        </a>
                                    ) : (
                                        <p className="text-xs font-semibold text-neutral-400">Belum diunggah mahasiswa</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                    {/* Right: Assessment Matrix Table */}
                    <main>
                        <div className="rounded-2xl border border-black/10 relative overflow-x-auto bg-white">
                            <Table className="border-collapse">
                                <TableHeader className="bg-neutral-50/80 border-b border-black/10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="w-12.5 text-center border-r border-black/10 font-bold text-neutral-500 h-12 uppercase text-[10px] tracking-wider">No</TableHead>
                                        <TableHead className="w-50 border-r border-black/10 font-bold text-neutral-500 h-12 uppercase text-[10px] tracking-wider">Uraian Penilaian</TableHead>
                                        <TableHead className="border-r border-black/10 font-bold text-neutral-500 h-12 uppercase text-[10px] tracking-wider">Detail Penilaian (Instrumen)</TableHead>
                                        <TableHead className="w-30 text-center border-r border-black/10 font-bold text-neutral-500 h-12 uppercase text-[10px] tracking-wider">Score</TableHead>
                                        <TableHead className="w-36 text-center font-bold text-neutral-500 h-12 uppercase text-[10px] tracking-wider">Nilai</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cpmks.map((cpmk, cpmkIdx) => (
                                        <React.Fragment key={cpmk.id}>
                                            {cpmk.rubrics.map((rubric, rubricIdx) => {
                                                const isFirst = rubricIdx === 0;
                                                const isSelected = selectedRubrics[cpmk.id]?.rubricId === rubric.id;
                                                
                                                return (
                                                    <TableRow 
                                                        key={rubric.id}
                                                        className={cn(
                                                            "group transition-colors border-b border-black/10",
                                                            "hover:bg-neutral-50/30"
                                                        )}
                                                        onClick={() => handleRubricSelect(cpmk.id, rubric)}
                                                    >
                                                        {isFirst && (
                                                            <>
                                                                <TableCell 
                                                                    rowSpan={cpmk.rubrics.length} 
                                                                    className="text-center font-bold border-r border-black/10 align-top py-6 text-neutral-400 text-xs"
                                                                >
                                                                    {cpmkIdx + 1}
                                                                </TableCell>
                                                                <TableCell 
                                                                    rowSpan={cpmk.rubrics.length} 
                                                                    className="font-bold border-r border-black/10 align-top py-6 text-neutral-700 text-[13px] leading-snug max-w-50"
                                                                >
                                                                    {cpmk.name}
                                                                </TableCell>
                                                            </>
                                                        )}
                                                        <TableCell className={cn(
                                                            "border-r border-black/10 py-5 cursor-pointer align-top min-w-75 transition-colors",
                                                            isSelected ? "bg-primary/5" : "bg-transparent"
                                                        )}>
                                                            <div className="flex items-start gap-4 h-full">
                                                                    <div className={cn(
                                                                        "mt-0.5 size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                                                        isSelected 
                                                                            ? "border-primary bg-primary ring-4 ring-primary/10" 
                                                                            : "border-neutral-200 group-hover:border-primary/30"
                                                                    )}>
                                                                        {isSelected && <div className="size-1 rounded-full bg-white shadow-sm" />}
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className={cn(
                                                                            "text-[10px] font-black uppercase tracking-widest mb-1.5",
                                                                            isSelected ? "text-primary" : "text-neutral-400"
                                                                        )}>
                                                                            {rubric.levelName}
                                                                        </p>
                                                                        <div 
                                                                            className={cn(
                                                                                "text-[12px] leading-relaxed prose prose-sm prose-neutral prose-p:my-0.5",
                                                                                isSelected ? "text-neutral-900 font-medium" : "text-neutral-500"
                                                                            )}
                                                                            dangerouslySetInnerHTML={{ __html: rubric.rubricLevelDescription }}
                                                                        />
                                                                    </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center border-r border-black/10 font-mono text-[11px] font-bold text-neutral-500 py-6 tabular-nums align-top bg-neutral-50/5">
                                                            {rubric.minScore}-{rubric.maxScore}
                                                        </TableCell>
                                                        {isFirst && (
                                                            <TableCell 
                                                                rowSpan={cpmk.rubrics.length} 
                                                                className="align-middle p-4 min-w-27.5"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                {selectedRubrics[cpmk.id] ? (
                                                                    <div className="space-y-3">
                                                                        <div className="space-y-1 text-center">
                                                                            <Label className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Input Skor</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={selectedRubrics[cpmk.id]?.score}
                                                                                onChange={(e) => handleScoreChange(cpmk.id, e.target.value)}
                                                                                onBlur={() => handleScoreBlur(cpmk.id)}
                                                                                className="h-10 text-center font-black text-primary border-primary/30 focus:border-primary ring-0 bg-primary/5 rounded-lg shadow-inner"
                                                                                step="0.01"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center gap-1.5 opacity-40">
                                                                        <Info className="size-3 text-neutral-400" />
                                                                        <p className="text-center italic text-[9px] font-bold text-neutral-400 leading-tight uppercase tracking-tighter">
                                                                            Pilih instrumen
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {!allCpmksFilled && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-6 flex items-center gap-3"
                            >
                                <Info className="size-4 text-amber-500 shrink-0" />
                                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">
                                    Pilih kriteria penilaian untuk semua uraian di atas untuk dapat mengirim penilaian.
                                </p>
                            </motion.div>
                        )}
                    </main>

                    {/* Signature Block */}
                    <Card className="rounded-2xl border-gray-200 overflow-hidden bg-white">
                        <CardHeader className="py-4 border-b bg-neutral-50/50">
                            <CardTitle className="text-xs font-bold flex items-center gap-2 text-neutral-700 uppercase tracking-widest leading-none">
                                <Eraser className="h-3.5 w-3.5 text-primary" /> Tanda Tangan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="bg-white border-b border-neutral-100 px-6">
                                <SignaturePad ref={signatureRef} height={250} backgroundColor="#ffffff" />
                            </div>
                            <div className="p-4 flex flex-col gap-3 bg-neutral-50/30">
                                <div className="flex justify-between items-center">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => signatureRef.current?.clear()}
                                        className="text-[10px] h-8 px-2 font-bold uppercase tracking-wider text-neutral-400 hover:text-destructive transition-colors"
                                    >
                                        Hapus Tanda Tangan
                                    </Button>
                                </div>
                                <Button
                                    size="lg"
                                    disabled={!allCpmksFilled}
                                    onClick={() => setShowConfirm(true)}
                                    className="w-full font-bold shadow-lg shadow-primary/20 h-10"
                                >
                                    <Send className="h-3.5 w-3.5 mr-2" />
                                    Kirim Penilaian
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-primary p-8 text-white">
                        <Send className="size-12 mb-4 opacity-50" />
                        <AlertDialogTitle className="text-2xl font-black tracking-tight leading-none mb-2">Konfirmasi Pengiriman</AlertDialogTitle>
                        <AlertDialogDescription className="text-primary-foreground/80 text-sm font-medium leading-relaxed">
                            Setelah dikirim, penilaian ini akan dikunci secara permanen dan dokumen Berita Acara akan dihasilkan.
                        </AlertDialogDescription>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <AlertDialogCancel className="flex-1 rounded-xl h-12 font-bold border-neutral-200 text-neutral-400 hover:bg-neutral-50">
                                Periksa Kembali
                            </AlertDialogCancel>
                            <AlertDialogAction onClick={handleSubmit} className="flex-1 rounded-xl h-12 font-bold bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Ya, Kirim Sekarang
                            </AlertDialogAction>
                        </div>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
