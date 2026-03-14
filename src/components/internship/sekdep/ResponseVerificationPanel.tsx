import { useEffect, useMemo, useState } from 'react';
import InternshipTable from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepPendingResponses } from '@/hooks/internship/useSekdepPendingResponses';
import { getSekdepResponseColumns } from '@/lib/internship';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { verifyCompanyResponse, type SekdepRegistrationItem } from '@/services/internship.service';
import { toast } from 'sonner';
import VerifyCompanyResponseDialog from '@/components/internship/sekdep/VerifyCompanyResponseDialog';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';

export function ResponseVerificationPanel() {
    const queryClient = useQueryClient();
    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<SekdepRegistrationItem | null>(null);
    const [verifyType, setVerifyType] = useState<'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY' | null>(null);

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
    } = useSekdepPendingResponses();

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    useEffect(() => {
        if (!academicYearId && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) setAcademicYearId(active.id);
        }
    }, [academicYears, academicYearId, setAcademicYearId]);

    const verifyMutation = useMutation({
        mutationFn: ({ id, status, notes, memberIds }: { id: string, status: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY', notes?: string, memberIds?: string[] }) =>
            verifyCompanyResponse(id, status, notes, memberIds),
        onSuccess: (data) => {
            toast.success(data.message);
            setVerifyDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ['sekdep-internship-proposals-responses'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal memverifikasi surat balasan');
        }
    });

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    const handleConfirmVerify = (notes?: string, memberIds?: string[]) => {
        if (selectedProposal && verifyType) {
            verifyMutation.mutate({
                id: selectedProposal.id,
                status: verifyType,
                notes,
                memberIds
            });
        }
    };

    const columns = useMemo(() => getSekdepResponseColumns({
        onViewAppLetterDoc: (item) => {
            if (item.dokumenSuratPermohonan) {
                openDocumentPreview(item.dokumenSuratPermohonan.fileName, item.dokumenSuratPermohonan.filePath);
            }
        },
        onViewResponseDoc: (item) => {
            if (item.dokumenSuratBalasan) {
                openDocumentPreview(item.dokumenSuratBalasan.fileName, item.dokumenSuratBalasan.filePath);
            }
        },
        onViewAssignmentDoc: (item) => {
            if (item.dokumenSuratTugas) {
                openDocumentPreview(item.dokumenSuratTugas.fileName, item.dokumenSuratTugas.filePath);
            }
        },
        onVerifyResponse: (item, status) => {
            setSelectedProposal(item);
            setVerifyType(status);
            setVerifyDialogOpen(true);
        },
        onViewDetail: (item) => {
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
                emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada surat balasan menunggu verifikasi.'}
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

            {selectedProposal && selectedProposal.members && (
                <VerifyCompanyResponseDialog
                    open={verifyDialogOpen}
                    onOpenChange={setVerifyDialogOpen}
                    onConfirm={handleConfirmVerify}
                    isLoading={verifyMutation.isPending}
                    type={verifyType}
                    companyName={selectedProposal.companyName}
                    members={selectedProposal.members}
                />
            )}
        </div>
    );
}
