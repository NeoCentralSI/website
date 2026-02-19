import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepAssignments } from '@/hooks/internship/useSekdepAssignments';
import { getSekdepAssignmentColumns } from '@/lib/internship';
import { ClipboardList } from 'lucide-react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyCompanyResponse, type SekdepAssignmentItem } from '@/services/internship.service';
import { toast } from 'sonner';
import ProposalResponseDialog from '@/components/internship/ProposalResponseDialog';
import { TabsNav } from '@/components/ui/tabs-nav';

export default function SekdepInternshipAssignmentPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    // Verification Dialog State
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<SekdepAssignmentItem | null>(null);
    const [responseType, setResponseType] = useState<'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | 'REJECTED_BY_COMPANY' | null>(null);

    const {
        displayItems,
        total,
        isLoading,
        isFetching,
        q,
        setQ,
        page,
        setPage,
        pageSize,
        setPageSize,
        refetch,
    } = useSekdepAssignments();

    const verifyMutation = useMutation({
        mutationFn: ({ id, status, notes, acceptedMemberIds }: { id: string, status: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | 'REJECTED_BY_COMPANY', notes?: string, acceptedMemberIds?: string[] }) =>
            verifyCompanyResponse(id, status, notes, acceptedMemberIds),
        onSuccess: (data) => {
            toast.success(data.message);
            setResponseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-assignments'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal memverifikasi surat balasan');
        }
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleConfirmVerification = (notes?: string, acceptedMemberIds?: string[]) => {
        if (selectedItem && responseType) {
            verifyMutation.mutate({
                id: selectedItem.responseId,
                status: responseType,
                notes,
                acceptedMemberIds
            });
        }
    };

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Penugasan' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle('Verifikasi Surat Balasan');
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const assignmentColumns = useMemo(() => getSekdepAssignmentColumns({
        onViewResponseDoc: (item) => {
            if (item.dokumenSuratBalasan) {
                openDocumentPreview(item.dokumenSuratBalasan.fileName, item.dokumenSuratBalasan.filePath);
            }
        },
        onViewDetail: (item) => {
            // Navigate to proposal detail page
            // Assuming the route is /kelola/kerja-praktik/pendaftaran/:id
            // But we need to be careful if we are in "Penugasan" context.
            // The item has `id` which is the proposal ID (based on sekdep.service.js listCompanyResponses)
            // Wait, listCompanyResponses maps proposal.id to id.
            navigate(`/kelola/kerja-praktik/pendaftaran/${item.id}`);
        },
        onVerify: (item, status) => {
            setSelectedItem(item);
            setResponseType(status);
            setResponseDialogOpen(true);
        }
    }), []);

    const assignmentPreviewTabs = [
        {
            label: 'Pendaftaran',
            to: '/kelola/kerja-praktik/pendaftaran',
            end: true
        },
        {
            label: 'Penugasan',
            to: '/kelola/kerja-praktik/penugasan'
        }
    ];

    return (
        <div className="p-4">
            <div className="flex items-center gap-2 mb-6 text-2xl font-semibold">
                <ClipboardList className="h-6 w-6 text-primary" />
                <h1>Penugasan Kerja Praktik</h1>
            </div>

            <div className="mb-6">
                <TabsNav tabs={assignmentPreviewTabs} />
            </div>

            {isLoading ? (
                <div className="flex h-[calc(100vh-320px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data penugasan..." />
                </div>
            ) : (
                <CustomTable
                    columns={assignmentColumns as any}
                    data={displayItems}
                    loading={isLoading}
                    isRefreshing={isFetching && !isLoading}
                    total={total}
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
                    emptyText={q ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Belum ada surat balasan perusahaan yang perlu diverifikasi.'}
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

            <ProposalResponseDialog
                open={responseDialogOpen}
                onOpenChange={setResponseDialogOpen}
                onConfirm={handleConfirmVerification}
                isLoading={verifyMutation.isPending}
                type={responseType}
                companyName={selectedItem?.companyName}
                members={selectedItem?.members}
            />
        </div>
    );
}
