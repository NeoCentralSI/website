import { useState, useRef, useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import SignaturePad from 'react-signature-pad-wrapper';
import { submitFieldAssessment } from '@/services/internship/public.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Eraser, Loader2, Send, Info, PenTool } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import InternshipTable from '@/components/internship/InternshipTable';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export default function FieldAssessmentForm() {
    const { data, refetch } = useOutletContext<any>();
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    
    const [scores, setScores] = useState<Record<string, { chosenRubricId: string; score: number | undefined }>>({});
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [signatureOpen, setSignatureOpen] = useState(false);
    const sigPad = useRef<any>(null);

    // Initialize scores if re-visiting
    useEffect(() => {
        if (data.existingScores && data.existingScores.length > 0) {
            const initialScores: any = {};
            data.existingScores.forEach((s: any) => {
                // Find which CPMK this rubric belongs to
                const cpmk = data.cpmks.find((c: any) => c.rubrics.some((r: any) => r.id === s.chosenRubricId));
                if (cpmk) {
                    initialScores[cpmk.id] = { chosenRubricId: s.chosenRubricId, score: s.score };
                }
            });
            setScores(initialScores);
        }
    }, [data.existingScores, data.cpmks]);

    const handleScoreChange = (cpmkId: string, val: string) => {
        if (data.internship.isUsed) return;
        
        const rawScore = val === "" ? NaN : parseFloat(val);
        const cpmk = data.cpmks.find((c: any) => c.id === cpmkId);
        
        if (!cpmk) return;

        // Find matching rubric based on score
        const matchingRubric = cpmk.rubrics.find((r: any) => !isNaN(rawScore) && rawScore >= r.minScore && rawScore <= r.maxScore);
        
        setScores(prev => ({
            ...prev,
            [cpmkId]: { 
                chosenRubricId: matchingRubric?.id || "", 
                score: isNaN(rawScore) ? undefined : rawScore 
            }
        }));
    };

    const clearSignature = () => {
        if (sigPad.current) sigPad.current.clear();
    };

    const handleOpenSignature = () => {
        // Validation
        const allFilled = data.cpmks.every((cpmk: any) => {
            const scoreObj = scores[cpmk.id];
            return scoreObj && scoreObj.chosenRubricId !== "";
        });

        if (!allFilled) {
            toast.error("Mohon lengkapi semua nilai sesuai dengan rentang rubrik yang tersedia.");
            return;
        }

        setSignatureOpen(true);
    };

    const handleSubmit = async () => {
        if (sigPad.current.isEmpty()) {
            toast.error("Mohon bubuhkan tanda tangan Anda.");
            return;
        }

        if (sigPad.current.isEmpty()) {
            toast.error("Mohon bubuhkan tanda tangan Anda.");
            return;
        }

        try {
            setSubmitting(true);
            const signature = sigPad.current.toDataURL();
            const formattedScores = Object.values(scores);
            
            await submitFieldAssessment(token!, { scores: formattedScores, signature });
            
            setSuccess(true);
            toast.success("Penilaian berhasil dikirim!");
            refetch();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Gagal mengirim penilaian.");
        } finally {
            setSubmitting(false);
        }
    };

    if (success || (data.internship.isUsed && Object.keys(scores).length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
                <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">Penilaian Terkirim</h1>
                <p className="text-slate-500 font-medium max-w-md mx-auto mb-8 text-sm leading-relaxed">
                    Terima kasih atas penilaian yang Anda berikan. Data telah tersimpan secara permanen di sistem kami dan logbook mahasiswa telah disahkan secara digital.
                </p>
                <Button 
                    onClick={() => navigate(`/field-assessment/${token}/logbook`)}
                    variant="outline"
                    className="px-8 h-11 font-semibold"
                >
                    Lihat Logbook Mahasiswa
                </Button>
            </div>
        );
    }
    
    const sortedCpmks = [...(data.cpmks || [])].sort((a, b) => 
        a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' })
    );

    const flattenedRubrics = sortedCpmks.flatMap((cpmk: any, cpmkIdx: number) => {
        const sortedRubrics = [...(cpmk.rubrics || [])].sort((a, b) => a.minScore - b.minScore);
        return sortedRubrics.map((rubric: any, rubricIdx: number) => ({
            ...rubric,
            cpmkName: cpmk.name,
            cpmkId: cpmk.id,
            cpmkCode: cpmk.code,
            cpmkNo: cpmkIdx + 1,
            isFirst: rubricIdx === 0,
            rubricCount: sortedRubrics.length
        }));
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">Input Penilaian Lapangan</h1>
                    <p className="text-slate-500 text-sm font-medium">Berikan penilaian objektif berdasarkan kinerja mahasiswa selama di instansi.</p>
                </div>
            </div>

            {data.internship.isUsed && (
                <Alert className="bg-amber-50 border-amber-200 rounded-xl p-5">
                    <Info className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="text-amber-900 font-bold text-sm">Mode Tinjauan (Read-Only)</AlertTitle>
                    <AlertDescription className="text-amber-700 font-medium text-xs mt-1 leading-relaxed">
                        Penilaian ini sudah dikirim dan tidak dapat diubah kembali. Anda sedang melihat arsip penilaian yang telah Anda berikan.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                <InternshipTable
                    columns={[
                        {
                            key: 'no',
                            header: 'No',
                            className: 'w-12 text-center',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => <span className="text-xs font-bold text-slate-400">{row.cpmkNo}</span>
                        },
                        {
                            key: 'cpmk',
                            header: 'Kriteria Penilaian',
                            className: 'w-[15%]',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => (
                                <div className="flex flex-col gap-1 py-1">
                                    <span className="font-bold text-slate-900 text-xs leading-tight">{row.cpmkName}</span>
                                </div>
                            )
                        },
                        {
                            key: 'level',
                            header: 'Level Penilaian',
                            className: 'w-[12%]',
                            render: (row) => {
                                const isSelected = scores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className={cn(
                                        "text-xs font-bold uppercase tracking-tight py-1 px-2 rounded-md inline-block",
                                        isSelected ? "bg-amber-100 text-amber-700" : ""
                                    )}>
                                        {row.levelName}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'description',
                            header: 'Kriteria & Poin Penilaian',
                            render: (row) => {
                                const isSelected = scores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className="py-2 flex items-start gap-2">
                                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 animate-in zoom-in duration-300" />}
                                        <div 
                                            className={cn(
                                                "text-xs leading-relaxed prose prose-slate prose-xs max-w-none transition-all", 
                                                isSelected ? "text-slate-900 font-semibold" : ""
                                            )}
                                            dangerouslySetInnerHTML={{ __html: row.rubricLevelDescription || row.description || "" }}
                                        />
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'range',
                            header: 'Range Skor',
                            className: 'w-24 text-center',
                            render: (row) => {
                                const isSelected = scores[row.cpmkId]?.chosenRubricId === row.id;
                                return (
                                    <div className={cn(
                                        "text-xs py-1 tabular-nums bg-slate-100/50 rounded-full px-3",
                                        isSelected ? "bg-amber-100 text-amber-700" : ""
                                    )}>
                                        {row.minScore} - {row.maxScore}
                                    </div>
                                );
                            }
                        },
                        {
                            key: 'score',
                            header: 'Nilai',
                            className: 'w-32 text-center',
                            rowSpan: (row) => row.isFirst ? row.rubricCount : 0,
                            render: (row) => {
                                const cpmk = data.cpmks.find((c: any) => c.id === row.cpmkId);
                                const min = Math.min(...cpmk.rubrics.map((r: any) => r.minScore));
                                const max = Math.max(...cpmk.rubrics.map((r: any) => r.maxScore));
                                
                                return (
                                    <div className="flex flex-col items-center gap-2 py-1">
                                        <Input
                                            type="number"
                                            min={min}
                                            max={max}
                                            placeholder={`${min}-${max}`}
                                            className="text-center font-semibold text-xs tabular-nums border-slate-200 focus:border-primary focus:ring-primary/20 rounded-lg bg-white shadow-none"
                                            value={scores[row.cpmkId]?.score ?? ""}
                                            onChange={(e) => handleScoreChange(row.cpmkId, e.target.value)}
                                            disabled={data.internship.isUsed}
                                        />
                                        {scores[row.cpmkId]?.score !== undefined && scores[row.cpmkId].chosenRubricId === "" && (
                                            <span className="text-[9px] font-bold text-red-500 uppercase animate-pulse">Luar Rentang</span>
                                        )}
                                    </div>
                                );
                            }
                        }
                    ]}
                    data={flattenedRubrics}
                    total={flattenedRubrics.length}
                    page={1}
                    pageSize={flattenedRubrics.length}
                    onPageChange={() => {}}
                    hidePagination={true}
                    rowKey={(row) => row.id}
                    className="rounded-2xl border-slate-200 overflow-hidden"
                    rowProps={(row) => ({
                        className: cn(
                            "transition-colors",
                            scores[row.cpmkId]?.chosenRubricId === row.id ? "bg-primary/[0.03]" : "bg-white"
                        )
                    })}
                />

                {!data.internship.isUsed && (
                    <div className="flex justify-end pt-2">
                        <Button 
                            size="sm"
                            onClick={handleOpenSignature}
                            className="gap-2 font-semibold"
                        >
                            <Send className="h-4 w-4" />
                            Selesaikan & Tanda Tangan
                        </Button>
                    </div>
                )}
            </div>


            <Dialog open={signatureOpen} onOpenChange={setSignatureOpen}>
                <DialogContent className="sm:max-w-5xl p-0 overflow-hidden border-none rounded-3xl">
                    <div className="p-8 bg-white">
                        <DialogHeader className="mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                <PenTool className="h-6 w-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-bold text-slate-900">Bubuhkan Tanda Tangan</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                Gunakan mouse atau layar sentuh untuk menandatangani formulir penilaian ini secara digital.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-2 overflow-hidden group">
                            <SignaturePad 
                                ref={sigPad}
                                options={{ minWidth: 1.5, maxWidth: 3.5, penColor: 'rgb(15, 23, 42)' }}
                            />
                            <button 
                                onClick={clearSignature}
                                className="absolute top-4 right-4 h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:scale-110 active:scale-95"
                                title="Bersihkan"
                            >
                                <Eraser className="h-4 w-4" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-20 transition-opacity group-hover:opacity-10">
                                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tanda Tangan Digital</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                            <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] font-medium text-slate-500 leading-normal uppercase">
                                Dengan menandatangani, Anda menyetujui bahwa seluruh data penilaian adalah benar dan bersifat final.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-12 font-semibold text-slate-500" 
                            onClick={() => setSignatureOpen(false)}
                            disabled={submitting}
                        >
                            Batal
                        </Button>
                        <Button 
                            className="flex-2 h-12 font-bold" 
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Kirim Penilaian Sekarang
                                    <Send className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            <div className="text-center py-10 opacity-40">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Portal Penilaian &bull; NeoCentral System</p>
            </div>
        </div>
    );
}
