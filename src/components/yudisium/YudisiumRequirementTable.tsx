import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Power, Trash2 } from 'lucide-react';
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
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    isMoving: boolean;
    isToggling: boolean;
    isDeleting: boolean;
}

export function YudisiumRequirementTable({
    data,
    isLoading,
    isFetching,
    onRefresh,
    onCreate,
    onUpdate,
    onMoveTop,
    onMoveBottom,
    onToggle,
    onDelete,
    isMoving,
    isToggling,
    isDeleting,
}: YudisiumRequirementTableProps) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<YudisiumRequirement | null>(null);

    const filteredData = useMemo(() => {
        const term = search.toLowerCase();

        return data.filter((item) => {
            const matchedSearch =
                term.length === 0 ||
                item.name.toLowerCase().includes(term) ||
                (item.description ?? '').toLowerCase().includes(term) ||
                (item.notes ?? '').toLowerCase().includes(term);

            const matchedStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && item.isActive) ||
                (statusFilter === 'inactive' && !item.isActive);

            return matchedSearch && matchedStatus;
        });
    }, [data, search, statusFilter]);

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
            width: 260,
            render: (item) => <span className="font-medium">{item.name}</span>,
        },
        {
            key: 'description',
            header: 'Deskripsi',
            className: 'max-w-md whitespace-normal',
            render: (item) => <span className="text-sm">{item.description || '-'}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            width: 120,
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
            width: 190,
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
                            item.isActive
                                ? 'text-muted-foreground hover:text-amber-600'
                                : 'text-muted-foreground hover:text-emerald-600'
                        }`}
                        onClick={() => onToggle(item.id)}
                        disabled={isToggling}
                        title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                        <Power className="h-4 w-4" />
                    </Button>

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
                </div>
            ),
        },
    ], [data, firstId, isDeleting, isMoving, isToggling, lastId, onMoveBottom, onMoveTop, onToggle, page, pageSize]);

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
                        <Select
                            value={statusFilter}
                            onValueChange={(value: 'all' | 'active' | 'inactive') => {
                                setStatusFilter(value);
                                setPage(1);
                            }}
                        >
                            <SelectTrigger className="w-[150px] h-9">
                                <SelectValue placeholder="Semua status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="active">Aktif</SelectItem>
                                <SelectItem value="inactive">Tidak Aktif</SelectItem>
                            </SelectContent>
                        </Select>

                        <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />

                        <Button onClick={onCreate} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Persyaratan
                        </Button>
                    </div>
                }
            />

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Persyaratan Yudisium</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus persyaratan ini? Persyaratan yang sudah
                            dipakai pada data dokumen peserta tidak dapat dihapus.
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
