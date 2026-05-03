import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, FileText } from 'lucide-react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import type {
    UpdateYudisiumRequirementPayload,
    YudisiumRequirement,
} from '@/services/yudisium/yudisium-requirement.service';
import { YudisiumRequirementFormDialog } from './YudisiumRequirementFormDialog';

interface YudisiumRequirementTableProps {
    data: YudisiumRequirement[];
    isLoading: boolean;
    isFetching: boolean;
    onRefresh: () => void;
    onCreate: () => void;
    onUpdate: (id: string, payload: UpdateYudisiumRequirementPayload) => Promise<unknown>;
    onMoveTop: (id: string) => void;
    onMoveBottom: (id: string) => void;
    onDelete: (id: string) => void;
    isMoving: boolean;
    isUpdating?: boolean;
    isDeleting: boolean;
}

export function YudisiumRequirementTable({
    isLoading,
    isFetching,
    onRefresh,
    onCreate,
    onUpdate,
    onMoveTop,
    onMoveBottom,
    onDelete,
    isMoving,
    isUpdating,
    isDeleting,
    data = [],
}: YudisiumRequirementTableProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<YudisiumRequirement | null>(null);

    const filteredData = useMemo(() => {
        const term = search.toLowerCase();

        return data.filter((item) => {
            return (
                term.length === 0 ||
                item.name.toLowerCase().includes(term) ||
                (item.description ?? '').toLowerCase().includes(term)
            );
        });
    }, [data, search]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const firstId = data[0]?.id;
    const lastId = data[data.length - 1]?.id;

    const columns = useMemo<Column<YudisiumRequirement>[]>(() => [
        {
            key: 'no',
            header: 'No',
            width: 60,
            className: 'text-center',
            render: (_row, index) => (
                <span className="text-sm text-muted-foreground">{(page - 1) * pageSize + index + 1}</span>
            ),
        },
        {
            key: 'name',
            header: 'Persyaratan',
            width: 220,
            className: 'whitespace-normal',
            render: (item) => <span className="font-medium">{item.name}</span>,
        },
        {
            key: 'description',
            header: 'Deskripsi',
            className: 'whitespace-normal min-w-[300px]',
            render: (item) => <span className="text-sm">{item.description || '-'}</span>,
        },
        {
            key: 'relationCount',
            header: 'Terkait',
            width: 100,
            className: 'text-center',
            render: (item) => (
                <div className="flex justify-center">
                    <Badge variant="secondary" className="flex items-center gap-1 font-normal bg-gray-50 text-muted-foreground border-gray-200">
                        <FileText className="h-3 w-3" />
                        <span>{item.relationCount}</span>
                    </Badge>
                </div>
            ),
        },
        {
            key: 'isActive',
            header: 'Aktif',
            width: 80,
            className: 'text-center',
            render: (item) => (
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={item.isActive}
                        onCheckedChange={(checked) => onUpdate(item.id, { isActive: checked })}
                        disabled={isUpdating}
                    />
                </div>
            ),
        },
        {
            key: 'isPublic',
            header: 'Publik',
            width: 80,
            className: 'text-center',
            render: (item) => (
                <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                        checked={item.isPublic}
                        onCheckedChange={(checked) => onUpdate(item.id, { isPublic: checked })}
                        disabled={isUpdating}
                    />
                </div>
            ),
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 160,
            className: 'text-right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onMoveTop(item.id)}
                        disabled={isMoving || item.id === firstId}
                        title="Pindahkan ke paling atas"
                    >
                        <ArrowUp className="h-3 w-3" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onMoveBottom(item.id)}
                        disabled={isMoving || item.id === lastId}
                        title="Pindahkan ke paling bawah"
                    >
                        <ArrowDown className="h-3 w-3" />
                    </Button>

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
                        className={`h-8 w-8 ${
                            item.relationCount > 0
                                ? 'text-red-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                        onClick={() => setDeleteId(item.id)}
                        disabled={isDeleting || item.relationCount > 0}
                        title={item.relationCount > 0 ? 'Tidak dapat dihapus karena sudah memiliki data terkait' : 'Hapus'}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ], [data, firstId, isDeleting, isMoving, isUpdating, lastId, onMoveBottom, onMoveTop, onUpdate, page, pageSize]);

    const handleConfirmDelete = () => {
        if (!deleteId) return;

        onDelete(deleteId);
        setDeleteId(null);
    };

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
                emptyText="Belum ada persyaratan yudisium"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />
                    </div>
                }
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Persyaratan Yudisium</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus persyaratan ini? Lanjutkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
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

            {editItem && (
                <YudisiumRequirementFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
