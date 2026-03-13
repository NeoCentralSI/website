import { useEffect } from 'react';
import { useOutletContext, useParams, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery } from '@tanstack/react-query';
import { getLecturerGuidanceTimeline } from '@/services/internship.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar, User, Clock, CheckCircle2, FileText, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function StudentGuidanceTimelinePage() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    // Load data
    const { data: studentGuidance, isLoading, error } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Kerja Praktik', href: '/kerja-praktik' },
            { label: 'Bimbingan Mahasiswa', href: '/kerja-praktik/dosen/bimbingan' },
            { label: studentGuidance?.studentName || 'Detail Timeline' }
        ]);
        setTitle(`Timeline Bimbingan: ${studentGuidance?.studentName || ''}`);
    }, [setBreadcrumbs, setTitle, studentGuidance]);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'APPROVED':
                return { label: 'Disetujui', variant: 'success' as const, icon: <CheckCircle2 className="w-4 h-4" /> };
            case 'SUBMITTED':
                return { label: 'Menunggu Evaluasi', variant: 'warning' as const, icon: <FileText className="w-4 h-4" /> };
            case 'LATE':
                return { label: 'Terlambat', variant: 'destructive' as const, icon: <AlertCircle className="w-4 h-4" /> };
            case 'OPEN':
                return { label: 'Sedang Berjalan', variant: 'active' as const, icon: <Clock className="w-4 h-4" /> };
            default:
                return { label: 'Belum Tersedia', variant: 'secondary' as const, icon: <Calendar className="w-4 h-4" /> };
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !studentGuidance) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium text-destructive">Gagal memuat timeline bimbingan</p>
                <Button onClick={() => navigate('/kerja-praktik/dosen/bimbingan')} variant="outline">
                    Kembali
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header / Info Section */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/kerja-praktik/dosen/bimbingan')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-0.5">{studentGuidance.studentName}</h1>
                        <p className="text-sm font-medium text-muted-foreground leading-none">{studentGuidance.studentNim}</p>
                    </div>
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {studentGuidance.timeline.map((week) => {
                    const statusConfig = getStatusConfig(week.status);
                    const isAvailable = week.status !== 'NOT_AVAILABLE';
                    
                    return (
                        <div 
                            key={week.weekNumber}
                            className={cn(
                                "flex flex-col justify-between rounded-xl border bg-card p-5 transition-all shadow-none",
                                isAvailable ? "hover:shadow-sm cursor-pointer border-border hover:border-primary/50" : "opacity-60 grayscale bg-muted/50"
                            )}
                            onClick={() => {
                                if (isAvailable) {
                                    const targetUrl = `/kerja-praktik/dosen/bimbingan/${internshipId}/minggu/${week.weekNumber}`;
                                    navigate(targetUrl);
                                }
                            }}
                        >
                            <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg leading-none">
                                            Minggu Ke-{week.weekNumber}
                                        </h3>
                                        {week.weekNumber === studentGuidance.currentWeek && (
                                            <Badge variant="outline" className="text-[10px] h-4 bg-primary/5 text-primary border-primary/20 px-1.5 py-0">Saat Ini</Badge>
                                        )}
                                    </div>
                                    <Badge 
                                        variant={statusConfig.variant as any} 
                                        className="capitalize flex items-center gap-1 shadow-none"
                                    >
                                        {statusConfig.icon}
                                        {statusConfig.label}
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>
                                            {format(new Date(week.startDate), 'dd MMM', { locale: idLocale })} - {format(new Date(week.endDate), 'dd MMM yyyy', { locale: idLocale })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <Button 
                                    variant={isAvailable ? (week.status === 'SUBMITTED' ? 'default' : 'outline') : 'ghost'} 
                                    disabled={!isAvailable}
                                    className={cn(
                                        "w-full",
                                        week.status === 'SUBMITTED' && "bg-primary hover:bg-primary/90",
                                        week.status === 'APPROVED' && "border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:text-green-800 hover:border-green-400"
                                    )}
                                >
                                    {week.status === 'SUBMITTED' ? 'Evaluasi Jurnal' : 
                                     week.status === 'APPROVED' ? 'Lihat Evaluasi' : 
                                     isAvailable ? 'Lihat Jurnal' : 'Terkunci'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

