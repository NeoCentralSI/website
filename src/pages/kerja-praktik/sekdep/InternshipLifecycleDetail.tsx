import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    Briefcase,
    Users,
    ArrowLeft,
    GraduationCap,
    BookOpen,
    Presentation,
    CheckCircle2,
    MapPin,
    FileText,
    Download,
    MessageSquare,
    XCircle,
} from 'lucide-react';
import InternshipTable from '@/components/internship/InternshipTable';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { getSekdepInternshipDetail, verifyInternshipDocument, bulkVerifyInternshipDocuments, rejectFinalReport } from '@/services/internship';
import { TabsNav } from '@/components/ui/tabs-nav';
import { SekdepLogbookTab } from './detail/SekdepLogbookTab';
import { SekdepGuidanceTab } from './detail/SekdepGuidanceTab';
import { SekdepSeminarTab } from './detail/SekdepSeminarTab';
import { SekdepGradesTab } from './detail/SekdepGradesTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInternshipStatusBadge } from '@/lib/internship/status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import { Progress } from '@/components/ui/progress';
import DocumentVerificationDialog from '@/components/internship/sekdep/DocumentVerificationDialog';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { cn } from '@/lib/utils';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function InternshipLifecycleDetail() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    
    // State for bulk verification
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkDialogMode, setBulkDialogMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');

    const {
        data: response,
        isLoading,
        isError,
        error
    } = useQuery({
        queryKey: ['sekdepInternshipDetail', internshipId],
        queryFn: () => getSekdepInternshipDetail(internshipId!),
        enabled: !!internshipId,
    });

    const detail = response?.data;
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<any>(null);
    const [singleActionDoc, setSingleActionDoc] = useState<any>(null);
    const [singleActionMode, setSingleActionMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [singleDialogOpen, setSingleDialogOpen] = useState(false);
    const location = useLocation();
    const isDashboard = location.pathname.endsWith(internshipId!);

    const tabs = useMemo(() => [
        { label: 'Overview', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}`, end: true },
        { label: 'Logbook', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/logbook` },
        { label: 'Bimbingan', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/bimbingan` },
        { label: 'Seminar', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/seminar` },
        { label: 'Nilai Akhir', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/nilai` },
    ], [internshipId]);

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik', href: '/kelola/kerja-praktik/pendaftaran' },
        { label: 'Daftar Mahasiswa', href: '/kelola/kerja-praktik/pendaftaran/mahasiswa' },
        { label: 'Detail Pelaksanaan' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined); // Header is custom in this page
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    // Bulk verification mutation - menggunakan API bulk dari backend
    const singleVerificationMutation = useMutation({
        mutationFn: ({ status, notes }: { status: 'APPROVED' | 'REVISION_NEEDED', notes?: string }) => {
            if (singleActionDoc.docType === 'reportFinal') {
                return rejectFinalReport(internshipId!, notes || '');
            }
            return verifyInternshipDocument(internshipId!, singleActionDoc.docType, status, notes);
        },
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['sekdepInternshipDetail', internshipId] });
            setSingleDialogOpen(false);
            setSingleActionDoc(null);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Gagal memverifikasi dokumen");
        }
    });

    const handleSingleVerify = (status: 'APPROVED' | 'REVISION_NEEDED', notes?: string) => {
        singleVerificationMutation.mutate({ status, notes });
    };

    const handleAction = (mode: 'APPROVE' | 'REJECT', row: any) => {
        setSingleActionDoc(row);
        setSingleActionMode(mode);
        setSingleDialogOpen(true);
    };



    const handleDownloadZip = async () => {
        if (selectedIds.length === 0 || !detail) return;
        
        const zip = new JSZip();
        const selectedData = reportingTableData.filter(d => selectedIds.includes(d.id) && d.detail?.document);
        
        toast.info(`Menyiapkan ${selectedData.length} dokumen untuk diunduh...`);
        
        try {
            const promises = selectedData.map(async (item) => {
                if (!item.detail?.document) return;
                const response = await fetch(item.detail.document.filePath);
                const blob = await response.blob();
                const fileName = `${item.title.replace(/[/\\?%*:|"<>]/g, '-')}-${item.detail.document.fileName}`;
                zip.file(fileName, blob);
            });
            
            await Promise.all(promises);
            const content = await zip.generateAsync({ type: "blob" });
            saveAs(content, `dokumen-pelaporan-${detail.student.nim}.zip`);
            toast.success("Dokumen berhasil diunduh dalam format ZIP");
        } catch (error) {
            console.error("Zip error:", error);
            toast.error("Gagal mengunduh dokumen. Pastikan file tersedia.");
        }
    };

    const bulkVerificationMutation = useMutation({
        mutationFn: async ({ status, notes }: { status: 'APPROVED' | 'REVISION_NEEDED', notes?: string }) => {
            const docTypes = selectedIds as Array<'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument'>;
            const documents = docTypes.map(docType => ({
                documentType: docType,
                status,
                notes
            }));
            
            return await bulkVerifyInternshipDocuments(internshipId!, documents, status, notes);
        },
        onSuccess: () => {
            toast.success(`Berhasil memverifikasi ${selectedIds.length} dokumen`);
            queryClient.invalidateQueries({ queryKey: ['sekdepInternshipDetail', internshipId] });
            setSelectedIds([]);
            setBulkDialogOpen(false);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Gagal memverifikasi dokumen");
        }
    });

    const handleBulkVerify = (status: 'APPROVED' | 'REVISION_NEEDED', notes?: string) => {
        bulkVerificationMutation.mutate({ status, notes });
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
                <Spinner className="h-10 w-10 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">Memuat detail pelaksanaan KP...</p>
            </div>
        );
    }

    if (isError || !detail) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error instanceof Error ? error.message : "Gagal memuat data detail kerja praktik."}
                    </AlertDescription>
                </Alert>
                <Button variant="outline" onClick={() => navigate('/kelola/kerja-praktik/pendaftaran/mahasiswa')}>
                    Kembali ke Daftar
                </Button>
            </div>
        );
    }

    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'SUBMITTED':
                return <Badge className="bg-blue-100 text-blue-700 border-blue-200 pointer-events-none">Menunggu Verifikasi</Badge>;
            case 'APPROVED':
                return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 pointer-events-none">Disetujui</Badge>;
            case 'REVISION_NEEDED':
                return <Badge className="bg-amber-100 text-amber-700 border-amber-200 pointer-events-none">Perlu Revisi</Badge>;
            default:
                return <Badge variant="outline" className="text-slate-400 pointer-events-none">Belum Diunggah</Badge>;
        }
    };

    const reportingTableData = useMemo(() => {
        if (!detail) return [];
        const docs = [];
        
        docs.push({
            id: 'completionCertificate',
            title: 'Sertifikat Selesai KP',
            docType: 'completionCertificate',
            detail: detail.reportingDocuments.completionCertificate,
            canVerify: true,
            isSelectable: !!detail.reportingDocuments.completionCertificate?.document
        });
        
        docs.push({
            id: 'companyReceipt',
            title: 'Tanda Terima (KP-004)',
            docType: 'companyReceipt',
            detail: detail.reportingDocuments.companyReceipt,
            canVerify: true,
            isSelectable: !!detail.reportingDocuments.companyReceipt?.document
        });
        
        docs.push({
            id: 'logbookDocument',
            title: 'Laporan Kegiatan (KP-002)',
            docType: 'logbookDocument',
            detail: detail.reportingDocuments.logbookDocument,
            canVerify: true,
            isSelectable: !!detail.reportingDocuments.logbookDocument?.document
        });
        
        if (detail.reportingDocuments.report) {
            docs.push({
                id: 'report',
                title: 'Laporan Akhir',
                docType: 'report',
                detail: detail.reportingDocuments.report,
                canVerify: false,
                isSelectable: !!detail.reportingDocuments.report?.document
            });
        }
        
        if (detail.reportingDocuments.reportFinal && detail.reportingDocuments.reportFinal.document) {
            docs.push({
                id: 'reportFinal',
                title: 'Laporan Akhir Final',
                docType: 'reportFinal',
                detail: detail.reportingDocuments.reportFinal,
                canVerify: true,
                isSelectable: true
            });
        }
        
        return docs;
    }, [detail]);

    const reportingColumns = useMemo(() => [
        {
            key: 'title',
            header: 'Nama Dokumen',
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-slate-700">{row.title}</span>
                </div>
            )
        },
        {
            key: 'status',
            header: 'Status & Verifikasi',
            render: (row: any) => (
                <div className="flex items-center gap-3">
                    {getStatusBadge(row.detail?.status)}
                    {row.canVerify && row.detail?.document && (
                        <div className="flex items-center gap-1">
                            {(row.detail.status === 'SUBMITTED' || row.detail.status === 'REVISION_NEEDED') && row.docType !== 'reportFinal' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 text-[10px] font-bold"
                                    onClick={() => handleAction('APPROVE', row)}
                                >
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    TERIMA
                                </Button>
                            )}
                            {(row.detail.status === 'SUBMITTED' || row.detail.status === 'APPROVED') && row.docType !== 'logbookDocument' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-destructive hover:bg-destructive/5 text-[10px] font-bold"
                                    onClick={() => handleAction('REJECT', row)}
                                >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    TOLAK
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )
        },
        {
            key: 'fileName',
            header: 'File',
            render: (row: any) => row.detail?.document ? (
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Lihat Dokumen"
                    onClick={() => {
                        setPreviewDoc(row.detail.document);
                        setPreviewOpen(true);
                    }}
                >
                    <FileText className="h-4 w-4" />
                    <span className="text-xs">Lihat</span>
                </Button>
            ) : (
                <span className="text-xs text-slate-400 italic">Belum diunggah</span>
            )
        },
        {
            key: 'notes',
            header: 'Catatan',
            render: (row: any) => row.detail?.notes ? (
                <div className="flex items-start gap-1 max-w-[250px]">
                    <MessageSquare className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-500 italic truncate">{row.detail.notes}</span>
                </div>
            ) : '-'
        }
    ], [getStatusBadge]);

    return (
        <div className="space-y-6 mt-6 p-4 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Detail Pelaksanaan KP</h1>
                        <p className="text-sm text-muted-foreground">
                            ID Internship: {detail.id} • Registered {formatDateId(detail.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {getInternshipStatusBadge(detail.status)}
                    <Badge variant="outline" className="text-sm px-3 py-1 h-9">
                        TA {detail.academicYearName}
                    </Badge>
                </div>
            </div>

            {/* Tabs Navigation */}
            <TabsNav tabs={tabs} />

            {/* Content Area */}
            {isDashboard ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-6 space-y-6">

                    {/* Overview Card with Premium Styling */}
                    <Card className="w-full border from-primary/5 via-background to-background">
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mahasiswa</p>
                                        <p className="text-lg font-bold text-slate-900">{toTitleCaseName(detail.student.name)}</p>
                                        <p className="text-sm text-slate-500 font-medium">{detail.student.nim}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                        <span>Angkatan {detail.student.enrollmentYear || '-'}</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perusahaan & Unit</p>
                                        <p className="text-lg font-bold text-slate-900">{detail.company.name}</p>
                                        <p className="text-sm text-primary font-semibold">{detail.company.unitSection}</p>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-slate-600 leading-relaxed">
                                        <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <span>{detail.company.address}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pembimbing Terkait</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 shrink-0">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Dosen Pembimbing</p>
                                    <p className="font-semibold text-slate-900">{detail.supervisor.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 shrink-0">
                                    <Briefcase className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-tight">Pembimbing Lapangan</p>
                                    <p className="font-semibold text-slate-900">{detail.supervisor.fieldSupervisor}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Progress & Status */}
                <div className="lg:col-span-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logbook Progress */}
                    <Card 
                        className="border h-full flex flex-col cursor-pointer transition-all hover:border-blue-300 hover:shadow-md active:scale-[0.98]"
                        onClick={() => navigate(`/kelola/kerja-praktik/mahasiswa/${internshipId}/logbook`)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    Progress Logbook
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5">
                                    {detail.logbookProgress.total > 0 ? Math.round((detail.logbookProgress.filled / detail.logbookProgress.total) * 100) : 0}%
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={detail.logbookProgress.total > 0 ? (detail.logbookProgress.filled / detail.logbookProgress.total) * 100 : 0} className="h-2" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">Hari Terisi</span>
                                <span className="text-sm font-bold">{detail.logbookProgress.filled} / {detail.logbookProgress.total}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Guidance */}
                    <Card 
                        className="border h-full flex flex-col cursor-pointer transition-all hover:border-purple-300 hover:shadow-md active:scale-[0.98]"
                        onClick={() => navigate(`/kelola/kerja-praktik/mahasiswa/${internshipId}/bimbingan`)}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    Sesi bimbingan
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Progress value={detail.guidanceProgress.total > 0 ? (detail.guidanceProgress.filled / detail.guidanceProgress.total) * 100 : 0} className="h-2" />
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground font-medium">Bimbingan Selesai</span>
                                <span className="text-sm font-bold text-slate-400">{detail.guidanceProgress.filled} / {detail.guidanceProgress.total}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seminar Card */}
                    <Card 
                        className="border h-full flex flex-col justify-center cursor-pointer transition-all hover:border-emerald-300 hover:shadow-md active:scale-[0.98]"
                        onClick={() => navigate(`/kelola/kerja-praktik/mahasiswa/${internshipId}/seminar`)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Presentation className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-tight">Seminar KP</p>
                                    {detail.seminars?.[0] ? (
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-900">
                                                {detail.seminars[0].seminarDate ? formatDateId(detail.seminars[0].seminarDate) : "Jadwal Belum Fixed"}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-medium">
                                                {detail.seminars[0].time || ""}
                                                {detail.seminars[0].room?.name ? ` • R. ${detail.seminars[0].room.name}` : ""}
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-sm font-medium text-slate-500 italic">Belum Ada Jadwal</p>
                                    )}
                                </div>
                            </div>
                            {detail.seminars?.[0]?.status && (
                                <Badge variant="outline" className={cn(
                                    "text-[9px] h-5",
                                    detail.seminars[0].status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    detail.seminars[0].status === 'SCHEDULED' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                    {detail.seminars[0].status === 'COMPLETED' ? 'SELESAI' : 
                                     detail.seminars[0].status === 'SCHEDULED' ? 'TERJADWAL' : detail.seminars[0].status}
                                </Badge>
                            )}
                            <ArrowLeft className="h-4 w-4 text-slate-300 rotate-180" />
                        </CardContent>
                    </Card>

                    {/* Grades Card */}
                    <Card 
                        className="border h-full flex flex-col justify-center cursor-pointer transition-all hover:border-orange-300 hover:shadow-md active:scale-[0.98]"
                        onClick={() => navigate(`/kelola/kerja-praktik/mahasiswa/${internshipId}/nilai`)}
                    >
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-tight">Nilai Akhir</p>
                                    <p className={cn(
                                        "text-lg font-bold",
                                        detail.assessment.finalScore ? "text-slate-900" : "text-slate-400"
                                    )}>
                                        {detail.assessment.finalScore ?? "-"} / 100
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">Grade</p>
                                <p className={cn(
                                    "text-2xl font-black leading-none",
                                    detail.assessment.finalGrade ? "text-orange-600" : "text-slate-300"
                                )}>
                                    {detail.assessment.finalGrade ?? "-"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

                </div>
            ) : (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {location.pathname.includes('logbook') && <SekdepLogbookTab logbooks={detail.logbooks} isLocked={detail.assessment.isLogbookLocked} />}
                    {location.pathname.includes('bimbingan') && <SekdepGuidanceTab sessions={detail.guidanceSessions} />}
                    {location.pathname.includes('seminar') && <SekdepSeminarTab seminars={detail.seminars} />}
                    {location.pathname.includes('nilai') && (
                        <SekdepGradesTab 
                            assessment={detail.assessment} 
                            lecturerScores={detail.lecturerScores}
                            fieldScores={detail.fieldScores}
                            reportingDocuments={detail.reportingDocuments}
                        />
                    )}
                </div>
            )}

            {/* Always visible at the bottom of the dashboard or separate? User usually wants it visible globally or just dashboard.
                I'll keep it on the dashboard only to keep detail views focused. */}
            
            {isDashboard && (
                <div className="space-y-4 border-t pt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-bold text-slate-800">Dokumen Pelaporan</h2>
                        </div>
                    </div>
                    
                    <InternshipTable
                        columns={reportingColumns}
                        data={reportingTableData}
                        loading={isLoading}
                        total={reportingTableData.length}
                        page={1}
                        pageSize={10}
                        onPageChange={() => {}}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        isRowSelectable={(row: any) => row.isSelectable}
                        actions={
                            <div className="flex items-center gap-2">

                                
                                {selectedIds.length > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadZip}
                                        className="h-8 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        <Download className="h-3 w-3 mr-1" />
                                        Download ZIP ({selectedIds.length})
                                    </Button>
                                )}

                                {selectedIds.length > 0 && selectedIds.every(id => {
                                    const item = reportingTableData.find(d => d.id === id);
                                    return item && item.canVerify && item.detail?.status !== 'APPROVED';
                                }) && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setBulkDialogMode('APPROVE');
                                                setBulkDialogOpen(true);
                                            }}
                                            className="h-8 text-xs border-emerald-200 text-emerald-600 hover:bg-emerald-50 font-bold"
                                            disabled={bulkVerificationMutation.isPending}
                                        >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Setujui Terpilih
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setBulkDialogMode('REJECT');
                                                setBulkDialogOpen(true);
                                            }}
                                            className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/5 font-bold"
                                            disabled={bulkVerificationMutation.isPending}
                                        >
                                            <XCircle className="h-3 w-3 mr-1" />
                                            Tolak Terpilih
                                        </Button>
                                    </>
                                )}
                            </div>
                        }
                    />
                </div>
            )}

            {/* Single Verification Dialog */}
            {singleActionDoc && (
                <DocumentVerificationDialog
                    open={singleDialogOpen}
                    onOpenChange={setSingleDialogOpen}
                    onConfirm={(status, notes) => handleSingleVerify(status, notes)}
                    isLoading={singleVerificationMutation.isPending}
                    title={singleActionDoc.title}
                    initialNotes={singleActionDoc.detail?.notes || ''}
                    mode={singleActionMode}
                />
            )}

            {/* Preview Dialog */}
            <DocumentPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                fileName={previewDoc?.fileName}
                filePath={previewDoc?.filePath}
            />

            {/* Bulk Verification Dialog */}
            <DocumentVerificationDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
                onConfirm={handleBulkVerify}
                isLoading={bulkVerificationMutation.isPending}
                title={`${selectedIds.length} Dokumen`}
                initialNotes=""
                mode={bulkDialogMode}
            />
        </div>
    );
}


