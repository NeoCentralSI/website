import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate, useSearchParams } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Signature } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { useQuery } from '@tanstack/react-query';
import { getKadepPendingLetters } from '@/services/internship';
import { getKadepInternshipLetterColumns } from '@/lib/internship';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';

export default function KadepInternshipManagementPage() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'application';
    const academicYearId = searchParams.get('academicYearId') || '';
    const searchQuery = searchParams.get('q') || '';

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    const updateParams = (updates: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key === 'academicYearId')) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        });
        setSearchParams(newParams);
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

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Kelola' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Kelola Kerja Praktik');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

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

    const filteredApplicationLetters = useMemo(() => {
        const letters = data?.applicationLetters || [];
        const filtered = letters.filter(l =>
            l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorNim.includes(searchQuery) ||
            l.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data?.applicationLetters, searchQuery]);

    const filteredAssignmentLetters = useMemo(() => {
        const letters = data?.assignmentLetters || [];
        const filtered = letters.filter(l =>
            l.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorNim.includes(searchQuery) ||
            l.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data?.assignmentLetters, searchQuery]);

    const summary = useMemo(() => {
        const pendingApp = filteredApplicationLetters.filter(l => !l.signedById).length;
        const pendingAssign = filteredAssignmentLetters.filter(l => !l.signedById).length;
        return { pendingApp, pendingAssign, total: pendingApp + pendingAssign };
    }, [filteredApplicationLetters, filteredAssignmentLetters]);

    return (
        <div className="p-4 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 text-2xl font-semibold">
                    <Signature className="h-6 w-6 text-primary" />
                    <h1>Persetujuan Surat Kerja Praktik</h1>
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

            <Tabs value={activeTab} onValueChange={(v) => updateParams({ tab: v })} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="application" className="px-6 relative">
                        Permohonan ({filteredApplicationLetters.length})
                        {summary.pendingApp > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-background">
                                {summary.pendingApp}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="assignment" className="px-6 relative">
                        Penugasan ({filteredAssignmentLetters.length})
                        {summary.pendingAssign > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-background">
                                {summary.pendingAssign}
                            </span>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="application">
                    {isLoading ? (
                        <div className="flex h-60 items-center justify-center">
                            <Loading size="lg" text="Memuat data surat..." />
                        </div>
                    ) : (
                        <CustomTable
                            columns={columns as any}
                            data={filteredApplicationLetters}
                            loading={isLoading}
                            isRefreshing={isFetching && !isLoading}
                            total={filteredApplicationLetters.length}
                            page={1}
                            onPageChange={() => { }}
                            pageSize={10}
                            enableColumnFilters
                            searchValue={searchQuery}
                            onSearchChange={(v) => updateParams({ q: v })}
                            emptyText={searchQuery ? "Pencarian tidak menemukan hasil." : "Tidak ada data surat permohonan."}
                            actions={
                                <div className="flex items-center gap-2">
                                    <Select value={academicYearId} onValueChange={(v) => updateParams({ academicYearId: v })}>
                                        <SelectTrigger className="w-[200px] h-9">
                                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                            {academicYears.map((ay) => (
                                                <SelectItem key={ay.id} value={ay.id}>
                                                    <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                                        {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                                        {ay.isActive && ' (Aktif)'}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
                                </div>
                            }
                        />
                    )}
                </TabsContent>

                <TabsContent value="assignment">
                    {isLoading ? (
                        <div className="flex h-60 items-center justify-center">
                            <Loading size="lg" text="Memuat data surat..." />
                        </div>
                    ) : (
                        <CustomTable
                            columns={columns as any}
                            data={filteredAssignmentLetters}
                            loading={isLoading}
                            isRefreshing={isFetching && !isLoading}
                            total={filteredAssignmentLetters.length}
                            page={1}
                            onPageChange={() => { }}
                            pageSize={10}
                            enableColumnFilters
                            searchValue={searchQuery}
                            onSearchChange={(v) => updateParams({ q: v })}
                            emptyText={searchQuery ? "Pencarian tidak menemukan hasil." : "Tidak ada data surat tugas."}
                            actions={
                                <div className="flex items-center gap-2">
                                    <Select value={academicYearId} onValueChange={(v) => updateParams({ academicYearId: v })}>
                                        <SelectTrigger className="w-[200px] h-9">
                                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                            {academicYears.map((ay) => (
                                                <SelectItem key={ay.id} value={ay.id}>
                                                    <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                                        {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                                        {ay.isActive && ' (Aktif)'}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />
                                </div>
                            }
                        />
                    )}
                </TabsContent>
            </Tabs>

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
