import { useState, useMemo } from 'react';
import { Pencil, Power, Trash2, Plus, Users } from 'lucide-react';
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
import { CplFormDialog } from '@/components/master-data/CplFormDialog';

interface CplTableProps {
    data: Cpl[];
    total: number;
    isLoading: boolean;
    isFetching: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateCplPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isToggling: boolean;
    isDeleting: boolean;
    isManagement?: boolean;
    params: any;
    onParamsChange: (params: any) => void;
}

export function CplTable({
    data,
    total,
    isLoading,
    isFetching,
    onToggle,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isToggling,
    isDeleting,
    isManagement = false,
    params,
    onParamsChange,
}: CplTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<Cpl | null>(null);

    const handleConfirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const columns = useMemo<Column<Cpl>[]>(() => [
        {
            key: 'no',
            header: 'No',
            width: 50,
            className: 'text-center',
            render: (_item, index) => (
                <span className="text-sm text-muted-foreground">{(params.page - 1) * params.limit + index + 1}</span>
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
            key: 'studentCplScoreCount',
            header: 'Mahasiswa',
            width: 110,
            render: (item) => (
                item.studentCplScoreCount > 0
                    ? (
                        <Badge variant="outline" className="gap-1">
                            <Users className="h-3 w-3" />
                            {item.studentCplScoreCount}
                        </Badge>
                    )
                    : <span className="text-muted-foreground">-</span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: 90,
            filter: {
                type: 'select',
                value: params.status,
                onChange: (value: string) => {
                    onParamsChange({ ...params, status: value, page: 1 });
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
                    {isManagement && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => setEditItem(item)}
                            disabled={!item.isActive || item.hasRelatedScores}
                            title={!item.isActive ? 'CPL non-aktif tidak dapat diubah' : item.hasRelatedScores ? 'CPL yang sudah memiliki nilai mahasiswa tidak dapat diubah' : 'Edit'}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
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
                    {isManagement && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(item.id)}
                            disabled={isDeleting || item.hasRelatedScores}
                            title={item.hasRelatedScores ? 'CPL tidak dapat dihapus karena sudah memiliki nilai mahasiswa' : 'Hapus'}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [isToggling, isDeleting, onToggle, params, isManagement]);

    return (
        <>
            <CustomTable
                columns={columns}
                data={data}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={total}
                page={params.page}
                pageSize={params.limit}
                onPageChange={(p) => onParamsChange({ ...params, page: p })}
                onPageSizeChange={(s) => onParamsChange({ ...params, limit: s })}
                searchValue={params.search}
                onSearchChange={(s) => onParamsChange({ ...params, search: s, page: 1 })}
                enableColumnFilters
                emptyText="Belum ada data CPL"
                actions={
                    <div className="flex items-center gap-2">
                        {isManagement && (
                            <Button variant="outline" size="sm" onClick={onCreate}>
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        )}
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

            {/* Edit Dialog */}
            {editItem && (
                <CplFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                    isManagement={isManagement}
                />
            )}
        </>
    );
}
