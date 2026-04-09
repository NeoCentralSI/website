import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Upload, Clock, MessageSquare, CheckCircle2, XCircle, AlertCircle, X, Save, Edit, Eye } from 'lucide-react';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

interface FinalReportTabProps {
    internship: any;
    isUploading: string | null;
    onFinalReportSubmit?: (title: string, file: File) => void;
}

export const FinalReportTab: React.FC<FinalReportTabProps> = ({
    internship,
    isUploading,
    onFinalReportSubmit
}) => {
    const [reportTitle, setReportTitle] = useState<string>(internship?.reportTitle || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [previewOpen, setPreviewOpen] = useState<boolean>(false);
    const [feedbackPreviewOpen, setFeedbackPreviewOpen] = useState<boolean>(false);
    


    useEffect(() => {
        if (internship?.reportTitle) {
            setReportTitle(internship.reportTitle);
        }
    }, [internship?.reportTitle]);

    // Reset edit mode when status changes to APPROVED
    useEffect(() => {
        if (internship?.reportStatus === 'APPROVED') {
            setIsEditMode(false);
            setSelectedFile(null);
        }
    }, [internship?.reportStatus]);

    // Reset selected file when upload is completed
    useEffect(() => {
        if (isUploading !== 'FINAL_REPORT' && selectedFile && internship?.reportDocumentId) {
            // Upload completed, reset selected file
            setSelectedFile(null);
            const fileInput = document.getElementById('upload-final-report-internal') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }, [isUploading, internship?.reportDocumentId, selectedFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validasi ukuran file (5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file maksimal 5MB");
                return;
            }
            // Validasi tipe file
            if (file.type !== 'application/pdf') {
                toast.error("File harus berformat PDF");
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('upload-final-report-internal') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleSubmit = () => {
        if (!reportTitle.trim()) {
            toast.error("Judul laporan akhir wajib diisi");
            return;
        }
        if (!selectedFile && !internship?.reportDocumentId) {
            toast.error("File laporan akhir wajib diunggah");
            return;
        }
        if (onFinalReportSubmit) {
            if (selectedFile) {
                // Upload new file with title
                onFinalReportSubmit(reportTitle.trim(), selectedFile);
            } else if (internship?.reportDocumentId) {
                // Update title only (no new file)
                onFinalReportSubmit(reportTitle.trim(), new File([], 'dummy.pdf'));
            }
            // Reset setelah submit
            setSelectedFile(null);
            setIsEditMode(false);
            const fileInput = document.getElementById('upload-final-report-internal') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        }
    };

    const canEdit = internship?.reportStatus === 'SUBMITTED' || internship?.reportStatus === 'REVISION_NEEDED';
    const isApproved = internship?.reportStatus === 'APPROVED';
    const hasDocument = !!internship?.reportDocumentId;
    const getStatusIcon = (status: string | null | undefined, hasDoc: boolean) => {
        if (!hasDoc) {
            return <Clock className="h-5 w-5 text-orange-500" />;
        }
        
        switch (status) {
            case 'APPROVED':
                return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'SUBMITTED':
                return <Clock className="h-5 w-5 text-blue-500" />;
            case 'REVISION_NEEDED':
                return <XCircle className="h-5 w-5 text-amber-500" />;
            default:
                return <AlertCircle className="h-5 w-5 text-slate-400" />;
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Laporan Akhir Kerja Praktik</CardTitle>
                    <CardDescription>
                        Unggah draf Laporan Akhir Anda untuk diverifikasi oleh Sekretaris Departemen.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex flex-col p-6 rounded-2xl border bg-muted/30 gap-4 flex-1 w-full relative">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background rounded-lg border">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">Laporan Akhir</span>
                                        <span className="text-xs text-muted-foreground">Format: PDF (Max 5MB)</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(internship?.reportStatus, !!internship?.reportDocumentId)}
                                    {canEdit && hasDocument && !isEditMode && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setIsEditMode(true)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {/* Field input judul - hanya muncul saat belum ada document atau dalam mode edit */}
                                {(isEditMode || !hasDocument) && (
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="report-title" className="text-sm font-medium">
                                            Judul Laporan Akhir <span className="text-destructive">*</span>
                                        </Label>
                                        <Input
                                            id="report-title"
                                            type="text"
                                            placeholder="Masukkan judul laporan akhir Anda"
                                            value={reportTitle}
                                            onChange={(e) => setReportTitle(e.target.value)}
                                            disabled={isUploading === 'FINAL_REPORT' || isApproved}
                                            className="w-full"
                                        />
                                    </div>
                                )}

                                {/* Informasi laporan yang sudah diupload - hanya muncul saat sudah ada document dan tidak dalam mode edit */}
                                {hasDocument && !isEditMode && !selectedFile && (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-2 p-4 rounded-xl bg-background border">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">Judul Saat Ini:</span>
                                                <span className="text-muted-foreground font-medium">{internship.reportTitle || '-'}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium">Status Pengiriman:</span>
                                                <span className="text-muted-foreground">{new Date(internship.reportUploadedAt || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                            </div>
                                        </div>
                                        
                                        {internship?.reportDocument && (
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-background border">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-sm font-medium truncate">{internship.reportDocument.fileName || 'Laporan Akhir.pdf'}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {internship.reportDocument.fileSize ? `${(internship.reportDocument.fileSize / 1024 / 1024).toFixed(2)} MB` : 'PDF'}
                                                        </span>
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
                                    </div>
                                )}

                                {(isEditMode || !hasDocument) && (
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="upload-final-report-internal" className="text-sm font-medium">
                                            File Laporan Akhir {!hasDocument && <span className="text-destructive">*</span>}
                                        </Label>
                                        <input 
                                            type="file" 
                                            id="upload-final-report-internal" 
                                            className="hidden" 
                                            accept=".pdf"
                                            onChange={handleFileSelect}
                                            disabled={isUploading === 'FINAL_REPORT' || isApproved}
                                        />
                                        
                                        {selectedFile ? (
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-background border">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRemoveFile}
                                                    disabled={isUploading === 'FINAL_REPORT'}
                                                    className="shrink-0"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full gap-2"
                                                onClick={() => document.getElementById('upload-final-report-internal')?.click()}
                                                disabled={isUploading === 'FINAL_REPORT' || isApproved}
                                            >
                                                <Upload className="h-4 w-4" />
                                                {hasDocument ? "Ganti File PDF" : "Pilih File PDF"}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {(isEditMode || !hasDocument) && (
                                    <div className="pt-2 flex gap-2">
                                        {isEditMode && (
                                            <Button 
                                                type="button"
                                                variant="outline"
                                                className="flex-1 gap-2"
                                                onClick={() => {
                                                    setIsEditMode(false);
                                                    setSelectedFile(null);
                                                    setReportTitle(internship?.reportTitle || '');
                                                    const fileInput = document.getElementById('upload-final-report-internal') as HTMLInputElement;
                                                    if (fileInput) {
                                                        fileInput.value = '';
                                                    }
                                                }}
                                                disabled={isUploading === 'FINAL_REPORT'}
                                            >
                                                Batal
                                            </Button>
                                        )}
                                        <Button 
                                            className={`${isEditMode ? 'flex-1' : 'w-full'} gap-2`}
                                            onClick={handleSubmit}
                                            disabled={isUploading === 'FINAL_REPORT' || isApproved || !reportTitle.trim() || (!selectedFile && !hasDocument)}
                                        >
                                            {isUploading === 'FINAL_REPORT' ? (
                                                <>
                                                    <Loading size="sm" />
                                                    Mengunggah...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    {hasDocument ? "Simpan Perubahan" : "Simpan Laporan Akhir"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Card className="flex-1 w-full bg-blue-50/20 border-blue-100">
                            <CardHeader>
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                    Catatan Verifikasi (Dosen Pembimbing)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {internship?.reportNotes ? (
                                    <div className="p-4 rounded-xl bg-background border border-blue-200">
                                        <p className="text-sm text-blue-900 leading-relaxed italic">
                                            "{internship.reportNotes}"
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                                        <span className="text-xs">Belum ada catatan verifikasi.</span>
                                    </div>
                                )}

                                {/* File Feedback dari Dosen */}
                                {internship?.reportStatus === 'REVISION_NEEDED' && internship?.reportFeedbackDocument && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">File Feedback dari Dosen Pembimbing</Label>
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-amber-200">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="h-5 w-5 text-amber-600 shrink-0" />
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-sm font-medium truncate">
                                                        {internship.reportFeedbackDocument.fileName || 'Feedback.pdf'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Dosen telah memberikan feedback dengan highlight pada PDF ini
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setFeedbackPreviewOpen(true)}
                                                >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>



            {hasDocument && internship?.reportDocument && (
                <DocumentPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    fileName={internship.reportDocument.fileName || 'Laporan Akhir.pdf'}
                    filePath={internship.reportDocument.filePath || undefined}
                />
            )}

            {internship?.reportFeedbackDocument && (
                <DocumentPreviewDialog
                    open={feedbackPreviewOpen}
                    onOpenChange={setFeedbackPreviewOpen}
                    fileName={internship.reportFeedbackDocument.fileName || 'Feedback.pdf'}
                    filePath={internship.reportFeedbackDocument.filePath || undefined}
                />
            )}


        </div>
    );
};
