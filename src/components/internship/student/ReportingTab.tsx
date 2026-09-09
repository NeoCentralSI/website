import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Clock, Eye, FileText, Info, Upload } from 'lucide-react';
import React, { useMemo, useState } from 'react';

interface ReportingTabProps {
    internship: any;
    isUploading: string | null;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'CERTIFICATE' | 'RECEIPT' | 'REPORT' | 'FINAL_REPORT' | 'COMPANY_REPORT') => void;
    endDate: Date | null;
    reportingDeadline: Date | null;
    isReportingOverdue: boolean;
    isReportingApproaching: boolean;
}

type UploadType = 'CERTIFICATE' | 'RECEIPT' | 'COMPANY_REPORT';

type ReportingRow = {
    id: string;
    title: string;
    optional?: boolean;
    fileHint: string;
    fileName?: string | null;
    filePath?: string | null;
    status: string | null;
    hasDoc: boolean;
    uploadType?: UploadType;
    canUpload: boolean;
    isAuto?: boolean;
    waitingHint?: string | null;
};

const FILE_FORMAT_HINT = 'PDF • Maks. 2MB';

const getStatusBadge = (row: ReportingRow) => {
    if (!row.hasDoc) {
        return (
            <Badge variant="outline" className="pointer-events-none border-slate-200 text-slate-500">
                {row.isAuto ? 'Belum Tersedia' : 'Belum Diunggah'}
            </Badge>
        );
    }

    switch (row.status) {
        case 'APPROVED':
            return <Badge className="pointer-events-none border-emerald-200 bg-emerald-100 text-emerald-700">Disetujui</Badge>;
        case 'SUBMITTED':
            return <Badge className="pointer-events-none border-blue-200 bg-blue-100 text-blue-700">Menunggu Verifikasi</Badge>;
        case 'REVISION_NEEDED':
            return <Badge className="pointer-events-none border-amber-200 bg-amber-100 text-amber-700">Perlu Revisi</Badge>;
        default:
            return <Badge variant="outline" className="pointer-events-none">Sudah Diunggah</Badge>;
    }
};

