import React, { useState } from 'react';
import { cn } from "@/lib/utils";
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, CheckCircle2, Clock, Info, AlertCircle, XCircle, Eye } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';

interface ReportingTabProps {
    internship: any;
    isUploading: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'CERTIFICATE' | 'RECEIPT' | 'REPORT' | 'FINAL_REPORT' | 'COMPANY_REPORT') => void;
    endDate: Date | null;
    reportingDeadline: Date | null;
    isReportingOverdue: boolean;
    isReportingApproaching: boolean;
    generatedAssessmentUrl?: string | null;
}

export const ReportingTab: React.FC<ReportingTabProps> = ({
    internship,
    isUploading,
    onFileChange,
    endDate,
    reportingDeadline,
    isReportingOverdue,
    isReportingApproaching,
    generatedAssessmentUrl
}) => {
    const [previewConfig, setPreviewConfig] = useState<{
        open: boolean;
        fileName: string;
        filePath: string;
    }>({
        open: false,
        fileName: '',
        filePath: ''
    });

    const handlePreview = (fileName: string, filePath: string) => {
        setPreviewConfig({
            open: true,
            fileName,
            filePath
        });
    };
    const getStatusIcon = (status: string | null | undefined, hasDoc: boolean, type?: string) => {
        if (!hasDoc) {
            if (type === 'KP-002') return <Clock className="h-5 w-5 text-slate-300" />;
            if (type === 'CERTIFICATE') return <Clock className="h-5 w-5 text-slate-300" />;
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
            {isReportingOverdue && !internship?.logbookDocumentId && (
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 flex gap-4 items-start">
                    <Info className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-900">Batas Waktu Pelaporan Terlewati!</span>
                        <p className="text-xs text-red-700 leading-relaxed">
                            Batas waktu pelaporan adalah 1 bulan dari tanggal selesai KP ({endDate?.toLocaleDateString('id-ID')}). 
                            Sesuai Pedoman KP, Anda terancam sanksi <strong>wajib mengulang Kerja Praktik</strong> pada semester berikutnya. 
                            Silakan segera hubungi Sekretaris Departemen.
                        </p>
                    </div>
                </div>
            )}
            
            {isReportingApproaching && !isReportingOverdue && !internship?.logbookDocumentId && (
                <div className="p-4 rounded-xl border border-orange-200 bg-orange-50 flex gap-4 items-start">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-orange-900">Masa Pelaporan Segera Berakhir</span>
                        <p className="text-xs text-orange-700 leading-relaxed">
                            Batas waktu pelaporan Anda adalah {reportingDeadline?.toLocaleDateString('id-ID')}. 
                            Segera unggah dokumen wajib untuk menghindari sanksi.
                        </p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-blue-500" />
                                Status Pelaporan
                            </CardTitle>
                            <CardDescription>
                                Lengkapi dokumen pelaporan yang diperlukan sebelum mendaftar seminar.
                            </CardDescription>
                        </div>
                        {endDate && (
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">Batas Pelaporan</span>
                                <span className={`text-xs font-semibold ${isReportingOverdue ? 'text-red-600' : 'text-foreground'}`}>
                                    {reportingDeadline?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Completion Certificate */}
                        <div className="flex flex-col p-4 rounded-xl border bg-muted/30 gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase text-muted-foreground">Sertifikat Selesai KP</span>
                                    <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-bold uppercase border-slate-200 text-slate-400">Opsional</Badge>
                                </div>
                                {getStatusIcon(internship?.completionCertificateStatus, !!internship?.completionCertificateDocId, 'CERTIFICATE')}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                        {internship?.completionCertificateDocId ? "Sudah Diunggah" : "Belum Diunggah"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">Format: PDF (Max 2MB)</span>
                                        {internship?.completionCertificateDoc?.fileName && (
                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handlePreview(internship.completionCertificateDoc.fileName, internship.completionCertificateDoc.filePath)}>
                                                <Eye className="h-3 w-3 text-primary" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {internship?.completionCertificateStatus !== 'APPROVED' && (
                                <div className="mt-auto pt-2">
                                    <input 
                                        type="file" 
                                        id="upload-cert" 
                                        className="hidden" 
                                        accept=".pdf"
                                        onChange={(e) => onFileChange(e, 'CERTIFICATE')}
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full gap-2"
                                        onClick={() => document.getElementById('upload-cert')?.click()}
                                        disabled={!!isUploading}
                                    >
                                        {isUploading === 'CERTIFICATE' ? <Spinner className="text-current" /> : <Upload className="h-4 w-4" />}
                                        {internship?.completionCertificateDocId ? "Ganti File" : "Unggah File"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Company Receipt (KP-004) */}
                        <div className="flex flex-col p-4 rounded-xl border bg-muted/30 gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Tanda Terima (KP-004)</span>
                                {getStatusIcon(internship?.companyReceiptStatus, !!internship?.companyReceiptDocId)}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                        {internship?.companyReceiptDocId ? "Sudah Diunggah" : "Belum Diunggah"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">Tanda terima dari perusahaan</span>
                                        {internship?.companyReceiptDoc?.fileName && (
                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handlePreview(internship.companyReceiptDoc.fileName, internship.companyReceiptDoc.filePath)}>
                                                <Eye className="h-3 w-3 text-primary" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {internship?.companyReceiptStatus !== 'APPROVED' && (
                                <div className="mt-auto pt-2">
                                    <input 
                                        type="file" 
                                        id="upload-receipt" 
                                        className="hidden" 
                                        accept=".pdf"
                                        onChange={(e) => onFileChange(e, 'RECEIPT')}
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full gap-2"
                                        onClick={() => document.getElementById('upload-receipt')?.click()}
                                        disabled={!!isUploading}
                                    >
                                        {isUploading === 'RECEIPT' ? <Spinner className="text-current" /> : <Upload className="h-4 w-4" />}
                                        {internship?.companyReceiptDocId ? "Ganti File" : "Unggah File"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Laporan Kegiatan (KP-002) */}
                        <div className="flex flex-col p-4 rounded-xl border bg-muted/30 gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Laporan Kegiatan (KP-002)</span>
                                {getStatusIcon(internship?.logbookDocumentStatus, !!internship?.logbookDocumentId, 'KP-002')}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg border transition-colors",
                                    internship?.logbookDocumentId ? "bg-primary/10 border-primary/20" : "bg-background border-slate-200"
                                )}>
                                    <FileText className={cn("h-6 w-6", internship?.logbookDocumentId ? "text-primary" : "text-slate-400")} />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className={cn(
                                        "text-sm font-bold truncate",
                                        internship?.logbookDocumentId ? "text-slate-900" : "text-slate-500"
                                    )}>
                                        {internship?.logbookDocumentId ? "Logbook Bersertifikat" : "Belum Tersedia"}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-muted-foreground">
                                            {internship?.logbookDocumentId ? "Dihasilkan secara otomatis" : "Otomatis saat TTD Pembimbing"}
                                        </span>
                                        {internship?.logbookDocument?.fileName && (
                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => handlePreview(internship.logbookDocument.fileName, internship.logbookDocument.filePath)}>
                                                <Eye className="h-3 w-3 text-primary" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto pt-2">
                                {internship?.logbookDocumentId ? (
                                    <Button 
                                        size="sm" 
                                        className="w-full gap-2 font-bold"
                                        onClick={() => handlePreview(internship.logbookDocument.fileName, internship.logbookDocument.filePath)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Lihat / Download
                                    </Button>
                                ) : (
                                    <div className="w-full p-3 rounded-lg bg-slate-100 border border-slate-200 text-center">
                                        <p className="text-[10px] font-semibold text-slate-500">
                                            Menunggu Penilaian & TTD Pembimbing Lapangan
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Laporan Akhir Instansi */}
                        <div className="flex flex-col p-4 rounded-xl border bg-muted/30 gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Laporan Instansi</span>
                                {getStatusIcon(internship?.companyReportStatus, !!internship?.companyReportDocId)}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                        {internship?.companyReportDocId ? "Sudah Diunggah" : "Belum Diunggah"}
                                    </span>
                                    {internship?.companyReportDocId && internship.companyReportDoc?.fileName && (
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-muted-foreground truncate">{internship.companyReportDoc.fileName}</span>
                                            <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1" onClick={() => handlePreview(internship.companyReportDoc.fileName, internship.companyReportDoc.filePath)}>
                                                <Eye className="h-3 w-3 text-primary" />
                                            </Button>
                                        </div>
                                    )}
                                    {!internship?.companyReportDocId && (
                                        <span className="text-[10px] text-muted-foreground">Salinan laporan untuk instansi</span>
                                    )}
                                    {generatedAssessmentUrl && (
                                        <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-wider">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Link Penilaian Dihasilkan
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-background border px-2 py-1 rounded text-[10px] truncate font-mono text-muted-foreground">
                                                    {generatedAssessmentUrl}
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary"
                                                    className="h-6 gap-1 text-[10px] px-2"
                                                    onClick={() => window.open(generatedAssessmentUrl, '_blank')}
                                                >
                                                    <Eye className="h-3 w-3" />
                                                    Buka
                                                </Button>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground leading-tight italic">
                                                *Link ini telah dikirim ke email pembimbing ({internship?.fieldSupervisorEmail || 'email tidak ditemukan'}).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {(!internship?.companyReportDocId || internship?.companyReportStatus === 'SUBMITTED' || internship?.companyReportStatus === 'REVISION_NEEDED') && (
                                <div className="mt-auto pt-2">
                                    <input 
                                        type="file" 
                                        id="upload-company-report" 
                                        className="hidden" 
                                        accept=".pdf"
                                        onChange={(e) => onFileChange(e, 'COMPANY_REPORT')}
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full gap-2"
                                        onClick={() => document.getElementById('upload-company-report')?.click()}
                                        disabled={!!isUploading || !internship?.isLogbookLocked}
                                    >
                                        {isUploading === 'COMPANY_REPORT' ? <Spinner className="text-current" /> : <Upload className="h-4 w-4" />}
                                        {internship?.companyReportDocId ? "Ganti File" : "Unggah File"}
                                    </Button>
                                    {!internship?.isLogbookLocked && (
                                        <p className="text-[9px] text-amber-600 font-medium mt-1 leading-tight">
                                            *Selesaikan logbook terlebih dahulu untuk mengunggah.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </CardContent>
            </Card>

            <DocumentPreviewDialog
                open={previewConfig.open}
                onOpenChange={(open) => setPreviewConfig(prev => ({ ...prev, open }))}
                fileName={previewConfig.fileName}
                filePath={previewConfig.filePath}
            />
        </div>
    );
};
