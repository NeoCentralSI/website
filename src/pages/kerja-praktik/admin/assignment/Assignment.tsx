import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import InternshipTable from '@/components/internship/InternshipTable';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { 
    getAdminAssignmentProposals, 
    verifyCompanyResponse, 
    adminUploadCompanyResponse,
    uploadInternshipDocument,
    type AdminAssignmentProposalItem 
} from '@/services/internship';
import { getAdminAssignmentProposalColumns } from '@/lib/internship';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { Button } from '@/components/ui/button';
import { Download, Settings2, ClipboardList } from 'lucide-react';
import VerifyCompanyResponseDialog from '@/components/internship/sekdep/VerifyCompanyResponseDialog';
import AdminUploadCompanyResponseDialog from '@/components/internship/sekdep/AdminUploadCompanyResponseDialog';
import { toast } from 'sonner';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadFilesAsZip } from '@/lib/internship/bulkDownload';

export default function AdminAssignmentPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    // Search and Pagination State
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [academicYearId, setAcademicYearId] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    useEffect(() => {
        if (!academicYearId && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) {
                setAcademicYearId(active.id);
            } else {
                setAcademicYearId('all');
            }
        }
    }, [academicYears, academicYearId]);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ['admin-assignment-proposals', academicYearId],
        queryFn: async () => {
            const res = await getAdminAssignmentProposals(academicYearId);
            return res.data;
        },
        enabled: !!academicYearId
    });

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Surat Tugas' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Surat Tugas');
    }, [breadcrumbs, setBreadcrumbs, setTitle]);

    const [docOpen, setDocOpen] = useState(false);
    const [docInfo, setDocInfo] = useState<{ fileName: string; filePath: string } | null>(null);

    const openDocumentPreview = (fileName: string, filePath: string) => {
        setDocInfo({ fileName, filePath });
        setDocOpen(true);
    };

    // Verification Dialog State
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [selectedProposal, setSelectedProposal] = useState<AdminAssignmentProposalItem | null>(null);
    const [verifyType, setVerifyType] = useState<'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY' | null>(null);

    const handleVerifyOpen = (item: AdminAssignmentProposalItem, type: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY') => {
        setSelectedProposal(item);
        setVerifyType(type);
        setVerifyOpen(true);
    };

    // Upload Dialog State
    const [uploadOpen, setUploadOpen] = useState(false);

    const handleUploadOpen = (item: AdminAssignmentProposalItem) => {
        setSelectedProposal(item);
        setUploadOpen(true);
    };

    const uploadMutation = useMutation({
        mutationFn: async ({ proposalId, file }: { proposalId: string; file: File }) => {
            const { documentId } = await uploadInternshipDocument(file);
            return adminUploadCompanyResponse(proposalId, documentId);
        },
        onSuccess: (data) => {
            toast.success(data.message);
            setUploadOpen(false);
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal mengunggah surat balasan');
        }
    });

    const handleConfirmUpload = (file: File) => {
        if (selectedProposal) {
            uploadMutation.mutate({
                proposalId: selectedProposal.id,
                file
            });
        }
    };

    const verifyMutation = useMutation({
        mutationFn: ({ id, status, notes, memberIds }: { id: string, status: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY', notes?: string, memberIds?: string[] }) =>
            verifyCompanyResponse(id, status, notes, memberIds),
        onSuccess: (data) => {
            toast.success(data.message);
            setVerifyOpen(false);
            refetch();
        },
        onError: (error: any) => {
            toast.error(error.message || 'Gagal memverifikasi surat balasan');
        }
    });

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

    const handleManageLetter = (item: AdminAssignmentProposalItem) => {
        navigate(`/admin/kerja-praktik/surat-tugas/${item.id}`);
    };

    const handleDownloadAssignment = async () => {
        if (!data) return;
        const selectedProposals = data.filter(p => selectedIds.includes(p.id) && p.letterFile);
        const files = selectedProposals.map(p => ({
            fileName: p.letterFile!.fileName,
            filePath: p.letterFile!.filePath,
            subfolder: p.coordinatorName
        }));
        
        await downloadFilesAsZip(files, 'Surat_Tugas_KP');
    };

    const handleDownloadResponse = async () => {
        if (!data) return;
        const selectedProposals = data.filter(p => selectedIds.includes(p.id) && p.companyResponseFile);
        const files = selectedProposals.map(p => ({
            fileName: p.companyResponseFile!.fileName,
            filePath: p.companyResponseFile!.filePath,
            subfolder: p.coordinatorName
        }));
        
        await downloadFilesAsZip(files, 'Surat_Balasan_Perusahaan');
    };

    const columns = useMemo(() => getAdminAssignmentProposalColumns({
        onViewLetterDoc: (item: AdminAssignmentProposalItem) => {
            if (item.letterFile) {
                openDocumentPreview(item.letterFile.fileName, item.letterFile.filePath);
            }
        },
        onViewResponseDoc: (item: AdminAssignmentProposalItem) => {
            if (item.companyResponseFile) {
                openDocumentPreview(item.companyResponseFile.fileName, item.companyResponseFile.filePath);
            }
        },
        onVerifyResponse: (item: AdminAssignmentProposalItem, type: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY') => handleVerifyOpen(item, type),
        onUploadResponse: (item: AdminAssignmentProposalItem) => handleUploadOpen(item),
        onAction: (item: AdminAssignmentProposalItem) => handleManageLetter(item)
    }), [data]);

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
            <div className="flex items-center gap-2 mb-6 text-2xl font-semibold">
                <ClipboardList className="h-6 w-6 text-primary" />
                <h1>Surat Tugas Kerja Praktik</h1>
            </div>

            {isLoading && !data ? (
                <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                    <Loading size="lg" text="Memuat data pengajuan..." />
                </div>
            ) : (
                <InternshipTable
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
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Belum ada pengajuan yang memiliki surat balasan disetujui Sekdep.'}
                    actions={
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadResponse}
                                        className="h-9 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Surat Balasan ({selectedIds.length})
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadAssignment}
                                        className="h-9 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Surat Tugas ({selectedIds.length})
                                    </Button>
                                </>
                            )}
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

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate('/admin/kerja-praktik/surat-tugas/template')}
                                className="h-9"
                            >
                                <Settings2 className="h-4 w-4 mr-2" />
                                Kelola Template
                            </Button>
                            <RefreshButton
                                onClick={() => refetch()}
                                isRefreshing={isFetching && !isLoading}
                            />
                        </div>
                    }
                />
            )}

            <DocumentPreviewDialog
                open={docOpen}
                onOpenChange={setDocOpen}
                fileName={docInfo?.fileName ?? undefined}
                filePath={docInfo?.filePath ?? undefined}
            />

            {selectedProposal && (
                <VerifyCompanyResponseDialog
                    open={verifyOpen}
                    onOpenChange={setVerifyOpen}
                    type={verifyType}
                    companyName={selectedProposal.companyName}
                    members={selectedProposal.members}
                    onConfirm={handleConfirmVerify}
                    isLoading={verifyMutation.isPending}
                />
            )}

            {selectedProposal && (
                <AdminUploadCompanyResponseDialog
                    open={uploadOpen}
                    onOpenChange={setUploadOpen}
                    companyName={selectedProposal.companyName}
                    onConfirm={handleConfirmUpload}
                    isLoading={uploadMutation.isPending}
                />
            )}
        </div>
    );
}
