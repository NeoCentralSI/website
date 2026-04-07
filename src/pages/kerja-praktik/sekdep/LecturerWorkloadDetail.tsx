import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import InternshipTable from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepInternshipList } from '@/hooks/internship/useSekdepInternshipList';
import { getSekdepInternshipListColumns } from '@/lib/internship/sekdepColumns';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';
import type { InternshipListItem } from '@/services/internship.service';
import { Settings2 } from 'lucide-react';

export default function LecturerWorkloadDetail() {
    const { supervisorId } = useParams<{ supervisorId: string }>();
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
    } = useSekdepInternshipList(supervisorId);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<{ fileName: string; filePath: string } | null>(null);

    const columns = useMemo(() => getSekdepInternshipListColumns({
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/mahasiswa/${item.id}`);
        },
        onViewAssignmentDoc: (item: InternshipListItem) => {
            if (item.supervisorLetter) {
                setSelectedDoc({
                    fileName: item.supervisorLetter.fileName,
                    filePath: item.supervisorLetter.filePath
                });
                setPreviewOpen(true);
            }
        }
    }), [navigate]);

    // Berusaha mendapatkan nama dosen dari item pertama jika ada
    const lecturerName = displayItems.length > 0 ? displayItems[0].supervisorName : 'Detail Beban Kerja Dosen';

    return (
        <div className="p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => navigate(-1)}
                    className="hover:bg-accent transition-colors"
                >
                    <ChevronLeft className="size-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">
                        {isLoading ? 'Memuat...' : lecturerName}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Daftar mahasiswa bimbingan aktif
                    </p>
                </div>
            </div>

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
                        emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada data mahasiswa bimbingan.'}
                        actions={
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/kelola/kerja-praktik/dosen/${supervisorId}/surat-tugas`)}
                                    className="h-9"
                                >
                                    <Settings2 className="h-4 w-4 mr-2" />
                                    Kelola ST Pembimbing
                                </Button>
                                <RefreshButton
                                    onClick={() => refetch()}
                                    isRefreshing={isFetching && !isLoading}
                                />
                            </div>
                        }
                    />

            <DocumentPreviewDialog
                open={previewOpen}
                onOpenChange={setPreviewOpen}
                fileName={selectedDoc?.fileName}
                filePath={selectedDoc?.filePath}
            />
        </div>
    );
}
