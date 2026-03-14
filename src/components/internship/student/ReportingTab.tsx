import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, CheckCircle2, Clock, Info, AlertCircle, XCircle } from 'lucide-react';
import { Loading } from '@/components/ui/spinner';

interface ReportingTabProps {
    internship: any;
    isUploading: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'CERTIFICATE' | 'RECEIPT' | 'REPORT' | 'FINAL_REPORT') => void;
    handleRegisterSeminar: () => Promise<void>;
    latestSeminar: any;
    endDate: Date | null;
    reportingDeadline: Date | null;
    isReportingOverdue: boolean;
    isReportingApproaching: boolean;
}

export const ReportingTab: React.FC<ReportingTabProps> = ({
    internship,
    isUploading,
    onFileChange,
    endDate,
    reportingDeadline,
    isReportingOverdue,
    isReportingApproaching
}) => {
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
                                Pastikan semua dokumen wajib telah diunggah sebelum mendaftar seminar.
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
                                <span className="text-xs font-bold uppercase text-muted-foreground">Sertifikat Selesai KP</span>
                                {getStatusIcon(internship?.completionCertificateStatus, !!internship?.completionCertificateDocId)}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                        {internship?.completionCertificateDocId ? "Sudah Diunggah" : "Belum Diunggah"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">Format: PDF (Max 2MB)</span>
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
                                        disabled={isUploading === 'CERTIFICATE'}
                                    >
                                        {isUploading === 'CERTIFICATE' ? <Loading size="sm" /> : <Upload className="h-4 w-4" />}
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
                                    <span className="text-[10px] text-muted-foreground">Tanda terima dari perusahaan</span>
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
                                        disabled={isUploading === 'RECEIPT'}
                                    >
                                        {isUploading === 'RECEIPT' ? <Loading size="sm" /> : <Upload className="h-4 w-4" />}
                                        {internship?.companyReceiptDocId ? "Ganti File" : "Unggah File"}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Laporan Kegiatan */}
                        <div className="flex flex-col p-4 rounded-xl border bg-muted/30 gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Laporan Kegiatan (KP-002)</span>
                                {getStatusIcon(internship?.logbookDocumentStatus, !!internship?.logbookDocumentId)}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-background rounded-lg border">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-sm font-medium truncate">
                                        {internship?.logbookDocumentId ? "Sudah Diunggah" : "Belum Diunggah"}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">Logbook yang telah disahkan</span>
                                </div>
                            </div>
                            {internship?.logbookDocumentStatus !== 'APPROVED' && (
                                <div className="mt-auto pt-2">
                                    <input 
                                        type="file" 
                                        id="upload-report-internal" 
                                        className="hidden" 
                                        accept=".pdf"
                                        onChange={(e) => onFileChange(e, 'REPORT')}
                                    />
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full gap-2"
                                        onClick={() => document.getElementById('upload-report-internal')?.click()}
                                        disabled={isUploading === 'REPORT'}
                                    >
                                        {isUploading === 'REPORT' ? <Loading size="sm" /> : <Upload className="h-4 w-4" />}
                                        {internship?.logbookDocumentId ? "Ganti File" : "Unggah File"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
