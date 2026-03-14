import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLecturerGuidanceWeekDetail, submitLecturerEvaluation, type SubmitEvaluationBody } from '@/services/internship.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2, AlertCircle, ArrowLeft, Calendar, User, FileText, CheckCircle2, Clock, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GuidanceEvaluatePage() {
    const { internshipId, weekNumber } = useParams<{ internshipId: string; weekNumber: string }>();
    
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [evaluations, setEvaluations] = useState<Record<string, { evaluationValue?: string | null; answerText?: string }>>({});

    const { data: detailData, isLoading, error } = useQuery({
        queryKey: ['lecturer-guidance-week-detail', internshipId, weekNumber],
        queryFn: () => getLecturerGuidanceWeekDetail(internshipId!, weekNumber!),
        enabled: !!internshipId && !!weekNumber,
    });

    useEffect(() => {
        if (detailData?.lecturerEvaluation) {
            const initialEvaluations: Record<string, { evaluationValue?: string | null; answerText?: string }> = {};
            detailData.lecturerEvaluation.forEach(c => {
                initialEvaluations[c.criteriaId] = {
                    evaluationValue: c.evaluationValue,
                    answerText: c.answerText
                };
            });
            setEvaluations(initialEvaluations);
        }
    }, [detailData]);

    // Breadcrumbs are handled by parent StudentDetailPage

    const submitMutation = useMutation({
        mutationFn: async () => {
             const body: SubmitEvaluationBody = {
                 status: 'APPROVED', // Default to approved since there's no rejection path anymore
                 evaluations
             };
             return submitLecturerEvaluation(internshipId!, weekNumber!, body);
        },
        onSuccess: () => {
            toast.success('Evaluasi berhasil disimpan');
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            navigate(`/kerja-praktik/dosen/bimbingan/${internshipId}/bimbingan`);
        },
        onError: (err: unknown) => {
            toast.error(err instanceof Error ? err.message : 'Gagal menyimpan evaluasi');
        }
    });

    const updateEvaluation = (criteriaId: string, field: 'evaluationValue' | 'answerText', value: string | null) => {
        setEvaluations(prev => ({
            ...prev,
            [criteriaId]: {
                ...prev[criteriaId],
                [field]: value
            }
        }));
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !detailData) {
        return (
            <div className="flex flex-col justify-center items-center h-[400px] space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-destructive font-medium text-lg">Gagal memuat data bimbingan minggu ini</p>
                <Button variant="outline" onClick={() => navigate(`/kerja-praktik/dosen/bimbingan/${internshipId}/bimbingan`)}>
                    Kembali ke Timeline
                </Button>
            </div>
        );
    }

    const isSubmitted = detailData.sessionStatus === 'SUBMITTED' || detailData.sessionStatus === 'LATE' || detailData.sessionStatus === 'APPROVED';

    return (
        <div className="flex flex-col gap-6 p-6 mx-auto w-full">
            {/* Page Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate(`/kerja-praktik/dosen/bimbingan/${internshipId}/bimbingan`)}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Evaluasi Bimbingan: Minggu {weekNumber}</h2>
                    <p className="text-muted-foreground">Berikan feedback dan penilaian pada bimbingan mahasiswa.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Student Journal Card */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">{detailData.studentName}</CardTitle>
                                    <CardDescription>{detailData.studentNim}</CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col items-end gap-1.5">
                                    <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1 font-medium bg-muted/50 border-border text-foreground shadow-none w-fit">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        Minggu {weekNumber}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium uppercase tracking-wider">
                                        <Clock className="h-3 w-3" />
                                        Disubmit: {detailData.submissionDate ? format(new Date(detailData.submissionDate), 'dd MMM yyyy', { locale: idLocale }) : '-'}
                                    </span>
                                    {detailData.lecturerEvaluation.some(e => e.evaluationValue || e.answerText) && (
                                        <Badge variant="success" className="flex items-center gap-1 bg-green-200 hover:bg-green-600">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Sudah Dievaluasi
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6">
                        {!isSubmitted ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                <FileText className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-lg font-medium">Mahasiswa belum mengisi bimbingan.</p>
                                <p className="text-sm">Evaluasi hanya dapat diberikan setelah bimbingan disubmit.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="space-y-8">
                                    {detailData.studentAnswers.length > 0 ? (
                                        detailData.studentAnswers.map((answer, idx) => (
                                            <div key={idx} className="space-y-3">
                                                <div className="flex gap-3">
                                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="space-y-2 flex-1">
                                                        <Label className="text-sm font-medium text-muted-foreground leading-relaxed block pt-0.5">
                                                            {answer.questionText}
                                                        </Label>
                                                        <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap border border-border/50">
                                                            {answer.answerText}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-sm italic py-4">Tidak ada jawaban yang direkam.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Evaluation Card */}
                <Card className="border-t-4 border-t-primary lg:sticky lg:top-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-primary" />
                            Evaluasi Pembimbing
                        </CardTitle>
                        <CardDescription>Berikan feedback dan penilaian bimbingan.</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {isSubmitted ? (
                            <>
                                <div className="space-y-6">
                                    {detailData.lecturerEvaluation.map((crit) => (
                                        <div key={crit.criteriaId} className="space-y-3">
                                            <Label htmlFor={`crit-${crit.criteriaId}`} className="text-base font-medium">{crit.criteriaName}</Label>
                                            
                                            {crit.inputType === 'EVALUATION' ? (
                                                <Select 
                                                    value={evaluations[crit.criteriaId]?.evaluationValue || ''} 
                                                    onValueChange={(val) => updateEvaluation(crit.criteriaId, 'evaluationValue', val)}
                                                >
                                                    <SelectTrigger id={`crit-${crit.criteriaId}`} className="bg-background">
                                                        <SelectValue placeholder="Pilih Penilaian" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {crit.options.map(opt => (
                                                            <SelectItem key={opt.id} value={opt.optionText}>
                                                                {opt.optionText}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Textarea 
                                                    id={`crit-${crit.criteriaId}`}
                                                    placeholder={`Tuliskan ${crit.criteriaName.toLowerCase()} di sini...`}
                                                    className="min-h-[120px] resize-y bg-background"
                                                    value={evaluations[crit.criteriaId]?.answerText || ''}
                                                    onChange={(e) => updateEvaluation(crit.criteriaId, 'answerText', e.target.value)}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                           <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed flex flex-col items-center">
                                <Clock className="h-8 w-8 mb-4 opacity-20" />
                                <p className="text-sm font-medium">Menunggu mahasiswa mengisi bimbingan.</p>
                           </div>
                        )}
                    </CardContent>

                    {isSubmitted && (
                        <CardFooter className="bg-muted/20 border-t">
                            <Button 
                                className="w-full font-semibold bg-primary hover:bg-primary/90" 
                                disabled={submitMutation.isPending}
                                onClick={() => submitMutation.mutate()}
                            >
                                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Evaluasi Bimbingan
                            </Button>
                        </CardFooter>
                    )}
                </Card>
            </div>
        </div>
    );
}


