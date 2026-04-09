import { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    ArrowLeft, 
    Users, 
    Link as LinkIcon, 
    Building,
    CheckCircle2,
    UserPlus,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/spinner';
import { SeminarAudienceTable } from '@/components/seminar/SeminarAudienceTable';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { 
    getSeminarDetail, 
    registerSeminarAudience, 
    unregisterSeminarAudience,
    validateSeminarAudience,
    unvalidateSeminarAudience
} from '@/services/internship';
import { useAuth } from '@/hooks/shared';
import { LECTURER_ROLES } from '@/lib/roles';

export default function SeminarDetail() {
    const { seminarId } = useParams<{ seminarId: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const { user } = useAuth();

    const { data: detailResponse, isLoading, isError } = useQuery({
        queryKey: ['internship-seminar-detail', seminarId],
        queryFn: () => getSeminarDetail(seminarId!),
        enabled: !!seminarId,
    });

    const seminar = detailResponse?.data;

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Kerja Praktik', href: '/kerja-praktik' },
            { label: 'Seminar', href: '/kerja-praktik/seminar/jadwal' },
            { label: 'Detail Seminar' }
        ]);
        setTitle(undefined);
    }, [setBreadcrumbs, setTitle]);

    const audienceRows = useMemo(() => {
        if (!seminar?.audiences) return [];
        return seminar.audiences.map((a: any) => ({
            studentId: a.studentId,
            studentName: a.student?.user?.fullName || 'Unknown',
            nim: a.student?.user?.identityNumber || '-',
            registeredAt: a.createdAt,
            approvedAt: a.validatedAt,
            approvedByName: seminar.internship?.supervisor?.user?.fullName // In this system, only supervisor validates
        }));
    }, [seminar]);

    const handleRegister = async () => {
        try {
            await registerSeminarAudience(seminarId!);
            toast.success('Berhasil mendaftar sebagai penonton.');
            queryClient.invalidateQueries({ queryKey: ['internship-seminar-detail', seminarId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal mendaftar.');
        }
    };

    const handleUnregister = async () => {
        try {
            await unregisterSeminarAudience(seminarId!);
            toast.success('Pendaftaran berhasil dibatalkan.');
            queryClient.invalidateQueries({ queryKey: ['internship-seminar-detail', seminarId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal membatalkan pendaftaran.');
        }
    };

    const handleValidate = async (targetStudentId: string) => {
        try {
            await validateSeminarAudience(seminarId!, targetStudentId);
            toast.success('Kehadiran berhasil divalidasi.');
            queryClient.invalidateQueries({ queryKey: ['internship-seminar-detail', seminarId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal memvalidasi.');
        }
    };

    const handleUnvalidate = async (targetStudentId: string) => {
        try {
            await unvalidateSeminarAudience(seminarId!, targetStudentId);
            toast.success('Validasi kehadiran berhasil dibatalkan.');
            queryClient.invalidateQueries({ queryKey: ['internship-seminar-detail', seminarId] });
        } catch (error: any) {
            toast.error(error.message || 'Gagal membatalkan validasi.');
        }
    };

    const canRegister = useMemo(() => {
        if (!seminar) return false;
        if (seminar.status === 'COMPLETED') return true; // Already finished, can't register? Or actually if it's completed, registration might be closed. 
        // User said: "hanya bisa diambil untuk di hari itu saja mulai dari start timenya"
        
        try {
            const now = new Date();
            
            // Extract local components for date comparison
            const d = new Date(seminar.seminarDate);
            const seminarYear = d.getFullYear();
            const seminarMonth = d.getMonth();
            const seminarDay = d.getDate();
            
            const isSameDay = 
                now.getFullYear() === seminarYear && 
                now.getMonth() === seminarMonth && 
                now.getDate() === seminarDay;

            // Extract time components
            const timeObj = new Date(seminar.startTime);
            const hours = timeObj.getUTCHours();
            const minutes = timeObj.getUTCMinutes();
            
            const seminarStartLocal = new Date(seminarYear, seminarMonth, seminarDay, hours, minutes, 0, 0);
            
            const isAfterStart = now >= seminarStartLocal;
            
            return isSameDay && isAfterStart;
        } catch (error) {
            console.error('Error calculating canRegister:', error);
            return false;
        }
    }, [seminar]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loading size="lg" text="Memuat detail seminar..." />
            </div>
        );
    }

    if (isError || !seminar) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <p className="text-muted-foreground">Seminar tidak ditemukan.</p>
                <Button onClick={() => navigate(-1)}>Kembali</Button>
            </div>
        );
    }
    
    // @ts-ignore - roles can be compared with strings
    const isLecturer = user?.roles?.some(r => LECTURER_ROLES.includes(r as any));
    const isSupervisor = seminar.internship?.supervisor?.user?.id === user?.id;
    const canValidate = isLecturer && isSupervisor;

    const formatTime = (timeStr: string) => {
        if (!timeStr) return '';
        const d = new Date(timeStr);
        const h = d.getUTCHours().toString().padStart(2, '0');
        const m = d.getUTCMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'APPROVED': return <Badge variant="default" className="bg-green-600">Disetujui</Badge>;
            case 'COMPLETED': return <Badge variant="default" className="bg-emerald-500">Selesai</Badge>;
            case 'REQUESTED': return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">Menunggu ACC</Badge>;
            case 'REJECTED': return <Badge variant="destructive">Ditolak</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight">Detail Seminar Kerja Praktik</h1>
                    <p className="text-muted-foreground text-sm">Informasi lengkap dan daftar hadir peserta seminar</p>
                </div>
                <div className="ml-auto">
                    {getStatusBadge(seminar.status)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Informasi Seminar</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Presenter</span>
                                    <span className="text-sm font-semibold">{seminar.internship?.student?.user?.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{seminar.internship?.student?.user?.identityNumber}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Building className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Instansi KP</span>
                                    <span className="text-sm font-semibold">{seminar.internship?.proposal?.targetCompany?.companyName || '-'}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Waktu Pelaksanaan</span>
                                    <span className="text-sm font-semibold">{formatDate(seminar.seminarDate)}</span>
                                    <span className="text-xs text-muted-foreground">
                                        <Clock className="inline h-3 w-3 mr-1" />
                                        {formatTime(seminar.startTime)} - {formatTime(seminar.endTime)} WIB
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Lokasi / Ruangan</span>
                                    <span className="text-sm font-semibold">{seminar.room?.name}</span>
                                    <span className="text-xs text-muted-foreground">{seminar.room?.location || 'No location info'}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Dosen Pembimbing</span>
                                    <span className="text-sm font-semibold">{seminar.internship?.supervisor?.user?.fullName || '-'}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="flex flex-col">
                                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Moderator (Mahasiswa)</span>
                                    <span className="text-sm font-semibold">{seminar.moderatorStudent?.user?.fullName}</span>
                                    <span className="text-xs text-muted-foreground">{seminar.moderatorStudent?.user?.identityNumber}</span>
                                </div>
                            </div>

                            {seminar.linkMeeting && (
                                <div className="flex items-start gap-3">
                                    <LinkIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Link Meeting</span>
                                        <a href={seminar.linkMeeting} target="_blank" rel="noreferrer" className="text-sm font-semibold text-primary hover:underline break-all">
                                            {seminar.linkMeeting}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                <div className="lg:col-span-9">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Daftar Hadir Penonton
                                </CardTitle> 
                            </div>

                            {!seminar.isOwnSeminar && seminar.status === 'APPROVED' && (
                                <div className="flex items-center gap-3">
                                    {seminar.isRegistered ? (
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className={`gap-1.5 px-3 py-1 ${seminar.myRegistrationStatus === 'VALIDATED' ? 'border-green-600 text-green-700 bg-green-50' : 'border-primary/30 text-primary bg-primary/5'}`}>
                                                {seminar.myRegistrationStatus === 'VALIDATED' ? (
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                ) : (
                                                    <UserPlus className="h-3.5 w-3.5" />
                                                )}
                                                {seminar.myRegistrationStatus === 'VALIDATED' ? 'Kehadiran Valid' : 'Terdaftar'}
                                            </Badge>
                                            
                                            {seminar.myRegistrationStatus !== 'VALIDATED' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/5" 
                                                    onClick={handleUnregister}
                                                >
                                                    Batalkan
                                                </Button>
                                            )}
                                        </div>
                                    ) : canRegister ? (
                                        <Button size="sm" className="gap-2 px-4 shadow-sm" onClick={handleRegister}>
                                            <UserPlus className="h-4 w-4" />
                                            Ambil Absen
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-dashed border-slate-200">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span className="text-xs font-medium italic">Belum Dimulai</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardHeader>
                        <CardContent>
                            <SeminarAudienceTable 
                                rows={audienceRows}
                                showAction={canValidate}
                                onApprove={(row) => handleValidate(row.studentId!)}
                                onUnapprove={(row) => handleUnvalidate(row.studentId!)}
                            />
                        </CardContent>
                    </Card>
                </div>

                {seminar.supervisorNotes && (
                    <div className="lg:col-span-12">
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Catatan Dosen / Berita Acara Seminar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {seminar.supervisorNotes}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
