import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Clock, Eye, FileText, Loader2, MessageSquare, Upload, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { getLecturerGuidanceTimeline, verifyFinalReportByLecturer } from '@/services/internship';

export default function LecturerFinalReportTab() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const queryClient = useQueryClient();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [feedbackPreviewOpen, setFeedbackPreviewOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [feedbackFile, setFeedbackFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: studentGuidance, isLoading } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    const report = studentGuidance?.report;
    const hasReport = !!report?.document;

    const statusBadge = useMemo(() => {
        switch (report?.status) {
            case 'APPROVED':
                return <Badge className="gap-1 bg-green-600 hover:bg-green-700"><CheckCircle2 className="h-3.5 w-3.5" />Final</Badge>;
            case 'REVISION_NEEDED':
                return <Badge variant="destructive" className="gap-1"><XCircle className="h-3.5 w-3.5" />Revisi</Badge>;
            case 'SUBMITTED':
                return <Badge variant="outline" className="gap-1 border-blue-300 bg-blue-50 text-blue-700"><Clock className="h-3.5 w-3.5" />Menunggu Review</Badge>;
            default:
                return <Badge variant="secondary">Belum Ada</Badge>;
        }
    }, [report?.status]);

    const resetDialogState = () => {
        setNotes('');
        setFeedbackFile(null);
    };

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
        queryClient.invalidateQueries({ queryKey: ['lecturerSupervisedStudents'] });
        queryClient.invalidateQueries({ queryKey: ['student-logbooks'] });
    };

    const handleApprove = async () => {
        if (!internshipId) return;

        setIsSubmitting(true);
        try {
            await verifyFinalReportByLecturer(internshipId, 'APPROVED', notes.trim() || undefined);
            toast.success('Laporan akhir disetujui sebagai laporan final');
            setApproveOpen(false);
            resetDialogState();
            refreshData();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyetujui laporan akhir');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!internshipId) return;

        setIsSubmitting(true);
        try {
            await verifyFinalReportByLecturer(internshipId, 'REVISION_NEEDED', notes.trim() || undefined, feedbackFile || undefined);
            toast.success('Laporan akhir dikembalikan untuk revisi');
            setRejectOpen(false);
            resetDialogState();
            refreshData();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menolak laporan akhir');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFeedbackFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran file maksimal 5MB');
            event.target.value = '';
            return;
        }
        if (file.type !== 'application/pdf') {
            toast.error('File feedback harus berformat PDF');
            event.target.value = '';
            return;
        }

        setFeedbackFile(file);
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!hasReport) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">Mahasiswa belum mengunggah laporan akhir</p>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs">Laporan akhir yang diunggah mahasiswa akan muncul di sini untuk Anda review.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-primary" />
                            Laporan Akhir Kerja Praktik
                        </CardTitle>
                        <CardDescription>
                            Review laporan akhir mahasiswa. Jika disetujui, dokumen ini menjadi laporan akhir final.
                        </CardDescription>
                    </div>
                    {statusBadge}
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        <div className="lg:col-span-7 space-y-4">
                            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Judul</p>
                                    <p className="text-sm font-semibold">{report?.title || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Diunggah</p>
                                    <p className="text-sm">{report?.uploadedAt ? new Date(report.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-xl border p-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{report?.document?.fileName || 'Laporan Akhir.pdf'}</p>
                                        <p className="text-xs text-muted-foreground">PDF</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </Button>
                            </div>

                            {report?.feedbackDocument && (
                                <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <MessageSquare className="h-5 w-5 text-amber-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">{report.feedbackDocument.fileName || 'Feedback.pdf'}</p>
                                            <p className="text-xs text-muted-foreground">Feedback revisi terakhir</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => setFeedbackPreviewOpen(true)}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-5 space-y-4">
                            <Card className="bg-blue-50/20 border-blue-100">
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-blue-600" />
                                        Catatan Untuk Mahasiswa
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {report?.notes ? (
                                        <p className="text-sm leading-relaxed italic text-blue-900">"{report.notes}"</p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <AlertCircle className="h-4 w-4" />
                                            Belum ada catatan.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setRejectOpen(true)}>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    {report?.status === 'APPROVED' ? 'Tolak Ulang' : 'Tolak'}
                                </Button>
                                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => setApproveOpen(true)} disabled={report?.status === 'APPROVED'}>
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Setujui
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={approveOpen} onOpenChange={(open) => {
                setApproveOpen(open);
                if (!open) resetDialogState();
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Setujui Laporan Akhir?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Dokumen laporan akhir ini akan ditetapkan sebagai laporan akhir final mahasiswa. Anda masih dapat menolak ulang nanti jika mahasiswa perlu mengunggah revisi.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Catatan opsional..."
                        className="min-h-[100px]"
                        disabled={isSubmitting}
                    />
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApprove} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Ya, Setujui
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={rejectOpen} onOpenChange={(open) => {
                setRejectOpen(open);
                if (!open) resetDialogState();
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{report?.status === 'APPROVED' ? 'Tolak Ulang Laporan Final?' : 'Tolak Laporan Akhir?'}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Status laporan akan menjadi revisi dan mahasiswa dapat mengunggah ulang laporan akhir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Catatan Revisi</Label>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Tuliskan bagian yang perlu direvisi..."
                                className="min-h-[120px]"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="feedback-file">File Feedback PDF</Label>
                            <input id="feedback-file" type="file" accept=".pdf" className="hidden" onChange={handleFeedbackFile} disabled={isSubmitting} />
                            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => document.getElementById('feedback-file')?.click()} disabled={isSubmitting}>
                                <Upload className="h-4 w-4" />
                                {feedbackFile ? feedbackFile.name : 'Pilih File Feedback'}
                            </Button>
                        </div>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleReject} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Ya, Tolak
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {report?.document && (
                <DocumentPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    fileName={report.document.fileName || 'Laporan Akhir.pdf'}
                    filePath={report.document.filePath || undefined}
                />
            )}

            {report?.feedbackDocument && (
                <DocumentPreviewDialog
                    open={feedbackPreviewOpen}
                    onOpenChange={setFeedbackPreviewOpen}
                    fileName={report.feedbackDocument.fileName || 'Feedback.pdf'}
                    filePath={report.feedbackDocument.filePath || undefined}
                />
            )}
        </div>
    );
}
