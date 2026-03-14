import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getLecturerGuidanceTimeline, verifyFinalReportByLecturer } from '@/services/internship.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, CheckCircle2, Clock, XCircle, AlertCircle, Eye, Edit } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import DocumentVerificationDialog from '@/components/internship/sekdep/DocumentVerificationDialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { toast } from 'sonner';

export default function LecturerFinalReportTab() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const [previewOpen, setPreviewOpen] = useState(false);
    const [feedbackPreviewOpen, setFeedbackPreviewOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [isEditMode, setIsEditMode] = useState(false);
    const queryClient = useQueryClient();

    const { data: studentGuidance, isLoading } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    const verifyMutation = useMutation({
        mutationFn: ({ status, notes, file }: { status: 'APPROVED' | 'REVISION_NEEDED', notes?: string, file?: File }) =>
            verifyFinalReportByLecturer(internshipId!, status, notes, file),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['lecturer-student-guidance-timeline', internshipId] });
            setDialogOpen(false);
        },
        onError: (error: unknown) => {
            toast.error(error instanceof Error ? error.message : "Gagal memverifikasi laporan akhir");
        }
    });

    const handleOpenDialog = (mode: 'APPROVE' | 'REJECT', isEdit: boolean = false) => {
        setDialogMode(mode);
        setIsEditMode(isEdit);
        setDialogOpen(true);
    };

    const handleConfirmVerification = (status: 'APPROVED' | 'REVISION_NEEDED', notes?: string, file?: File) => {
        verifyMutation.mutate({ status, notes, file });
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Get report data from internship
    const report = studentGuidance?.report;
    const reportStatus = report?.status ?? null;
    const reportTitle = report?.title ?? null;
    const reportNotes = report?.notes ?? null;
    const reportUploadedAt = report?.uploadedAt ?? null;
    const reportDocument = report?.document ?? null;
    const reportFeedbackDocument = report?.feedbackDocument ?? null;


    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'SUBMITTED':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Menunggu Verifikasi</Badge>;
            case 'APPROVED':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Disetujui</Badge>;
            case 'REVISION_NEEDED':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Perlu Revisi</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-400">Belum Diunggah</Badge>;
        }
    };

    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case 'SUBMITTED':
                return <Clock className="w-5 h-5 text-blue-600" />;
            case 'APPROVED':
                return <CheckCircle2 className="w-5 h-5 text-green-600" />;
            case 'REVISION_NEEDED':
                return <XCircle className="w-5 h-5 text-amber-600" />;
            default:
                return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Card untuk Laporan Akhir Mahasiswa */}
            <Card>
                <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Laporan Akhir Mahasiswa
                            </CardTitle>
                            <CardDescription>
                                Laporan akhir yang diunggah oleh mahasiswa
                            </CardDescription>
                        </div>
                        {report && reportStatus && reportStatus !== null && (
                            <div className="flex items-center gap-2">
                                {getStatusIcon(reportStatus)}
                                {getStatusBadge(reportStatus)}
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {!report || !reportStatus || reportStatus === null ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Mahasiswa belum mengunggah laporan akhir</p>
                        </div>
                    ) : (
                        <>
                            {(reportTitle || reportUploadedAt) && (
                                <div className="flex flex-col gap-2 p-4 rounded-xl bg-background border">
                                    {reportTitle && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Judul Laporan:</span>
                                            <span className="text-muted-foreground font-medium">{reportTitle}</span>
                                        </div>
                                    )}
                                    {reportUploadedAt && (
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">Tanggal Unggah:</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(reportUploadedAt), 'dd MMMM yyyy', { locale: idLocale })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {reportDocument && (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-background border">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <FileText className="h-5 w-5 text-primary shrink-0" />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="text-sm font-medium truncate">{reportDocument.fileName || 'Laporan Akhir.pdf'}</span>
                                            <span className="text-xs text-muted-foreground">PDF</span>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setPreviewOpen(true)}
                                        className="shrink-0"
                                    >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Preview
                                    </Button>
                                </div>
                            )}

                            {reportStatus === 'SUBMITTED' && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Laporan akhir menunggu verifikasi. Silakan review dokumen dan berikan keputusan.
                                    </p>
                                    <div className="flex gap-2">
                                        <Button 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => handleOpenDialog('REJECT')}
                                            disabled={verifyMutation.isPending}
                                        >
                                            Perlu Revisi
                                        </Button>
                                        <Button 
                                            className="flex-1"
                                            onClick={() => handleOpenDialog('APPROVE')}
                                            disabled={verifyMutation.isPending}
                                        >
                                            Setujui
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Card untuk Feedback Dosen */}
            {(reportNotes || reportFeedbackDocument) && (
                <Card>
                    <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Feedback Dosen Pembimbing
                                </CardTitle>
                                <CardDescription>
                                    Catatan dan file feedback dari dosen pembimbing
                                </CardDescription>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog('REJECT', true)}
                                className="shrink-0"
                                disabled={verifyMutation.isPending}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {reportNotes && (
                            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                                <p className="text-sm font-medium text-amber-900 mb-1">Catatan</p>
                                <p className="text-sm text-amber-800">{reportNotes}</p>
                            </div>
                        )}

                        {reportFeedbackDocument && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-sm font-medium truncate">
                                            {reportFeedbackDocument.fileName || 'Feedback.pdf'}
                                        </span>
                                        <span className="text-xs text-muted-foreground">File feedback yang telah diunggah</span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFeedbackPreviewOpen(true)}
                                    className="shrink-0"
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Preview
                                </Button>
                            </div>
                        )}

                        {!reportNotes && !reportFeedbackDocument && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">Belum ada feedback dari dosen pembimbing</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {reportDocument && (
                <DocumentPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    fileName={reportDocument.fileName}
                    filePath={reportDocument.filePath}
                />
            )}

            {reportFeedbackDocument && reportFeedbackDocument.filePath && (
                <DocumentPreviewDialog
                    open={feedbackPreviewOpen}
                    onOpenChange={setFeedbackPreviewOpen}
                    fileName={reportFeedbackDocument.fileName || 'Feedback.pdf'}
                    filePath={reportFeedbackDocument.filePath}
                />
            )}

            <DocumentVerificationDialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) {
                        setIsEditMode(false);
                    }
                }}
                onConfirm={handleConfirmVerification}
                isLoading={verifyMutation.isPending}
                title={isEditMode ? "Feedback" : "Laporan Akhir"}
                mode={dialogMode}
                initialNotes={reportNotes || ''}
                allowFileUpload={true}
                existingFeedbackFile={report?.feedbackDocument || null}
            />
        </div>
    );
}

