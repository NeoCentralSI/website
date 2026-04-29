import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import InternshipTable from '@/components/internship/InternshipTable';
import { Loading } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import { getAdminApprovedProposals, type AdminApprovedProposalItem } from '@/services/internship';
import { getAdminApprovedProposalColumns } from '@/lib/internship';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import { Button } from '@/components/ui/button';
import { Download, Settings2, Mail } from 'lucide-react';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { downloadFilesAsZip } from '@/lib/internship/bulkDownload';

export default function AdminApplicationPage() {
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
        queryKey: ['admin-approved-proposals', academicYearId],
        queryFn: async () => {
            const res = await getAdminApprovedProposals(academicYearId);
            return res.data;
        },
        enabled: !!academicYearId
    });

    const breadcrumbs = useMemo(() => [
        { label: 'Kerja Praktik' },
        { label: 'Surat Pengantar' }
    ], []);

    useEffect(() => {
        setBreadcrumbs(breadcrumbs);
        setTitle('Surat Pengantar');
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

    const handleBulkDownload = async () => {
        if (!data) return;
        const selectedProposals = data.filter(p => selectedIds.includes(p.id) && p.letterFile);
        const files = selectedProposals.map(p => ({
            fileName: p.letterFile!.fileName,
            filePath: p.letterFile!.filePath,
            subfolder: p.coordinatorName
        }));
        
        await downloadFilesAsZip(files, 'Surat_Permohonan_KP');
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
            <div className="flex items-center gap-2 mb-6 text-2xl font-semibold">
                <Mail className="h-6 w-6 text-primary" />
                <h1>Surat Pengantar Kerja Praktik</h1>
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
                    emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Belum ada pengajuan yang disetujui Sekdep.'}
                    actions={
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleBulkDownload}
                                    className="h-9 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Surat Permohonan ({selectedIds.length})
                                </Button>
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
                                onClick={() => navigate('/admin/kerja-praktik/templates/INTERNSHIP_APPLICATION_LETTER')}
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
        </div>
    );
}
