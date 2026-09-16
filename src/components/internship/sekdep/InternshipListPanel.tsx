import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InternshipTable from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useSekdepInternshipList } from '@/hooks/internship/useSekdepInternshipList';
import { getSekdepInternshipListColumns } from '@/lib/internship/sekdepColumns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import { useState } from 'react';
import { AssignSupervisorDialog } from './AssignSupervisorDialog';
import { ReplaceSupervisorDialog } from './ReplaceSupervisorDialog';
import { UserPlus, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DocumentPreviewDialog from '@/components/thesis/DocumentPreviewDialog';

export function InternshipListPanel() {
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
        academicYearId,
        setAcademicYearId,
        status,
        setStatus,
        sortBy,
        sortOrder,
        setSort,
        refetch,
    } = useSekdepInternshipList();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<{ fileName?: string; filePath?: string } | null>(null);
    const assignableDisplayItems = useMemo(
        () => displayItems.filter((item) => !item.supervisorLetter),
        [displayItems]
    );
    const replaceableDisplayItems = useMemo(
        () => displayItems.filter((item) => !!item.supervisorLetter),
        [displayItems]
    );
    
    const canAssign = selectedIds.length > 0 && selectedIds.every(id => assignableDisplayItems.find(i => i.id === id));
    const canReplace = selectedIds.length > 0 && selectedIds.every(id => replaceableDisplayItems.find(i => i.id === id));    const { academicYears } = useAcademicYears({ pageSize: 50 });

    useEffect(() => {
        if (!academicYearId && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) {
                setAcademicYearId(active.id);
            } else {
                setAcademicYearId('all');
            }
        }
    }, [academicYears, academicYearId, setAcademicYearId]);

    const columns = useMemo(() => getSekdepInternshipListColumns({
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/mahasiswa/${item.id}`);
        },
        onViewAssignmentDoc: (item) => {
            if (!item.supervisorLetter?.filePath) return;
            setPreviewDoc({
                fileName: item.supervisorLetter.fileName,
                filePath: item.supervisorLetter.filePath,
            });
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
                enableColumnFilters
                searchValue={q}
                onSearchChange={(v) => {
                    setQ(v);
                }}
                // Selection
                selectedIds={selectedIds}
                onSelectionChange={(ids) => setSelectedIds(ids)}
                isRowSelectable={() => true}
                // Sorting
                // Sorting
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSort}
                emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada data mahasiswa.'}
                actions={
                    <div className="flex items-center gap-2">
                        {canAssign && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-9 bg-primary hover:bg-primary/90 text-white font-medium px-4 gap-2 animate-in fade-in slide-in-from-right-2"
                                onClick={() => setIsAssignDialogOpen(true)}
                            >
                                <UserPlus className="size-4" />
                                Assign Dosen ({selectedIds.length})
                            </Button>
                        )}
                        {canReplace && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 border-amber-300 text-amber-700 hover:bg-amber-50 font-medium px-4 gap-2 animate-in fade-in slide-in-from-right-2"
                                onClick={() => setIsReplaceDialogOpen(true)}
                            >
                                <UserMinus className="size-4" />
                                Ganti Pembimbing ({selectedIds.length})
                            </Button>
                        )}

                        <Select value={academicYearId} onValueChange={setAcademicYearId}>
                            <SelectTrigger className="w-[180px] h-9">
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

                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-[150px] h-9">
                                <SelectValue placeholder="Pilih Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="ACCEPTED_BY_COMPANY">Menunggu Verifikasi</SelectItem>
                                <SelectItem value="ONGOING">Ongoing</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                            </SelectContent>
                        </Select>

                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                    </div>
                }
            />

            <AssignSupervisorDialog
                open={isAssignDialogOpen}
                onOpenChange={setIsAssignDialogOpen}
                selectedInternshipIds={selectedIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
            />
            <ReplaceSupervisorDialog
                open={isReplaceDialogOpen}
                onOpenChange={setIsReplaceDialogOpen}
                selectedInternshipIds={selectedIds}
                onSuccess={() => {
                    setSelectedIds([]);
                    refetch();
                }}
            />

            <DocumentPreviewDialog
                open={!!previewDoc}
                onOpenChange={(open) => {
                    if (!open) setPreviewDoc(null);
                }}
                fileName={previewDoc?.fileName}
                filePath={previewDoc?.filePath}
            />
        </div>
    );
}
