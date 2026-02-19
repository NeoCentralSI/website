import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudentProposals } from '@/hooks/internship/useStudentProposals';
import { getStudentAssignmentColumns } from '@/lib/internship';
import CustomTable from '@/components/layout/CustomTable';
import { TabsNav } from '@/components/ui/tabs-nav';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Loading } from '@/components/ui/spinner';
import UploadResponseLetterDialog from '@/components/internship/UploadResponseLetterDialog';
import type { InternshipProposalItem } from '@/services/internship.service';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

export default function AssignmentPage() {
    const navigate = useNavigate();
    const { items, isLoading, isFetching, refetch } = useStudentProposals();
    const [q, setQ] = useState('');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<InternshipProposalItem | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState("");

    // Filter: Only approved by Sekdep AND signed by Kadep (meaning ready for company interaction)
    const assignmentItems = useMemo(() => {
        return items.filter(item =>
            ['APPROVED_BY_SEKDEP', 'ACCEPTED_BY_COMPANY', 'PARTIALLY_ACCEPTED', 'REJECTED_BY_COMPANY'].includes(item.status) && item.isSigned === true
        );
    }, [items]);

    const displayItems = useMemo(() => {
        if (!q) return assignmentItems;
        const lowQ = q.toLowerCase();
        return assignmentItems.filter(item =>
            item.namaCompany.toLowerCase().includes(lowQ) ||
            item.nama.toLowerCase().includes(lowQ)
        );
    }, [assignmentItems, q]);

    const columns = useMemo(() => getStudentAssignmentColumns({
        onViewDetail: (item) => navigate(`/kerja-praktik/pendaftaran/${item.id}`),
        onUploadResponse: (item) => {
            setSelectedProposal(item);
            setIsUploadOpen(true);
        },
        onViewResponseDoc: (item) => {
            if (item.dokumenSuratBalasan?.filePath) {
                setPreviewUrl(item.dokumenSuratBalasan.filePath);
                setPreviewTitle(`Surat Balasan - ${item.namaCompany}`);
            }
        },
        onViewAssignmentDoc: (item) => {
            if (item.dokumenSuratTugas?.filePath) {
                setPreviewUrl(item.dokumenSuratTugas.filePath);
                setPreviewTitle(`Surat Tugas - ${item.namaCompany}`);
            }
        }
    }), [navigate]);

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Pendaftaran Kerja Praktik</h1>
                <p className="text-muted-foreground">Balasan perusahaan dan penugasan departemen.</p>
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
                    <Loading size="lg" text="Memuat data penugasan..." />
                </div>
            ) : (
                <CustomTable
                    columns={columns as any}
                    data={displayItems}
                    loading={isLoading}
                    isRefreshing={isFetching && !isLoading}
                    total={displayItems.length}
                    page={1}
                    onPageChange={() => { }}
                    pageSize={100}
                    enableColumnFilters
                    searchValue={q}
                    onSearchChange={(v) => setQ(v)}
                    emptyText={assignmentItems.length === 0
                        ? "Belum ada penugasan yang siap. "
                        : "Tidak ada penugasan yang cocok dengan pencarian."}
                    actions={
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                    }
                />
            )}

            <UploadResponseLetterDialog
                open={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                proposal={selectedProposal}
                onSuccess={() => refetch()}
            />

            <DocumentPreviewDialog
                open={!!previewUrl}
                onOpenChange={(open: boolean) => !open && setPreviewUrl(null)}
                filePath={previewUrl}
                fileName={previewTitle}
            />
        </div>
    );
}
