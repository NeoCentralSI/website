import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepProposals } from '@/hooks/internship/useSekdepProposals';
import { getSekdepInternshipProposalColumns } from '@/lib/internshipTableColumns';
import { FileText } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToSekdepProposal, type SekdepInternshipProposalItem } from '@/services/internship.service';
import { toast } from 'sonner';
import ProposalResponseDialog from '@/components/internship/ProposalResponseDialog';

export default function SekdepInternshipProposalPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    // Response Dialog State
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<SekdepInternshipProposalItem | null>(null);
    const [responseType, setResponseType] = useState<'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | null>(null);

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

    const respondMutation = useMutation({
        mutationFn: ({ id, response, notes }: { id: string, response: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP', notes?: string }) =>
            respondToSekdepProposal(id, response, notes),
        onSuccess: (data) => {
            toast.success(data.message);
            setResponseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposals'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal merespon proposal');
        }
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleConfirmResponse = (notes?: string) => {
        if (selectedProposal && responseType) {
            respondMutation.mutate({
                id: selectedProposal.id,
                response: responseType,
                notes
            });
        }
    };

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Pendaftaran' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Daftar Calon KP');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const proposalColumns = useMemo(() => getSekdepInternshipProposalColumns({
        onViewProposalDoc: (item) => {
            if (item.dokumenProposal) {
                openDocumentPreview(item.dokumenProposal.fileName, item.dokumenProposal.filePath);
            }
        },
        onViewAppLetterDoc: (item) => {
            if (item.dokumenSuratPermohonan) {
                openDocumentPreview(item.dokumenSuratPermohonan.fileName, item.dokumenSuratPermohonan.filePath);
            }
        },
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/pendaftaran/${item.id}`);
        },
        onRespond: (item, response) => {
            setSelectedProposal(item);
            setResponseType(response);
            setResponseDialogOpen(true);
        }
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

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />

            <ProposalResponseDialog
                open={responseDialogOpen}
                onOpenChange={setResponseDialogOpen}
                onConfirm={handleConfirmResponse}
                isLoading={respondMutation.isPending}
                type={responseType}
                companyName={selectedProposal?.companyName}
            />
        </div>
    );
}
