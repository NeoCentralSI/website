import { useState, useMemo } from 'react';
import { Eye, Pencil, Trash2, Plus, Users } from 'lucide-react';
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
import { formatDateOnlyId, formatDateTimeId } from '@/lib/text';
import type { YudisiumEvent, UpdateYudisiumPayload } from '@/services/yudisium/core.service';
import { YudisiumFormDialog } from '@/components/yudisium/YudisiumFormDialog';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; className: string }> = {
    draft: { label: 'Draft', variant: 'secondary', className: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100' },
    open: { label: 'Pendaftaran Dibuka', variant: 'default', className: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
    closed: { label: 'Pendaftaran Ditutup', variant: 'secondary', className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' },
    ongoing: { label: 'Sedang Berlangsung', variant: 'default', className: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
    completed: { label: 'Selesai', variant: 'default', className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
};

interface YudisiumTableProps {
    data: YudisiumEvent[];
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateYudisiumPayload) => Promise<unknown>;
    onCreate: (payload: import('@/services/yudisium/core.service').CreateYudisiumPayload) => Promise<unknown>;
    onRefresh: () => void;
    isDeleting: boolean;
    canManage: boolean;
    canViewDetail?: boolean;
}

export function YudisiumTable({
    isLoading,
    isFetching,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isDeleting,
    canManage,
    canViewDetail = true,
    data = [],
}: YudisiumTableProps) {
    const navigate = useNavigate();
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<YudisiumEvent | null>(null);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
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
            new Date(b.eventDate ?? 0).getTime() - new Date(a.eventDate ?? 0).getTime(),
        );

        const term = search.toLowerCase();

        return latestFirst.filter((item) => {
            const matchedSearch = !term || (
                (item.name ?? '').toLowerCase().includes(term) ||
                formatDateOnlyId(item.registrationOpenDate).toLowerCase().includes(term) ||
                formatDateOnlyId(item.registrationCloseDate).toLowerCase().includes(term) ||
                (STATUS_MAP[item.status || '']?.label.toLowerCase() ?? String(item.status || '')).includes(term) ||
                (item.participantCount?.toString() ?? '').includes(term)
            );

            const matchedStatus = statusFilter === '' || item.status === statusFilter;

            return matchedSearch && matchedStatus;
        });
    }, [data, search, statusFilter]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<YudisiumEvent>[]>(() => {
        const cols: Column<YudisiumEvent>[] = [
            {
                key: 'name',
                header: 'Nama',
                className: 'max-w-[240px] min-w-[160px] whitespace-normal',
                render: (item) => (
                    <div className="max-w-[28ch] whitespace-normal break-words font-medium leading-tight">
                        {item.name || '-'}
                    </div>
                ),
            },
            {
                key: 'eventDate',
                header: 'Tanggal',
                width: 150,
                className: 'whitespace-normal',
                render: (item) => (
                    <div className="max-w-[18ch] whitespace-normal break-words text-sm leading-tight">
                        {formatDateTimeId(item.eventDate)}
                    </div>
                ),
            },
            {
                key: 'room',
                header: 'Ruangan',
                render: (item) => (
                    <span className="text-sm">{item.room?.name || '-'}</span>
                ),
            },
            {
                key: 'registrationRange',
                header: 'Rentang Pendaftaran',
                render: (item) => (
                    <div className="text-xs space-y-0.5">
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground w-10">Buka:</span>
                            <span>{formatDateOnlyId(item.registrationOpenDate)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-muted-foreground w-10">Tutup:</span>
                            <span>{formatDateOnlyId(item.registrationCloseDate)}</span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'participantCount',
                header: 'Peserta',
                width: 90,
                render: (item) => (
                    item.participantCount > 0
                        ? (
                            <Badge variant="outline" className="gap-1 px-2 font-medium border-gray-200 text-gray-600">
                                <Users className="h-3 w-3" />
                                {item.participantCount}
                            </Badge>
                        )
                        : <span className="text-muted-foreground text-sm">-</span>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                width: 150,
                filter: {
                    type: 'select',
                    value: statusFilter,
                    onChange: (value: string) => {
                        setStatusFilter(value);
                        setPage(1);
                    },
                    options: [
                        { label: 'Semua', value: '' },
                        { label: 'Draft', value: 'draft' },
                        { label: 'Pendaftaran Dibuka', value: 'open' },
                        { label: 'Pendaftaran Ditutup', value: 'closed' },
                        { label: 'Sedang Berlangsung', value: 'ongoing' },
                        { label: 'Selesai', value: 'completed' },
                    ],
                },
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

        if (canManage || canViewDetail) {
            cols.push({
                key: 'actions',
                header: 'Aksi',
                width: 120,
                className: 'text-right',
                render: (item) => (
                    <div className="flex items-center justify-end gap-1">
                        {canViewDetail && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                title="Detail"
                                onClick={() => navigate(`/yudisium/${item.id}`)}
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        )}
                        {canManage && (
                            <>
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
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            </>
                        )}
                    </div>
                ),
            });
        }

        return cols;
    }, [canManage, canViewDetail, isDeleting, navigate]);

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
                emptyText="Belum ada data yudisium"
                actions={
                    <div className="flex items-center gap-2">
                        {canManage && (
                            <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(true)}>
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
