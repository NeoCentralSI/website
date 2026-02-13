import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import CustomTable from '@/components/layout/CustomTable';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { getAdminApprovedProposals, type AdminApprovedProposalItem } from '@/services/internship.service';
import { getAdminApprovedProposalColumns } from '@/lib/internshipTableColumns';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

export default function AdminApplicationPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    // Search and Pagination State
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['admin-approved-proposals'],
        queryFn: async () => {
            const res = await getAdminApprovedProposals();
            return res.data;
        }
    });

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Surat Pengantar' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle(undefined);
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleManageLetter = (item: AdminApprovedProposalItem) => {
        navigate(`/admin/kerja-praktik/surat-pengantar/${item.id}`);
    };

    const columns = useMemo(() => getAdminApprovedProposalColumns({
        onViewLetterDoc: (item: AdminApprovedProposalItem) => {
            if (item.letterFile) {
                openDocumentPreview(item.letterFile.fileName, item.letterFile.filePath);
            }
        },
        onAction: (item: AdminApprovedProposalItem) => handleManageLetter(item)
    }), []);

    const filteredData = useMemo(() => {
        if (!data) return [];
        if (!q) return data;
        const search = q.toLowerCase();
        return data.filter(item =>
            item.coordinatorName.toLowerCase().includes(search) ||
            item.coordinatorNim.toLowerCase().includes(search) ||
            item.companyName.toLowerCase().includes(search) ||
            item.letterNumber.toLowerCase().includes(search)
        );
    }, [data, q]);

    const displayItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    return (
        <div className="p-4">
            {isLoading ? (
                <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data pengajuan..." />
                </div>
            ) : (
                <CustomTable
                    columns={columns as any}
                    data={displayItems}
                    loading={isLoading}
                    isRefreshing={isFetching && !isLoading}
                    total={filteredData.length}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(s) => {
                        setPageSize(s);
                        setPage(1);
                    }}
                    enableColumnFilters
                    searchValue={q}
                    onSearchChange={(v) => {
                        setQ(v);
                        setPage(1);
                    }}
                    emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Belum ada pengajuan yang disetujui Sekdep.'}
                    actions={
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                    }
                />
            )}

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
