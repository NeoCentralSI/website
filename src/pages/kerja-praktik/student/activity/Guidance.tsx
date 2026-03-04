import { useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';

export default function GuidancePage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik', to: '/kerja-praktik' },
        { label: 'Pelaksanaan' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const tabs = [
        { label: 'Logbook', to: '/kerja-praktik/logbook', end: true },
        { label: 'Bimbingan', to: '/kerja-praktik/bimbingan' },
    ];

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pelaksanaan Kerja Praktik</h1>
                <p className="text-muted-foreground">Pantau perkembangan bimbingan KP Anda.</p>
            </div>

            <TabsNav tabs={tabs} preserveSearch />

            <div className="flex flex-col gap-4">
                <div className="rounded-lg border border-dashed p-12 text-center">
                    <p className="text-muted-foreground">Konten Bimbingan akan segera hadir.</p>
                </div>
            </div>
        </div>
    );
}
