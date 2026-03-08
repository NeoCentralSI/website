import { useState, useMemo } from 'react';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { formatDateOnlyId } from '@/lib/text';
import type { YudisiumEvent, UpdateYudisiumPayload } from '@/services/yudisium.service';
import { YudisiumFormDialog } from '@/components/yudisium/event/YudisiumFormDialog';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
    draft: { label: 'Draft', variant: 'secondary', className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200' },
    open: { label: 'Pendaftaran Dibuka', variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
    closed: { label: 'Pendaftaran Ditutup', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    in_review: { label: 'Dalam Ulasan', variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
    finalized: { label: 'Selesai', variant: 'default', className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
};

interface YudisiumTableProps {
    data: YudisiumEvent[];
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateYudisiumPayload) => Promise<unknown>;
    onCreate: (payload: import('@/services/yudisium.service').CreateYudisiumPayload) => Promise<unknown>;
    onRefresh: () => void;
    isDeleting: boolean;
    canManage: boolean;
}

export function YudisiumTable({
    data,
    isLoading,
    isFetching,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isDeleting,
    canManage,
}: YudisiumTableProps) {
    const navigate = useNavigate();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<YudisiumEvent | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
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
        const latestFirst = [...data].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        const term = search.toLowerCase();
        if (!term) return latestFirst;
        return latestFirst.filter((item) => {
            const name = (item.name ?? '').toLowerCase();
            const registrationOpenDate = formatDateOnlyId(item.registrationOpenDate).toLowerCase();
            const registrationCloseDate = formatDateOnlyId(item.registrationCloseDate).toLowerCase();
            const status = STATUS_MAP[item.status]?.label.toLowerCase() ?? item.status;
            return (
                name.includes(term) ||
                registrationOpenDate.includes(term) ||
                registrationCloseDate.includes(term) ||
                status.includes(term)
            );
        });
    }, [data, search]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<YudisiumEvent>[]>(() => {
        const cols: Column<YudisiumEvent>[] = [
            {
                key: 'name',
                header: 'Nama',
                render: (item) => (
                    <span className="font-medium">{item.name || '-'}</span>
                ),
            },
            {
                key: 'registrationOpenDate',
                header: 'Pembukaan Pendaftaran',
                render: (item) => (
                    <span className="text-sm">{formatDateOnlyId(item.registrationOpenDate)}</span>
                ),
            },
            {
                key: 'registrationCloseDate',
                header: 'Penutupan Pendaftaran',
                render: (item) => (
                    <span className="text-sm">{formatDateOnlyId(item.registrationCloseDate)}</span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                width: 160,
                render: (item) => {
                    const s = STATUS_MAP[item.status] ?? STATUS_MAP.draft;
                    return (
                        <Badge variant={s.variant} className={s.className}>
                            {s.label}
                        </Badge>
                    );
                },
            },
        ];

        if (canManage) {
            cols.push({
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
                            title="Detail"
                            onClick={() => navigate(`/yudisium/lecturer/event/${item.id}`)}
                        >
                            <Eye className="h-4 w-4" />
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
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(item.id)}
                            disabled={isDeleting || !item.canDelete}
                            title={
                                item.canDelete
                                    ? 'Hapus'
                                    : 'Tidak dapat menghapus data yang sudah memiliki relasi'
                            }
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            });
        }

        return cols;
    }, [canManage, isDeleting, navigate]);

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
                emptyText="Belum ada data yudisium"
                actions={
                    <div className="flex items-center gap-2">
                        <RefreshButton
                            onClick={onRefresh}
                            isRefreshing={isFetching && !isLoading}
                        />
                        {canManage && (
                            <Button onClick={() => setShowCreateDialog(true)} size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open: boolean) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Data Yudisium</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data yudisium ini? Data yang sudah memiliki peserta tidak dapat dihapus.
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

            {/* Create Dialog */}
            <YudisiumFormDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSubmit={onCreate}
            />

            {/* Edit Dialog */}
            {editItem && (
                <YudisiumFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
