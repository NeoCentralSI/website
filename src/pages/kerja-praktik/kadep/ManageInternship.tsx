import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Signature } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { useQuery } from '@tanstack/react-query';
import { getKadepPendingLetters } from '@/services/internship.service';
import { getKadepInternshipLetterColumns } from '@/lib/internshipTableColumns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function KadepInternshipManagementPage() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['kadep-pending-letters'],
        queryFn: async () => {
            const res = await getKadepPendingLetters();
            return res.data;
        }
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

    const sortedApplicationLetters = useMemo(() =>
        [...(data?.applicationLetters || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [data?.applicationLetters]);

    const sortedAssignmentLetters = useMemo(() =>
        [...(data?.assignmentLetters || [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [data?.assignmentLetters]);

    return (
        <div className="p-4 space-y-6">
            <div className="flex items-center gap-2 mb-2 text-2xl font-semibold">
                <Signature className="h-6 w-6 text-primary" />
                <h1>Persetujuan Surat Kerja Praktik</h1>
            </div>

            <Tabs defaultValue="application" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="application" className="px-6">Surat Permohonan ({data?.applicationLetters.length || 0})</TabsTrigger>
                    <TabsTrigger value="assignment" className="px-6">Surat Tugas ({data?.assignmentLetters.length || 0})</TabsTrigger>
                </TabsList>

                <TabsContent value="application">
                    {isLoading ? (
                        <div className="flex h-60 items-center justify-center">
                            <Loading size="lg" text="Memuat data surat..." />
                        </div>
                    ) : (
                        <CustomTable
                            columns={columns as any}
                            data={sortedApplicationLetters}
                            loading={isLoading}
                            isRefreshing={isFetching && !isLoading}
                            total={sortedApplicationLetters.length}
                            page={1}
                            onPageChange={() => { }}
                            pageSize={10}
                            enableColumnFilters
                            emptyText="Tidak ada data surat permohonan."
                            actions={<RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />}
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
                            data={sortedAssignmentLetters}
                            loading={isLoading}
                            isRefreshing={isFetching && !isLoading}
                            total={sortedAssignmentLetters.length}
                            page={1}
                            onPageChange={() => { }}
                            pageSize={10}
                            enableColumnFilters
                            emptyText="Tidak ada data surat tugas."
                            actions={<RefreshButton onClick={() => refetch()} isRefreshing={isFetching && !isLoading} />}
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
