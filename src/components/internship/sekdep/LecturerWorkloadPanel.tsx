import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InternshipTable } from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepLecturerWorkload } from '@/hooks/internship/useSekdepLecturerWorkload';
import { getSekdepLecturerWorkloadColumns } from '@/lib/internship/sekdepColumns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, Settings2 } from 'lucide-react';
import { exportLecturerWorkloadPdf } from '@/services/internship.service';
import { useState } from 'react';

export function LecturerWorkloadPanel() {
    const navigate = useNavigate();
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
        sortBy,
        sortOrder,
        setSort,
        refetch,
    } = useSekdepLecturerWorkload();

    const [isExporting, setIsExporting] = useState(false);

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            await exportLecturerWorkloadPdf();
            toast.success("PDF berhasil diekspor");
        } catch (error: any) {
            toast.error(error.message || "Gagal mengekspor PDF");
        } finally {
            setIsExporting(false);
        }
    };

    const columns = useMemo(() => getSekdepLecturerWorkloadColumns({
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/dosen/${item.id}`);
        }
    }), [navigate]);

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
                searchValue={q}
                onSearchChange={(v) => {
                    setQ(v);
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSort}
                emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada data dosen.'}
                actions={
                    <div className="flex items-center gap-2">
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate('/kelola/kerja-praktik/dosen/template/surat-tugas')}
                            className="gap-2"
                        >
                            <Settings2 className="h-4 w-4" />
                            Kelola Template
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="gap-2"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            Ekspor PDF
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