export const ReportingTab: React.FC<ReportingTabProps> = ({
    internship,
    isUploading,
    onFileChange,
    endDate,
    reportingDeadline,
    isReportingOverdue,
    isReportingApproaching
}) => {
    const [previewConfig, setPreviewConfig] = useState({
        open: false,
        fileName: '',
        filePath: ''
    });

    const handlePreview = (fileName: string, filePath: string) => {
        setPreviewConfig({ open: true, fileName, filePath });
    };

    const seminarMinutesDocument = (internship?.seminars || []).find(
        (seminar: { status: string; beritaAcaraDocument?: { fileName: string; filePath: string } }) =>
            seminar.status === 'COMPLETED' && seminar.beritaAcaraDocument
    )?.beritaAcaraDocument || null;
    const isFieldAssessmentVerified = ['COMPLETED', 'APPROVED'].includes(internship?.fieldAssessmentStatus || '');

    const tableData = useMemo<ReportingRow[]>(() => [
        {
            id: 'company-report',
            title: 'Laporan Instansi',
            fileHint: FILE_FORMAT_HINT,
            fileName: internship?.companyReportDoc?.fileName,
            filePath: internship?.companyReportDoc?.filePath,
            status: isFieldAssessmentVerified ? 'APPROVED' : internship?.companyReportStatus || null,
            hasDoc: !!internship?.companyReportDocId,
            uploadType: 'COMPANY_REPORT',
            canUpload: internship?.companyReportStatus !== 'APPROVED' && !isFieldAssessmentVerified,
            waitingHint: !internship?.companyReportDocId && !internship?.isLogbookLocked
                ? 'Selesaikan logbook terlebih dahulu untuk mengunggah.'
                : null,
        },
        {
            id: 'certificate',
            title: 'Sertifikat Selesai',
            optional: true,
            fileHint: FILE_FORMAT_HINT,
            fileName: internship?.completionCertificateDoc?.fileName,
            filePath: internship?.completionCertificateDoc?.filePath,
            status: internship?.completionCertificateStatus || null,
            hasDoc: !!internship?.completionCertificateDocId,
            uploadType: 'CERTIFICATE',
            canUpload: internship?.completionCertificateStatus !== 'APPROVED',
        },
        {
            id: 'receipt',
            title: 'Tanda Terima',
            fileHint: FILE_FORMAT_HINT,
            fileName: internship?.companyReceiptDoc?.fileName,
            filePath: internship?.companyReceiptDoc?.filePath,
            status: internship?.companyReceiptStatus || null,
            hasDoc: !!internship?.companyReceiptDocId,
            uploadType: 'RECEIPT',
            canUpload: internship?.companyReceiptStatus !== 'APPROVED',
        },
        {
            id: 'logbook',
            title: 'Logbook',
            fileHint: FILE_FORMAT_HINT,
            fileName: internship?.logbookDocument?.fileName,
            filePath: internship?.logbookDocument?.filePath,
            status: internship?.logbookDocumentStatus || (internship?.logbookDocumentId ? 'APPROVED' : null),
            hasDoc: !!internship?.logbookDocumentId,
            canUpload: false,
            isAuto: true,
            waitingHint: internship?.logbookDocumentId ? null : 'Menunggu Penilaian & TTD Pembimbing Lapangan',
        },
        {
            id: 'berita-acara',
            title: 'Berita Acara',
            fileHint: FILE_FORMAT_HINT,
            fileName: seminarMinutesDocument?.fileName,
            filePath: seminarMinutesDocument?.filePath,
            status: seminarMinutesDocument ? 'APPROVED' : null,
            hasDoc: !!seminarMinutesDocument,
            canUpload: false,
            isAuto: true,
            waitingHint: seminarMinutesDocument ? null : 'Menunggu seminar diselesaikan dosen',
        },
    ], [internship, isFieldAssessmentVerified, seminarMinutesDocument]);

    const triggerUpload = (uploadType: UploadType) => {
        document.getElementById(`upload-${uploadType.toLowerCase()}`)?.click();
    };

    const columns = useMemo<Column<ReportingRow>[]>(() => [
        {
            key: 'title',
            header: 'Nama Dokumen',
            render: (row) => (
                <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-700">{row.title}</span>
                            {row.optional && (
                                <Badge variant="outline" className="h-4 px-1.5 text-[9px] font-bold uppercase text-slate-400">
                                    Opsional
                                </Badge>
                            )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">{row.fileHint}</span>
                    </div>
                </div>
            ),
        },
        {
            key: 'file',
            header: 'File',
            render: (row) => (
                <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-slate-600">
                        {row.fileName || '—'}
                    </span>
                    {row.waitingHint && !row.hasDoc && (
                        <span className="mt-0.5 text-[11px] font-medium text-amber-600">{row.waitingHint}</span>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            className: 'w-[180px]',
            render: (row) => getStatusBadge(row),
        },
        {
            key: 'actions',
            header: 'Aksi',
            className: 'w-[220px] text-right',
            render: (row) => (
                <div className="flex items-center justify-end gap-2">
                    {row.hasDoc && row.fileName && row.filePath && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handlePreview(row.fileName!, row.filePath!)}
                        >
                            <Eye className="h-4 w-4" />
                            Lihat
                        </Button>
                    )}
                    {row.canUpload && row.uploadType && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5"
                            onClick={() => triggerUpload(row.uploadType!)}
                            disabled={!!isUploading || (row.uploadType === 'COMPANY_REPORT' && !internship?.isLogbookLocked)}
                        >
                            {isUploading === row.uploadType ? <Spinner className="text-current" /> : <Upload className="h-4 w-4" />}
                            {row.hasDoc ? 'Ganti File' : 'Unggah'}
                        </Button>
                    )}
                </div>
            ),
        },
    ], [internship?.isLogbookLocked, isUploading]);

    return (
        <div className="flex flex-col gap-6">
            {isReportingOverdue && !internship?.logbookDocumentId && (
                <div className="flex items-start gap-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <Info className="mt-0.5 h-5 w-5 text-red-600" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-red-900">Batas Waktu Pelaporan Terlewati!</span>
                        <p className="text-xs leading-relaxed text-red-700">
                            Batas waktu pelaporan adalah 1 bulan dari tanggal selesai KP ({endDate?.toLocaleDateString('id-ID')}).
                            Sesuai Pedoman KP, Anda terancam sanksi <strong>wajib mengulang Kerja Praktik</strong> pada semester berikutnya.
                            Silakan segera hubungi Sekretaris Departemen.
                        </p>
                    </div>
                </div>
            )}

            {isReportingApproaching && !isReportingOverdue && !internship?.logbookDocumentId && (
                <div className="flex items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <Clock className="mt-0.5 h-5 w-5 text-orange-600" />
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-orange-900">Masa Pelaporan Segera Berakhir</span>
                        <p className="text-xs leading-relaxed text-orange-700">
                            Batas waktu pelaporan Anda adalah {reportingDeadline?.toLocaleDateString('id-ID')}.
                            Segera unggah dokumen wajib untuk menghindari sanksi.
                        </p>
                    </div>
                </div>
            )}

            <input type="file" id="upload-certificate" className="hidden" accept=".pdf" onChange={(e) => onFileChange(e, 'CERTIFICATE')} />
            <input type="file" id="upload-receipt" className="hidden" accept=".pdf" onChange={(e) => onFileChange(e, 'RECEIPT')} />
            <input type="file" id="upload-company_report" className="hidden" accept=".pdf" onChange={(e) => onFileChange(e, 'COMPANY_REPORT')} />

            <InternshipTable
                columns={columns}
                data={tableData}
                total={tableData.length}
                page={1}
                pageSize={10}
                onPageChange={() => {}}
                hidePagination
                rowKey={(row) => row.id}
                emptyText="Belum ada dokumen pelaporan."
                actions={
                    endDate ? (
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">Batas Pelaporan</span>
                            <span className={`text-xs font-semibold ${isReportingOverdue ? 'text-red-600' : 'text-foreground'}`}>
                                {reportingDeadline?.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    ) : undefined
                }
            />

            <DocumentPreviewDialog
                open={previewConfig.open}
                onOpenChange={(open) => setPreviewConfig((prev) => ({ ...prev, open }))}
                fileName={previewConfig.fileName}
                filePath={previewConfig.filePath}
            />
        </div>
    );
};
