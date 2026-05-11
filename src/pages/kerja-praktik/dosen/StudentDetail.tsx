import { useEffect, useMemo } from 'react';
import { useOutletContext, useParams, useNavigate, Outlet } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLecturerGuidanceTimeline } from '@/services/internship';
import { Loader2 } from 'lucide-react';

export default function StudentDetailPage() {
    const { internshipId } = useParams<{ internshipId: string }>();
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    // Load basic student data
    const { data: studentGuidance, isLoading } = useQuery({
        queryKey: ['lecturer-student-guidance-timeline', internshipId],
        queryFn: () => getLecturerGuidanceTimeline(internshipId!),
        enabled: !!internshipId,
    });

    const tabs = useMemo(() => [
        { label: 'Bimbingan', to: `/kerja-praktik/dosen/bimbingan/${internshipId}/bimbingan`, end: true },
        { label: 'Laporan Akhir', to: `/kerja-praktik/dosen/bimbingan/${internshipId}/laporan-akhir` },
        { label: 'Seminar', to: `/kerja-praktik/dosen/bimbingan/${internshipId}/seminar` },
        { label: 'Nilai', to: `/kerja-praktik/dosen/bimbingan/${internshipId}/nilai` },
    ], [internshipId]);

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Kerja Praktik', href: '/kerja-praktik' },
            { label: 'Bimbingan Mahasiswa', href: '/kerja-praktik/dosen/bimbingan' },
            { label: studentGuidance?.studentName || 'Detail Mahasiswa' }
        ]);
        setTitle(undefined);
    }, [setBreadcrumbs, setTitle, studentGuidance]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/kerja-praktik/dosen/bimbingan')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight mb-0.5">{studentGuidance?.studentName || 'Mahasiswa'}</h1>
                        <p className="text-sm font-medium text-muted-foreground leading-none">{studentGuidance?.studentNim || ''}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <TabsNav tabs={tabs} />

            {/* Tab Content */}
            <Outlet />
        </div>
    );
}

