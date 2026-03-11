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
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    }, [academicYears, academicYearId, setAcademicYearId]);

    const columns = useMemo(() => getSekdepInternshipListColumns({
        onViewDetail: (item) => {
            navigate(`/kelola/kerja-praktik/mahasiswa/${item.id}`);
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
                onSelectionChange={setSelectedIds}
                // Sorting
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSort}
                emptyText={q ? 'Pencarian tidak menemukan hasil.' : 'Tidak ada data mahasiswa.'}
                actions={
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 && (
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
        </div>
    );
}
