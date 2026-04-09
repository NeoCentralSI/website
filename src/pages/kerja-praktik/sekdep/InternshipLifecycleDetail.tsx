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
    Eye,
    MessageSquare,
    CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { getSekdepInternshipDetail, verifyInternshipDocument, bulkVerifyInternshipDocuments } from '@/services/internship';
import { TabsNav } from '@/components/ui/tabs-nav';
import { SekdepLogbookTab } from './detail/SekdepLogbookTab';
import { SekdepGuidanceTab } from './detail/SekdepGuidanceTab';
import { SekdepSeminarTab } from './detail/SekdepSeminarTab';
import { SekdepGradesTab } from './detail/SekdepGradesTab';
import type { DocumentVerificationDetail } from '@/services/internship';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export default function InternshipLifecycleDetail() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    
    // State for bulk verification
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
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
    const location = useLocation();
    const isDashboard = location.pathname.endsWith(internshipId!);

    const tabs = useMemo(() => [
        { label: 'Overview', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}`, end: true },
        { label: 'Logbook', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/logbook` },
        { label: 'Bimbingan', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/bimbingan` },
        { label: 'Seminar', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/seminar` },
        { label: 'Nilai Akhir', to: `/kelola/kerja-praktik/mahasiswa/${internshipId}/nilai` },
    ], [internshipId]);

    // Get available documents for bulk selection
    // Note: Laporan Akhir tidak termasuk karena diverifikasi oleh dosen pembimbing, bukan sekdep
    const availableDocs = useMemo(() => {
        if (!detail) return [];
        const docs: Array<{ docType: 'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument', title: string, detail: DocumentVerificationDetail }> = [];
        
        if (detail.reportingDocuments.completionCertificate?.document && detail.reportingDocuments.completionCertificate.status !== 'APPROVED') {
            docs.push({ docType: 'completionCertificate', title: 'Sertifikat Selesai KP', detail: detail.reportingDocuments.completionCertificate });
        }
        if (detail.reportingDocuments.companyReceipt?.document && detail.reportingDocuments.companyReceipt.status !== 'APPROVED') {
            docs.push({ docType: 'companyReceipt', title: 'Tanda Terima (KP-004)', detail: detail.reportingDocuments.companyReceipt });
        }
        if (detail.reportingDocuments.logbookDocument?.document && detail.reportingDocuments.logbookDocument.status !== 'APPROVED') {
            docs.push({ docType: 'logbookDocument', title: 'Laporan Kegiatan (KP-002)', detail: detail.reportingDocuments.logbookDocument });
        }
        // Laporan Akhir tidak termasuk karena diverifikasi oleh dosen pembimbing
        
        return docs;
    }, [detail]);

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
    const bulkVerificationMutation = useMutation({
        mutationFn: async ({ status, notes }: { status: 'APPROVED' | 'REVISION_NEEDED', notes?: string }) => {
            const docTypes = Array.from(selectedDocs) as Array<'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument'>;
            const documents = docTypes.map(docType => ({
                documentType: docType,
                status,
                notes
            }));
            
            return await bulkVerifyInternshipDocuments(internshipId!, documents, status, notes);
        },
        onSuccess: () => {
            toast.success(`Berhasil memverifikasi ${selectedDocs.size} dokumen`);
            queryClient.invalidateQueries({ queryKey: ['sekdepInternshipDetail', internshipId] });
            setSelectedDocs(new Set());
            setBulkDialogOpen(false);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Gagal memverifikasi dokumen");
        }
    });

    const handleToggleDoc = (docType: string) => {
        const newSelected = new Set(selectedDocs);
        if (newSelected.has(docType)) {
            newSelected.delete(docType);
        } else {
            newSelected.add(docType);
        }
        setSelectedDocs(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedDocs.size === availableDocs.length) {
            setSelectedDocs(new Set());
        } else {
            setSelectedDocs(new Set(availableDocs.map(d => d.docType)));
        }
    };

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
                    {location.pathname.includes('logbook') && <SekdepLogbookTab logbooks={detail.logbooks} />}
                    {location.pathname.includes('bimbingan') && <SekdepGuidanceTab sessions={detail.guidanceSessions} />}
                    {location.pathname.includes('seminar') && <SekdepSeminarTab seminars={detail.seminars} />}
                    {location.pathname.includes('nilai') && (
                        <SekdepGradesTab 
                            assessment={detail.assessment} 
                            lecturerScores={detail.lecturerScores}
                            fieldScores={detail.fieldScores}
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
                        {availableDocs.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleSelectAll}
                                    className="h-8 text-xs"
                                >
                                    {selectedDocs.size === availableDocs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </Button>
                                {selectedDocs.size > 0 && (
                                    <>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setBulkDialogMode('APPROVE');
                                                setBulkDialogOpen(true);
                                            }}
                                            className="h-8 text-xs border-primary/20 text-primary hover:bg-primary/5"
                                            disabled={bulkVerificationMutation.isPending}
                                        >
                                            <CheckSquare className="h-3 w-3 mr-1" />
                                            Setujui ({selectedDocs.size})
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setBulkDialogMode('REJECT');
                                                setBulkDialogOpen(true);
                                            }}
                                            className="h-8 text-xs border-destructive/20 text-destructive hover:bg-destructive/5"
                                            disabled={bulkVerificationMutation.isPending}
                                        >
                                            Tolak ({selectedDocs.size})
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DocumentVerificationCard 
                            title="Sertifikat Selesai KP" 
                            docType="completionCertificate"
                            detail={detail.reportingDocuments.completionCertificate}
                            internshipId={detail.id}
                            isSelected={selectedDocs.has('completionCertificate')}
                            onToggleSelect={() => handleToggleDoc('completionCertificate')}
                            canSelect={!!(detail.reportingDocuments.completionCertificate?.document && detail.reportingDocuments.completionCertificate.status !== 'APPROVED')}
                        />
                        <DocumentVerificationCard 
                            title="Tanda Terima (KP-004)" 
                            docType="companyReceipt"
                            detail={detail.reportingDocuments.companyReceipt}
                            internshipId={detail.id}
                            isSelected={selectedDocs.has('companyReceipt')}
                            onToggleSelect={() => handleToggleDoc('companyReceipt')}
                            canSelect={!!(detail.reportingDocuments.companyReceipt?.document && detail.reportingDocuments.companyReceipt.status !== 'APPROVED')}
                        />
                        <DocumentVerificationCard 
                            title="Laporan Kegiatan (KP-002)" 
                            docType="logbookDocument"
                            detail={detail.reportingDocuments.logbookDocument}
                            internshipId={detail.id}
                            isSelected={selectedDocs.has('logbookDocument')}
                            onToggleSelect={() => handleToggleDoc('logbookDocument')}
                            canSelect={!!(detail.reportingDocuments.logbookDocument?.document && detail.reportingDocuments.logbookDocument.status !== 'APPROVED')}
                        />
                        {detail.reportingDocuments.report && (
                            <DocumentVerificationCard 
                                title="Laporan Akhir" 
                                docType="report"
                                detail={detail.reportingDocuments.report}
                                internshipId={detail.id}
                                isSelected={selectedDocs.has('report')}
                                onToggleSelect={() => handleToggleDoc('report')}
                                canSelect={false}
                                canVerify={false}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Bulk Verification Dialog */}
            <DocumentVerificationDialog
                open={bulkDialogOpen}
                onOpenChange={setBulkDialogOpen}
                onConfirm={handleBulkVerify}
                isLoading={bulkVerificationMutation.isPending}
                title={`${selectedDocs.size} Dokumen`}
                initialNotes=""
                mode={bulkDialogMode}
            />
        </div>
    );
}

