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
import type { LecturerAvailability, UpdateAvailabilityPayload } from '@/services/lecturerAvailability.service';
import { AvailabilityFormDialog } from '@/components/lecturer-availability/AvailabilityFormDialog';

const DAY_LABELS: Record<string, string> = {
    monday: 'Senin',
    tuesday: 'Selasa',
    wednesday: 'Rabu',
    thursday: 'Kamis',
    friday: 'Jumat',
};

function formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    });
}

function formatDateId(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

interface AvailabilityTableProps {
    data: LecturerAvailability[];
    isLoading: boolean;
    isFetching: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateAvailabilityPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isToggling: boolean;
    isDeleting: boolean;
}

export function AvailabilityTable({
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
}: AvailabilityTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<LecturerAvailability | null>(null);
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
            (DAY_LABELS[item.day] || item.day).toLowerCase().includes(term) ||
            formatTime(item.startTime).includes(term) ||
            formatTime(item.endTime).includes(term)
        );
    }, [data, search]);

    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, page, pageSize]);

    const columns = useMemo<Column<LecturerAvailability>[]>(() => [
        {
            key: 'day',
            header: 'Hari',
            render: (item) => (
                <span className="font-medium">{DAY_LABELS[item.day] || item.day}</span>
            ),
        },
        {
            key: 'startTime',
            header: 'Waktu Mulai',
            render: (item) => formatTime(item.startTime),
        },
        {
            key: 'endTime',
            header: 'Waktu Selesai',
            render: (item) => formatTime(item.endTime),
        },
        {
            key: 'period',
            header: 'Periode Berlaku',
            render: (item) => (
                <span className="text-sm">
                    {formatDateId(item.validFrom)} — {formatDateId(item.validUntil)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
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
    ], [isToggling, isDeleting, onToggle]);

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
                emptyText="Belum ada jadwal ketersediaan"
                actions={
                    <div className="flex items-center gap-2">
                        <RefreshButton
                            onClick={onRefresh}
                            isRefreshing={isFetching && !isLoading}
                        />
                        <Button onClick={onCreate} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Tambah Jadwal
                        </Button>
                    </div>
                }
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Jadwal Ketersediaan</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus jadwal ketersediaan ini? Tindakan ini tidak dapat dibatalkan.
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
                <AvailabilityFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
