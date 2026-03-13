import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudentGuidance, submitGuidanceResponse } from '@/services/internship.service';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2, AlertCircle, ArrowLeft, Calendar, Clock, CheckCircle2, Edit2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';

export default function GuidanceDetailPage() {
    const { weekNumber } = useParams<{ weekNumber: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isEditing, setIsEditing] = useState(false);

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik', to: '/kerja-praktik' },
        { label: 'Pelaksanaan', to: '/kerja-praktik/kegiatan' },
        { label: `Bimbingan Minggu ${weekNumber}` }
    ], [weekNumber]);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const { data: guidanceData, isLoading, error } = useQuery({
        queryKey: ['studentGuidance'],
        queryFn: getStudentGuidance,
    });

    const currentWeekData = useMemo(() => {
        if (!guidanceData || !weekNumber) return null;
        return guidanceData.timeline.find(w => w.weekNumber === parseInt(weekNumber));
    }, [guidanceData, weekNumber]);

    useEffect(() => {
        if (currentWeekData) {
            const initialAnswers: Record<string, string> = {};
            currentWeekData.questions.forEach(q => {
                initialAnswers[q.id] = q.answer || '';
            });
            setAnswers(initialAnswers);
            setIsEditing(false); // Reset edit state when week changes
        }
    }, [currentWeekData]);

    const submitMutation = useMutation({
        mutationFn: (data: { weekNumber: number; answers: Record<string, string> }) => submitGuidanceResponse(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['studentGuidance'] });
            toast.success('Bimbingan berhasil dikirim');
            setIsEditing(false);
            navigate('/kerja-praktik/kegiatan/bimbingan');
        },
        onError: () => {
            toast.error('Gagal mengirim bimbingan');
        }
    });

    const handleAnswerChange = (questionId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = () => {
        if (!currentWeekData) return;
        submitMutation.mutate({
            weekNumber: currentWeekData.weekNumber,
            answers
        });
    };

    const handleCancelEdit = () => {
        if (currentWeekData) {
            const initialAnswers: Record<string, string> = {};
            currentWeekData.questions.forEach(q => {
                initialAnswers[q.id] = q.answer || '';
            });
            setAnswers(initialAnswers);
        }
        setIsEditing(false);
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { label: 'Terbuka', variant: 'outline', icon: Calendar, color: 'text-blue-600 border-blue-200 bg-blue-50' };
            case 'LATE':
                return { label: 'Terbuka (Telat)', variant: 'outline', icon: AlertCircle, color: 'text-orange-600 border-orange-200 bg-orange-50' };
            case 'SUBMITTED':
                return { label: 'Menunggu Persetujuan', variant: 'secondary', icon: Clock, color: 'text-slate-600 border-slate-200 bg-slate-100' };
            case 'APPROVED':
                return { label: 'Disetujui', variant: 'default', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-600' };
            default:
                return { label: 'Belum Tersedia', variant: 'secondary', icon: Clock, color: 'text-muted-foreground opacity-50' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !currentWeekData) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 h-[400px]">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium">Bimbingan tidak ditemukan atau gagal dimuat</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/kerja-praktik/kegiatan/bimbingan')}>Kembali</Button>
                    <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['studentGuidance'] })}>Coba Lagi</Button>
                </div>
            </div>
        );
    }

    const config = getStatusConfig(currentWeekData.status);
    const isLocked = currentWeekData.status === 'APPROVED' || currentWeekData.status === 'NOT_AVAILABLE';

    return (
        <div className="flex flex-col gap-6 p-6 mx-auto w-full">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/kerja-praktik/kegiatan/bimbingan')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Detail Bimbingan Minggu Ke-{weekNumber}</h2>
                    <p className="text-muted-foreground">Isi form bimbingan sesuai dengan progres mingguan Anda.</p>
                </div>
            </div>

            <Card className="border-t-4 border-t-primary">
                <CardHeader className="bg-muted/30">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Informasi Bimbingan</CardTitle>
                            <CardDescription className="mt-1 flex flex-col gap-1">
                                <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Periode: {format(new Date(currentWeekData.startDate), 'd MMMM', { locale: idLocale })} - {format(new Date(currentWeekData.endDate), 'd MMMM yyyy', { locale: idLocale })}
                                </span>
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge
                                variant={config.variant as any}
                                className={cn("gap-1.5 px-3 py-1 font-medium shadow-none cursor-default w-fit", config.color)}
                            >
                                <config.icon className="h-4 w-4" />
                                {config.label}
                            </Badge>
                            {!isLocked && !isEditing && (
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    {currentWeekData.questions.map((q, index) => (
                        <div key={q.id} className="space-y-4">
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                                    {index + 1}
                                </div>
                                <div className="space-y-3 flex-1">
                                    <Label className="text-base font-medium leading-relaxed block pt-1">
                                        {q.questionText}
                                    </Label>
                                    <Textarea
                                        placeholder="Ketik detail progres pekerjaan Anda di sini..."
                                        className="min-h-[100px] resize-y focus:ring-1 focus:ring-primary/20 text-base"
                                        value={answers[q.id] || ''}
                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                        disabled={isLocked || !isEditing}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
                {isEditing && (
                    <CardFooter className="bg-muted/20 border-t px-6 flex justify-end gap-3 rounded-b-xl">
                        <Button variant="outline" onClick={handleCancelEdit}>Batal</Button>
                        {!isLocked && (
                            <Button
                                onClick={handleSubmit}
                                disabled={submitMutation.isPending}
                                className={cn(currentWeekData.status === 'LATE' && "bg-orange-600 hover:bg-orange-700")}
                            >
                                {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {currentWeekData.status === 'LATE' ? 'Kirim (Terlambat)' : 'Simpan & Kirim'}
                            </Button>
                        )}
                    </CardFooter>
                )}
            </Card>

            {currentWeekData.lecturerEvaluation.length > 0 && (
               <Card className="border-t-4 border-t-green-500 bg-green-50/10">
                   <CardHeader>
                       <CardTitle className="text-green-700 flex items-center gap-2">
                           <CheckCircle2 className="h-5 w-5" />
                           Tanggapan & Evaluasi Dosen Pembimbing
                       </CardTitle>
                       <CardDescription>
                           Feedback dan penilaian bimbingan dari dosen pembimbing Anda.
                       </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-6">
                       {currentWeekData.lecturerEvaluation.map((evalItem, index) => (
                           <div key={evalItem.criteriaId} className="space-y-3">
                               <div className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold mt-0.5">
                                        {index + 1}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <Label className="text-sm font-semibold text-green-800">
                                            {evalItem.criteriaName}
                                        </Label>
                                        
                                        {evalItem.inputType === 'EVALUATION' && evalItem.evaluationValue && (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-green-100/50 border-green-200 text-green-700 font-bold px-3">
                                                    {evalItem.evaluationValue.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                        )}

                                        {evalItem.answerText ? (
                                            <div className="p-4 rounded-lg bg-white border border-green-100 text-slate-700 text-sm leading-relaxed italic">
                                                "{evalItem.answerText}"
                                            </div>
                                        ) : (
                                            evalItem.inputType === 'TEXT' && (
                                                <span className="text-xs text-muted-foreground italic">Tidak ada catatan tambahan.</span>
                                            )
                                        )}
                                    </div>
                               </div>
                           </div>
                       ))}
                   </CardContent>
               </Card>
            )}
        </div>
    );
}
