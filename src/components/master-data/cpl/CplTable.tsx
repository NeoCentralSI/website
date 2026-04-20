import { useState, useMemo } from 'react';
import { Pencil, Power, Trash2, Plus } from 'lucide-react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import type { Cpl, UpdateCplPayload } from '@/services/master-data/cpl.service';
import { CplFormDialog } from '@/components/master-data/cpl/CplFormDialog';

interface CplTableProps {
    data: Cpl[];
    isLoading: boolean;
    isFetching: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateCplPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isToggling: boolean;
    isDeleting: boolean;
}

export function CplTable({
    data,
    isLoading,
    isFetching,
    onToggle,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isToggling,
    isDeleting,
}: CplTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<Cpl | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const handleConfirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const filteredData = useMemo(() => {
        const term = search.toLowerCase();
        return data.filter((item) => {
            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' ? item.isActive : !item.isActive);
            if (!matchesStatus) return false;

            if (!term) return true;

            return (
                (item.code || '').toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term) ||
                String(item.minimalScore).includes(term)
            );
        });
    }, [data, search, statusFilter]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<Cpl>[]>(() => [
        {
            key: 'no',
            header: 'No',
            width: 50,
            className: 'text-center',
            render: (_item, index) => (
                <span className="text-sm text-muted-foreground">{(page - 1) * pageSize + index + 1}</span>
            ),
        },
        {
            key: 'code',
            header: 'Kode CPL',
            width: 110,
            render: (item) => (
                <span className="font-medium">{item.code || '-'}</span>
            ),
        },
        {
            key: 'description',
            header: 'Deskripsi',
            className: 'max-w-md whitespace-normal',
            render: (item) => (
                <span className="text-sm">{item.description}</span>
            ),
        },
        {
            key: 'minimalScore',
            header: 'Skor Minimal',
            width: 120,
            render: (item) => (
                <span className="font-medium">{item.minimalScore}</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: 90,
            filter: {
                type: 'select',
                value: statusFilter,
                onChange: (value: string) => {
                    setStatusFilter(value as 'active' | 'inactive' | 'all');
                    setPage(1);
                },
                options: [
                    { label: 'Aktif', value: 'active' },
                    { label: 'Tidak Aktif', value: 'inactive' },
                    { label: 'Semua', value: 'all' },
                ],
            },
            render: (item) => (
                <Badge
                    variant={item.isActive ? 'default' : 'secondary'}
                    className={
                        item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                    }
                >
                    {item.isActive ? 'Aktif' : 'Tidak Aktif'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 120,
            className: 'text-right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => setEditItem(item)}
                        title="Edit"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 ${item.isActive
                            ? 'text-muted-foreground hover:text-amber-600'
                            : 'text-muted-foreground hover:text-emerald-600'
                            }`}
                        onClick={() => onToggle(item.id)}
                        disabled={isToggling}
                        title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                        <Power className="h-4 w-4" />
                    </Button>
                    {!item.hasRelatedScores && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                            disabled={isDeleting}
                            title="Hapus"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [isToggling, isDeleting, onToggle, page, pageSize, statusFilter]);

    return (
        <>
            <CustomTable
                columns={columns}
                data={paginatedData}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={filteredData.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                searchValue={search}
                onSearchChange={setSearch}
                enableColumnFilters
                emptyText="Belum ada data CPL"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah CPL
                        </Button>
                        <RefreshButton
                            onClick={onRefresh}
                            isRefreshing={isFetching && !isLoading}
                        />
                    </div>
                }
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data CPL</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data CPL ini? Data yang sudah memiliki nilai CPL mahasiswa tidak dapat dihapus.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive/70 text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? (
                                <>
                                    <Spinner className="mr-2 h-4 w-4" />
                                    Menghapus...
                                </>
                            ) : (
                                'Hapus'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Edit Dialog */}
            {editItem && (
                <CplFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
