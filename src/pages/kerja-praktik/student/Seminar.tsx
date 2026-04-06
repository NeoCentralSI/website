import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudentLogbooks, uploadInternshipDocument, submitCompletionCertificate, submitCompanyReceipt, submitInternshipReport, submitLogbookDocument } from '@/services/internship.service';
import { Loading } from '@/components/ui/spinner';
import { toast } from 'sonner';

// Extracted Components
import { ReportingTab } from '@/components/internship/student/ReportingTab';
import { FinalReportTab } from '@/components/internship/student/FinalReportTab';
import { SeminarTab } from '@/components/internship/student/SeminarTab';
import { GradesTab } from '@/components/internship/student/GradesTab';

export default function InternshipSeminarPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    const location = useLocation();

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik', to: '/kerja-praktik' },
        { label: 'Seminar & Nilai' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const { data: logbookData, isLoading } = useQuery({
        queryKey: ['student-logbooks'],
        queryFn: () => getStudentLogbooks(),
    });

    const tabs = [
        { label: 'Pelaporan', to: '/kerja-praktik/seminar/pelaporan', end: true },
        { label: 'Laporan Akhir', to: '/kerja-praktik/seminar/laporan-akhir' },
        { label: 'Seminar', to: '/kerja-praktik/seminar/jadwal' },
        { label: 'Nilai', to: '/kerja-praktik/seminar/nilai' },
    ];

    const internship = logbookData?.data?.internship;
    const seminars = internship?.seminars || [];
    const latestSeminar = seminars[0];

    const [isUploading, setIsUploading] = useState<string | null>(null);

    const handleUpload = async (type: 'CERTIFICATE' | 'RECEIPT' | 'REPORT' | 'FINAL_REPORT', file: File, title?: string) => {
        try {
            setIsUploading(type);
            const { documentId } = await uploadInternshipDocument(file);
            
            if (type === 'CERTIFICATE') {
                await submitCompletionCertificate(documentId);
                toast.success("Sertifikat berhasil diunggah");
            } else if (type === 'RECEIPT') {
                await submitCompanyReceipt(documentId);
                toast.success("Tanda terima (KP-004) berhasil diunggah");
            } else if (type === 'REPORT') {
                await submitLogbookDocument(documentId);
                toast.success("Logbook berhasil diunggah");
            } else if (type === 'FINAL_REPORT') {
                if (!title || !title.trim()) {
                    throw new Error("Judul laporan akhir wajib diisi");
                }
                await submitInternshipReport(title.trim(), documentId);
                toast.success("Laporan akhir berhasil diajukan untuk verifikasi");
            }
            
            queryClient.invalidateQueries({ queryKey: ['student-logbooks'] });
        } catch (error: unknown) {
            toast.error((error as Error).message || "Gagal mengunggah dokumen");
        } finally {
            setIsUploading(null);
        }
    };

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'CERTIFICATE' | 'RECEIPT' | 'REPORT' | 'FINAL_REPORT') => {
        const file = e.target.files?.[0];
        if (file) {
            handleUpload(type, file);
        }
    };

    const handleFinalReportSubmit = async (title: string, file: File) => {
        // If file is empty (dummy file for title-only update), use existing documentId
        if (file.size === 0 && internship?.reportDocumentId) {
            // Update title only using existing document
            try {
                setIsUploading('FINAL_REPORT');
                await submitInternshipReport(title, internship.reportDocumentId);
                toast.success("Judul laporan akhir berhasil diperbarui");
                queryClient.invalidateQueries({ queryKey: ['student-logbooks'] });
            } catch (error: unknown) {
                toast.error((error as Error).message || "Gagal memperbarui judul");
            } finally {
                setIsUploading(null);
            }
        } else {
            await handleUpload('FINAL_REPORT', file, title);
        }
    };

    const isPelaporan = location.pathname === '/kerja-praktik/seminar/pelaporan';
    const isLaporanAkhir = location.pathname === '/kerja-praktik/seminar/laporan-akhir';
    const isSeminar = location.pathname === '/kerja-praktik/seminar/jadwal';
    const isNilai = location.pathname === '/kerja-praktik/seminar/nilai';

    // Deadline calculations
    const endDate = internship?.actualEndDate ? new Date(internship.actualEndDate) : null;
    
    const reportingDeadline = endDate ? new Date(endDate.getTime()) : null;
    if (reportingDeadline) reportingDeadline.setMonth(reportingDeadline.getMonth() + 1);
    
    const seminarDeadline = endDate ? new Date(endDate.getTime()) : null;
    if (seminarDeadline) seminarDeadline.setMonth(seminarDeadline.getMonth() + 2);

    const now = new Date();
    const isReportingOverdue = reportingDeadline ? now > reportingDeadline : false;
    const isReportingApproaching = reportingDeadline ? (reportingDeadline.getTime() - now.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;
    
    const isSeminarOverdue = seminarDeadline ? now > seminarDeadline : false;
    const isSeminarApproaching = seminarDeadline ? (seminarDeadline.getTime() - now.getTime()) < 14 * 24 * 60 * 60 * 1000 : false;



    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loading size="lg" text="Memuat data pelaksanaan KP..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Seminar & Nilai Kerja Praktik</h1>
                <p className="text-muted-foreground text-sm">
                    {isPelaporan && "Lengkapi dokumen pelaporan untuk mendaftar seminar."}
                    {isLaporanAkhir && "Unggah dan kelola laporan akhir Kerja Praktik Anda."}
                    {isSeminar && "Lihat jadwal dan informasi seminar Kerja Praktik Anda."}
                    {isNilai && "Pantau rincian nilai akhir Kerja Praktik Anda."}
                </p>
            </div>

            <TabsNav tabs={tabs} />

            <div className="grid grid-cols-1 gap-6">
                {isPelaporan && (
                    <ReportingTab 
                        internship={internship}
                        isUploading={isUploading}
                        onFileChange={onFileChange}
                        endDate={endDate}
                        reportingDeadline={reportingDeadline}
                        isReportingOverdue={isReportingOverdue}
                        isReportingApproaching={isReportingApproaching}
                    />
                )}
                {isLaporanAkhir && (
                    <FinalReportTab 
                        internship={internship}
                        isUploading={isUploading}
                        onFileChange={onFileChange}
                        onFinalReportSubmit={handleFinalReportSubmit}
                    />
                )}
                {isSeminar && (
                    <SeminarTab 
                        internship={internship}
                        latestSeminar={latestSeminar}
                        endDate={endDate}
                        seminarDeadline={seminarDeadline}
                        isSeminarOverdue={isSeminarOverdue}
                        isSeminarApproaching={isSeminarApproaching}
                    />
                )}
                {isNilai && (
                    <GradesTab internship={internship} />
                )}
            </div>
        </div>
    );
}
