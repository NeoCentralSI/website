import { useEffect, useMemo } from 'react';
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
} from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { getSekdepInternshipDetail } from '@/services/internship.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInternshipStatusBadge } from '@/lib/internship/status';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { toTitleCaseName, formatDateId } from '@/lib/text';
import { Progress } from '@/components/ui/progress';

export default function InternshipLifecycleDetail() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

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

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik', href: '/kelola/kerja-praktik/pendaftaran' },
        { label: 'Daftar Mahasiswa', href: '/kelola/kerja-praktik/pendaftaran/mahasiswa' },
        { label: 'Detail Pelaksanaan' },
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined); // Header is custom in this page
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-2 space-y-6">

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
                        </CardContent>
                    </Card>

                    {/* Supervisors Card */}
                    <Card className="border">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
                                <Users className="h-5 w-5 text-purple-600" />
                                Pembimbing Terkait
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <div className="space-y-6">
                    {/* Logbook Progress */}
                    <Card className="border">
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

                    {/* Guidance (Placeholder) */}
                    <Card className="border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-semibold flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    Sesi Bimbingan
                                </span>
                                <Badge variant="outline" className="text-[10px] h-5 bg-purple-50">Draft</Badge>
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

                    <Card className="border">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                    <Presentation className="h-4 w-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-tight">Seminar KP</p>
                                    <p className="text-sm font-medium text-slate-500">Belum Ada Jadwal</p>
                                </div>
                            </div>
                            <ArrowLeft className="h-4 w-4 text-slate-300 rotate-180" />
                        </CardContent>
                    </Card>

                    <Card className="border">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-orange-700 uppercase tracking-tight">Nilai Akhir</p>
                                    <p className="text-lg font-bold text-slate-400">- / 100</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Grade</p>
                                <p className="text-xl font-black text-slate-300">-</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
