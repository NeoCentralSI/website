import { useEffect, useMemo, useState } from 'react';
import InternshipTable from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepPendingProposals } from '@/hooks/internship/useSekdepPendingProposals';
import { getSekdepProposalColumns } from '@/lib/internship';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { respondToSekdepProposal, type SekdepRegistrationItem } from '@/services/internship.service';
import { toast } from 'sonner';
import ProposalResponseDialog from '@/components/internship/ProposalResponseDialog';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';

export function ProposalVerificationPanel() {
    const queryClient = useQueryClient();
    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<SekdepRegistrationItem | null>(null);
    const [responseType, setResponseType] = useState<'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | null>(null);

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
        academicYearId,
        setAcademicYearId,
        sortBy,
        sortOrder,
        setSort,
        refetch,
    } = useSekdepPendingProposals();

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    useEffect(() => {
        if (!academicYearId && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) setAcademicYearId(active.id);
        }
    }, [academicYears, academicYearId, setAcademicYearId]);

    const respondMutation = useMutation({
        mutationFn: ({ id, response, notes }: { id: string, response: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL', notes?: string }) =>
            respondToSekdepProposal(id, response, notes),
        onSuccess: (data) => {
            toast.success(data.message);
            setResponseDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposals-pending'] });
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

    const columns = useMemo(() => getSekdepProposalColumns({
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
        onRespondProposal: (item, response) => {
            setSelectedProposal(item);
            setResponseType(response);
            setResponseDialogOpen(true);
        },
        onViewDetail: (item) => {
            // Navigate to detail if needed, or keep it as is
            window.location.href = `/kelola/kerja-praktik/pendaftaran/${item.id}`;
        }
    }), []);

    return (
        <div className="space-y-4">
            <InternshipTable
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
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSort}
                emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada proposal menunggu verifikasi.'}
                actions={
                    <div className="flex items-center gap-2">
                        <Select value={academicYearId} onValueChange={setAcademicYearId}>
                            <SelectTrigger className="w-[200px] h-9">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                {academicYears.map((ay) => (
                                    <SelectItem key={ay.id} value={ay.id}>
                                        <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                            {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                    </div>
                }
            />

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
