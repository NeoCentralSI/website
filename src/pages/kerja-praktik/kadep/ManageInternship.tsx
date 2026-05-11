import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import { FileText } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { useQuery } from '@tanstack/react-query';
import { getKadepPendingLetters } from '@/services/internship';
import { getKadepInternshipLetterColumns } from '@/lib/internship';
import { TabsNav, type TabItem } from '@/components/ui/tabs-nav';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';

import { MonitoringPanel } from '@/components/internship/MonitoringPanel';
import { ApplicationLettersTab } from '@/components/internship/kadep/ApplicationLettersTab';
import { AssignmentLettersTab } from '@/components/internship/kadep/AssignmentLettersTab';
import { SupervisorLettersTab } from '@/components/internship/kadep/SupervisorLettersTab';

const TAB_ITEMS: TabItem[] = [
    { label: "Monitoring", to: "/kelola/kerja-praktik/kadep/monitoring" },
    { label: "Permohonan", to: "/kelola/kerja-praktik/kadep/persetujuan/permohonan" },
    { label: "Penugasan", to: "/kelola/kerja-praktik/kadep/persetujuan/penugasan" },
    { label: "Penugasan Dosen", to: "/kelola/kerja-praktik/kadep/persetujuan/dosen" },
];

export default function KadepInternshipManagementPage() {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const searchParams = new URLSearchParams(search);
    const academicYearId = searchParams.get('academicYearId') || '';
    const searchQuery = searchParams.get('q') || '';

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    const activeTab = useMemo(() => 
        TAB_ITEMS.find((tab) => pathname.startsWith(tab.to)) || TAB_ITEMS[0]
    , [pathname]);

    const updateParams = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        navigate({ pathname, search: newParams.toString() }, { replace: true });
    };

    useEffect(() => {
        if (!academicYearId && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) updateParams({ academicYearId: active.id });
        }
    }, [academicYears, academicYearId]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['kadep-pending-letters', academicYearId],
        queryFn: async () => {
            const res = await getKadepPendingLetters(academicYearId);
            return res.data;
        },
        enabled: academicYearId !== ''
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const breadcrumb = useMemo(() => [
        { label: 'Kerja Praktik' }, 
        { label: 'Kelola' },
        { label: activeTab.to.includes('monitoring') ? 'Monitoring' : 'Persetujuan Surat' }
    ], [activeTab]);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(activeTab.to.includes('monitoring') ? 'Monitoring Kerja Praktik' : 'Persetujuan Surat Kerja Praktik');
    }, [breadcrumb, setBreadcrumbs, setTitle, activeTab]);

    const columns = useMemo(() => getKadepInternshipLetterColumns({
        onViewDoc: (item) => {
            if (item.document) {
                openDocumentPreview(item.document.fileName, item.document.filePath);
            }
        },
        onApprove: (item) => {
            navigate(`/kelola/kerja-praktik/kadep/sign/${item.type}/${item.id}`);
        }
    }), [navigate]);

    const summary = useMemo(() => {
        const pendingApp = (data?.applicationLetters || []).filter(l => !l.signedById).length;
        const pendingAssign = (data?.assignmentLetters || []).filter(l => !l.signedById).length;
        const pendingSup = (data?.supervisorLetters || []).filter(l => !l.signedById).length;
        return { 
            pendingApp, 
            pendingAssign, 
            pendingSup, 
            total: pendingApp + pendingAssign + pendingSup,
            totalApp: (data?.applicationLetters || []).length,
            totalAssign: (data?.assignmentLetters || []).length,
            totalSup: (data?.supervisorLetters || []).length
        };
    }, [data]);

    const renderContent = () => {
        if (activeTab.to.includes('monitoring')) {
            return <MonitoringPanel />;
        }

        if (isLoading) {
            return (
                <div className="flex h-60 items-center justify-center">
                    <Loading size="lg" text="Memuat data surat..." />
                </div>
            );
        }

        const sharedProps = {
            isLoading,
            isFetching,
            columns,
            searchQuery,
            onSearchChange: (v: string) => updateParams({ q: v }),
            academicYearId,
            onAcademicYearChange: (v: string) => updateParams({ academicYearId: v }),
            academicYears,
            onRefetch: refetch
        };

        if (activeTab.label.startsWith("Permohonan")) {
            return <ApplicationLettersTab data={data?.applicationLetters || []} {...sharedProps} />;
        } else if (activeTab.label.startsWith("Penugasan Dosen")) {
            return <SupervisorLettersTab data={data?.supervisorLetters || []} {...sharedProps} />;
        } else if (activeTab.label.startsWith("Penugasan")) {
            return <AssignmentLettersTab data={data?.assignmentLetters || []} {...sharedProps} />;
        }

        return null;
    };

    return (
        <div className="p-4 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-2xl font-semibold">
                        <FileText className="h-6 w-6 text-primary" />
                        <h1>Kelola Kerja Praktik</h1>
                    </div>

                    {!isLoading && (
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 animate-in fade-in slide-in-from-right-2 duration-300">
                                <span className="relative flex h-2 w-2">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${summary.total > 0 ? 'bg-amber-400' : 'bg-transparent'}`}></span>
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${summary.total > 0 ? 'bg-amber-500' : 'bg-amber-200'}`}></span>
                                </span>
                                <span className="text-xs font-semibold uppercase tracking-wider">Perlu TTD:</span>
                                <span className="text-sm font-bold tabular-nums">{summary.total}</span>
                            </div>
                        </div>
                    )}
                </div>

            <TabsNav tabs={TAB_ITEMS} preserveSearch />

            <div className="mt-6">
                {renderContent()}
            </div>

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