interface DocumentVerificationCardProps {
    title: string;
    docType: 'report' | 'completionCertificate' | 'companyReceipt' | 'logbookDocument';
    detail: DocumentVerificationDetail;
    internshipId: string;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    canSelect?: boolean;
    canVerify?: boolean; // Jika false, tombol verifikasi tidak ditampilkan
}

function DocumentVerificationCard({ title, docType, detail, internshipId, isSelected = false, onToggleSelect, canSelect = false, canVerify = true }: DocumentVerificationCardProps) {
    const queryClient = useQueryClient();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'APPROVE' | 'REJECT'>('APPROVE');
    const [previewOpen, setPreviewOpen] = useState(false);

    const mutation = useMutation({
        mutationFn: ({ status, notes }: { status: 'APPROVED' | 'REVISION_NEEDED', notes?: string }) => 
            verifyInternshipDocument(internshipId, docType, status, notes),
        onSuccess: (data) => {
            toast.success(data.message);
            queryClient.invalidateQueries({ queryKey: ['sekdepInternshipDetail', internshipId] });
            setDialogOpen(false);
        },
        onError: (error) => {
            toast.error(error instanceof Error ? error.message : "Gagal memverifikasi dokumen");
        }
    });

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

    const handleConfirmVerification = (status: 'APPROVED' | 'REVISION_NEEDED', notes?: string) => {
        mutation.mutate({ status, notes });
    };

    const handleOpenDialog = (mode: 'APPROVE' | 'REJECT') => {
        setDialogMode(mode);
        setDialogOpen(true);
    };

    if (!detail.document) {
        return (
            <Card className="border border-dashed bg-slate-50/50">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-600">{title}</p>
                        <p className="text-xs text-slate-400">Mahasiswa belum mengunggah dokumen ini.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className={`border overflow-hidden relative ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                {canSelect && onToggleSelect && (
                    <div className="absolute top-3 right-3 z-10">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={onToggleSelect}
                            className="shrink-0"
                        />
                    </div>
                )}
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {title}
                        </CardTitle>
                        {getStatusBadge(detail.status)}
                    </div>
                </CardHeader>
                <CardContent className="px-4 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                                <Download className="h-4 w-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate">{detail.document.fileName}</p>
                                <p className="text-[10px] text-slate-500">Pelaporan Mahasiswa</p>
                            </div>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/5"
                            onClick={() => setPreviewOpen(true)}
                        >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat
                        </Button>
                    </div>

                    {detail.notes && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                Catatan Terakhir
                            </p>
                            <p className="text-xs text-slate-600 italic">"{detail.notes}"</p>
                        </div>
                    )}

                    {detail.status !== 'APPROVED' && canVerify && (
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-8 text-xs font-semibold border-destructive/20 text-destructive hover:bg-destructive/5"
                                onClick={() => handleOpenDialog('REJECT')}
                                disabled={detail.status === 'REVISION_NEEDED'}
                            >
                                Tolak
                            </Button>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 h-8 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5"
                                onClick={() => handleOpenDialog('APPROVE')}
                            >
                                Setuju
                            </Button>
                        </div>
                    )}
                    {!canVerify && detail.status !== 'APPROVED' && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                            <p className="text-[10px] text-slate-500 text-center italic">
                                Verifikasi oleh Dosen Pembimbing
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DocumentVerificationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={handleConfirmVerification}
                isLoading={mutation.isPending}
                title={title}
                initialNotes={detail.notes || ''}
                mode={dialogMode}
            />

            <DocumentPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                fileName={detail.document?.fileName ?? undefined}
                filePath={detail.document?.filePath ?? undefined}
            />
        </>
    );
}
