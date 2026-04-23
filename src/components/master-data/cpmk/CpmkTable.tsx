import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
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
import type { Cpmk, UpdateCpmkPayload } from '@/services/master-data/cpmk.service';
import { CpmkFormDialog } from '@/components/master-data/cpmk/CpmkFormDialog';

interface CpmkTableProps {
    data: Cpmk[];
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateCpmkPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isDeleting: boolean;
    extraActions?: React.ReactNode;
    onCopyTemplate?: () => void;
    isCopyingTemplate?: boolean;
}

export function CpmkTable({
    data,
    isLoading,
    isFetching,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isDeleting,
    extraActions,
    onCopyTemplate,
    isCopyingTemplate = false,
}: CpmkTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<Cpmk | null>(null);
    const [search, setSearch] = useState('');
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
        if (!term) return data;
        return data.filter((item) =>
            (item.code || '').toLowerCase().includes(term) ||
            item.description.toLowerCase().includes(term)
        );
    }, [data, search]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<Cpmk>[]>(() => [
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
            header: 'Kode CPMK',
            width: 120,
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
            key: 'actions',
            header: 'Aksi',
            width: 90,
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
                    {!item.hasAssessmentDetails && (
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
    ], [isDeleting, page, pageSize]);

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
                emptyText="Belum ada data CPMK"
                actions={
                    <div className="flex items-center gap-2">
                        {extraActions}
                        {onCopyTemplate && data.length === 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onCopyTemplate}
                                disabled={isCopyingTemplate}
                            >
                                {isCopyingTemplate ? (
                                    <>
                                        <Spinner className="mr-2 h-4 w-4" />
                                        Menyalin...
                                    </>
                                ) : (
                                    'Copy Template'
                                )}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah CPMK
                        </Button>
                        <RefreshButton
                            onClick={onRefresh}
                            isRefreshing={isFetching && !isLoading}
                        />
                    </div>
                }
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data CPMK</AlertDialogTitle>
                        <AlertDialogDescription>
                            Menghapus CPMK ini akan menghapus semua kriteria dan rubrik terkait. Lanjutkan?
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
                <CpmkFormDialog
                    open={!!editItem}
                    onOpenChange={(open: boolean) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
