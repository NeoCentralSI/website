import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
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
import type { SeminarRequirement, UpdateSeminarRequirementPayload } from '@/services/master-data/seminar-requirement.service';
import { SeminarRequirementFormDialog } from './SeminarRequirementFormDialog';

interface SeminarRequirementTableProps {
    data: SeminarRequirement[];
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onReorder: (orderedIds: string[]) => Promise<unknown>;
    onUpdate: (id: string, data: UpdateSeminarRequirementPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isDeleting: boolean;
    onCopyTemplate?: () => void;
    isCopyingTemplate?: boolean;
    extraActions?: React.ReactNode;
}

export function SeminarRequirementTable({
    data,
    isLoading,
    isFetching,
    onDelete,
    onReorder,
    onUpdate,
    onCreate,
    onRefresh,
    isDeleting,
    onCopyTemplate,
    isCopyingTemplate,
    extraActions,
}: SeminarRequirementTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<SeminarRequirement | null>(null);
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
        if (!search) return data;
        const lowercaseSearch = search.toLowerCase();
        return data.filter(
            (item) => item.name.toLowerCase().includes(lowercaseSearch)
        );
    }, [data, search]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns: Column<SeminarRequirement>[] = [
        {
            key: 'name',
            header: 'Nama Persyaratan',
            accessor: 'name',
            className: 'font-medium',
        },
        {
            key: 'description',
            header: 'Deskripsi',
            accessor: 'description',
            className: 'max-w-md whitespace-normal',
            render: (row) => <span className="text-sm text-muted-foreground">{row.description || '-'}</span>,
        },
        {
            key: 'actions',
            header: 'Aksi',
            accessor: 'id',
            className: 'text-right',
            render: (row) => {
                const id = row.id;
                const index = filteredData.findIndex(r => r.id === row.id);
                const isFirst = page === 1 && index === 0;
                const isLast = page === Math.ceil(filteredData.length / pageSize) && index === filteredData.length - 1;

                const handleMoveUp = async () => {
                    if (isFirst) return;
                    const newOrdered = [...filteredData];
                    [newOrdered[index - 1], newOrdered[index]] = [newOrdered[index], newOrdered[index - 1]];
                    await onReorder(newOrdered.map(r => r.id));
                };

                const handleMoveDown = async () => {
                    if (isLast) return;
                    const newOrdered = [...filteredData];
                    [newOrdered[index + 1], newOrdered[index]] = [newOrdered[index], newOrdered[index + 1]];
                    await onReorder(newOrdered.map(r => r.id));
                };

                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={handleMoveUp}
                            disabled={isFirst}
                            title="Geser ke Atas"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary disabled:opacity-30"
                            onClick={handleMoveDown}
                            disabled={isLast}
                            title="Geser ke Bawah"
                        >
                            <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setEditItem(row)}
                            title="Edit Persyaratan"
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(id)}
                            disabled={isDeleting || row.hasRelatedData}
                            title={row.hasRelatedData ? "Persyaratan tidak dapat dihapus karena sudah memiliki dokumen yang diunggah" : "Hapus Persyaratan"}
                        >
                            {isDeleting && deleteId === id ? (
                                <Spinner className="h-4 w-4" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                );
            }
        },
    ];

    return (
        <div className="space-y-4">
            <CustomTable
                data={paginatedData}
                columns={columns as any}
                searchValue={search}
                onSearchChange={setSearch}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={filteredData.length}
                emptyText="Belum ada data persyaratan"
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
                                    'Salin Template'
                                )}
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <RefreshButton 
                            isRefreshing={isFetching && !isLoading} 
                            onClick={onRefresh} 
                        />
                    </div>
                }
            />

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Persyaratan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus persyaratan ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleConfirmDelete();
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Menghapus...' : 'Hapus'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SeminarRequirementFormDialog
                open={!!editItem}
                onOpenChange={(open) => !open && setEditItem(null)}
                onSubmit={(data) => onUpdate(editItem!.id, data as UpdateSeminarRequirementPayload)}
                initialData={editItem}
            />
        </div>
    );
}
