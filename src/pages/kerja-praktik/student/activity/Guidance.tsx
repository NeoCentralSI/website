import { useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStudentGuidance } from '@/services/internship';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Loader2, AlertCircle, CheckCircle2, Clock, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function GuidancePage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik', to: '/kerja-praktik' },
        { label: 'Pelaksanaan', to: '/kerja-praktik/kegiatan' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const { data: guidanceData, isLoading, error } = useQuery({
        queryKey: ['studentGuidance'],
        queryFn: getStudentGuidance,
    });

    const tabs = [
        { label: 'Logbook', to: '/kerja-praktik/kegiatan/logbook', end: true },
        { label: 'Bimbingan', to: '/kerja-praktik/kegiatan/bimbingan' },
    ];

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OPEN':
                return { label: 'Terbuka', variant: 'outline', icon: Calendar, color: 'text-blue-600 border-blue-200 bg-blue-50' };
            case 'LATE':
                return { label: 'Terbuka (Telat)', variant: 'outline', icon: AlertCircle, color: 'text-orange-600 border-orange-200 bg-orange-50' };
            case 'SUBMITTED':
                return { label: 'Menunggu Persetujuan', variant: 'secondary', icon: Clock, color: 'text-slate-600 border-slate-200 bg-slate-100' };
            case 'APPROVED':
                return { label: 'Disetujui', variant: 'default', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-600' };
            default:
                return { label: 'Belum Tersedia', variant: 'secondary', icon: Clock, color: 'text-muted-foreground opacity-50' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 h-[400px]">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-lg font-medium">Gagal memuat data bimbingan</p>
                <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['studentGuidance'] })}>Coba Lagi</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Kegiatan Kerja Praktik</h2>
                <p className="text-muted-foreground">Kelola logbook dan bimbingan mingguan Anda.</p>
            </div>

            <TabsNav tabs={tabs} preserveSearch />

            {guidanceData?.supervisorName && (
                <div className="flex w-fit items-center gap-3 rounded-xl border bg-card p-4">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <User className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Dosen Pembimbing</p>
                        <p className="text-sm font-bold text-foreground">{guidanceData.supervisorName}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 mt-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {guidanceData?.timeline.map((week) => {
                    const config = getStatusConfig(week.status);

                    return (
                        <div key={week.weekNumber} className="flex flex-col justify-between rounded-xl border bg-card p-5 transition-all hover:shadow-sm">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-lg">Minggu Ke-{week.weekNumber}</h3>
                                    <Badge
                                        variant={config.variant as any}
                                        className={cn("gap-1.5 px-2.5 py-1 whitespace-nowrap font-medium shadow-none cursor-default", config.color)}
                                    >
                                        <config.icon className="h-3.5 w-3.5" />
                                        {config.label}
                                    </Badge>
                                </div>
                                
                                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <span>Batas waktu pengisian</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>
                                            {format(new Date(week.startDate), 'd MMM', { locale: idLocale })} - {format(new Date(week.endDate), 'd MMM yyyy', { locale: idLocale })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t">
                                <Button
                                    variant={week.status === 'APPROVED' ? 'outline' : 'default'}
                                    className={cn(
                                        "w-full",
                                        week.status === 'LATE' && "bg-orange-600 hover:bg-orange-700",
                                        week.status === 'APPROVED' && "border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:text-green-800 hover:border-green-400"
                                    )}
                                    disabled={week.status === 'NOT_AVAILABLE'}
                                    onClick={() => navigate(`/kerja-praktik/kegiatan/bimbingan/${week.weekNumber}`)}
                                >
                                    Detail Bimbingan
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
