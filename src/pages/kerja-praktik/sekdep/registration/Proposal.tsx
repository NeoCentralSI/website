import { useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepProposals } from '@/hooks/internship/useSekdepProposals';
import { getSekdepInternshipProposalColumns } from '@/lib/internshipTableColumns';
import { FileText } from 'lucide-react';

export default function SekdepInternshipProposalPage() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const {
        displayItems: proposalItems,
        total: proposalTotal,
        isLoading: proposalLoading,
        isFetching: proposalFetching,
        q: proposalQ,
        setQ: setProposalQ,
        page: proposalPage,
        setPage: setProposalPage,
        pageSize: proposalPageSize,
        setPageSize: setProposalPageSize,
        refetch: refetchProposals,
    } = useSekdepProposals();

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Pendaftaran' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Daftar Calon KP');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const proposalColumns = useMemo(() => getSekdepInternshipProposalColumns({
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/pendaftaran/${item.id}`);
        },
    }), [navigate]);

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-6 text-2xl font-semibold">
                <FileText className="h-6 w-6 text-primary" />
                <h1>Pendaftaran Kerja Praktik</h1>
            </div>

            {proposalLoading ? (
                <div className="flex h-[calc(100vh-280px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data proposal..." />
                </div>
            ) : (
                <CustomTable
                    columns={proposalColumns as any}
                    data={proposalItems}
                    loading={proposalLoading}
                    isRefreshing={proposalFetching && !proposalLoading}
                    total={proposalTotal}
                    page={proposalPage}
                    pageSize={proposalPageSize}
                    onPageChange={setProposalPage}
                    onPageSizeChange={(s) => {
                        setProposalPageSize(s);
                        setProposalPage(1);
                    }}
                    enableColumnFilters
                    searchValue={proposalQ}
                    onSearchChange={(v) => {
                        setProposalQ(v);
                        setProposalPage(1);
                    }}
                    emptyText={proposalQ ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Belum ada pengajuan proposal internship yang siap ditinjau.'}
                    actions={
                        <RefreshButton
                            onClick={() => refetchProposals()}
                            isRefreshing={proposalFetching && !proposalLoading}
                        />
                    }
                />
            )}
        </div>
    );
}
