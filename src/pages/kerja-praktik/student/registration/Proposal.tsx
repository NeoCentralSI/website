import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { TabsNav } from '@/components/ui/tabs-nav';
import { Loading } from '@/components/ui/spinner';
import CustomTable from '@/components/layout/CustomTable';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useStudentProposals } from '@/hooks/internship/useStudentProposals';
import { getInternshipProposalColumns } from '@/lib/internship';
import RegisterInternshipDialog from '@/components/internship/RegisterInternshipDialog';
import { respondToInvitation, type InternshipProposalItem } from '@/services/internship.service';
import { getSopDownloadUrl } from '@/services/sop.service';

import { toast } from 'sonner';

export default function InternshipProposalPage() {
    const navigate = useNavigate();
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();

    const [registerOpen, setRegisterOpen] = useState(false);

    const {
        items,
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
    } = useStudentProposals();

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const breadcrumb = useMemo(() => [{ label: 'Kerja Praktik' }, { label: 'Pendaftaran' }], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumb);
        setTitle(undefined);
    }, [breadcrumb, setBreadcrumbs, setTitle]);

    const activeProposal = useMemo(() => {
        return items.find(item => {
            // If the proposal is cancelled or fully rejected, it's not active
            if (['REJECTED_BY_SEKDEP', 'REJECTED_BY_COMPANY', 'CANCELLED'].includes(item.status)) {
                return false;
            }

            // If the member is rejected (either by declining invite or by company in partial acceptance), it's not active for them
            if (['REJECTED', 'REJECTED_BY_COMPANY'].includes(item.memberStatus as string)) {
                return false;
            }

            // Otherwise, it's an active proposal
            return true;
        });
    }, [items]);

    const handleRegisterClick = () => {
        if (activeProposal) {
            toast.error("Anda masih memiliki proposal aktif. Selesaikan atau batalkan proposal tersebut sebelum mendaftar kembali.");
            return;
        }
        setRegisterOpen(true);
    };

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleRespondInvitation = async (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => {
        try {
            const action = response === 'ACCEPTED' ? 'menyetujui' : 'menolak';
            await respondToInvitation(item.id, response);
            toast.success(`Berhasil ${action} undangan.`);
            refetch();
        } catch (error: any) {
            toast.error(error.message || "Gagal merespon undangan");
        }
    };

    const columns = useMemo(() => getInternshipProposalColumns({
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
            navigate(`/kerja-praktik/pendaftaran/${item.id}`);
        },
        onRespond: handleRespondInvitation,
    }), [navigate, refetch]);

    const { data: publicSops = [] } = useQuery({
        queryKey: ['public-sop-files'],
        queryFn: () => import('@/services/sop.service').then(m => m.getSopFilesPublic()),
    });

    const proposalTemplate = useMemo(() => {
        return publicSops.find((s: any) => s.type === 'TEMPLATE_KP');
    }, [publicSops]);

    const handleDownloadTemplate = () => {
        if (!proposalTemplate) {
            toast.error("Template proposal belum tersedia.");
            return;
        }
        window.open(getSopDownloadUrl(proposalTemplate.url), '_blank');
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pendaftaran Kerja Praktik</h1>
                <p className="text-muted-foreground">Ajukan proposal dan surat permohonan.</p>
            </div>
            <TabsNav
                preserveSearch
                tabs={[
                    { label: 'Proposal', to: '/kerja-praktik/pendaftaran', end: true },
                    { label: 'Penugasan', to: '/kerja-praktik/penugasan' },
                ]}
            />

            {isLoading ? (
                <div className="flex h-[calc(100vh-280px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data proposal..." />
                </div>
            ) : (
                <CustomTable
                    columns={columns as any}
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
                    emptyText={q ? 'Pencarian tidak menemukan hasil. Coba kata kunci lain.' : 'Anda belum memiliki riwayat pengajuan proposal internship.'}
                    actions={
                        <div className="flex items-center gap-2">
                            <RefreshButton
                                onClick={() => refetch()}
                                isRefreshing={isFetching && !isLoading}
                            />
                            {proposalTemplate && (
                                <Button
                                    variant="outline"
                                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                    onClick={handleDownloadTemplate}
                                >
                                    <FileText className="h-4 w-4" />
                                    Download Template Proposal
                                </Button>
                            )}
                            <Button onClick={handleRegisterClick}>
                                Daftar KP
                            </Button>
                        </div>
                    }
                />
            )}

            <RegisterInternshipDialog
                open={registerOpen}
                onOpenChange={setRegisterOpen}
                onSubmitted={() => refetch()}
            />

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />
        </div>
    );
}
