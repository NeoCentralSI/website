import { useState, useMemo } from 'react';
import { Pencil, Trash2, Plus } from 'lucide-react';
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
import type {
    LecturerAvailability,
    UpdateAvailabilityPayload,
    GetLecturerAvailabilitiesParams,
} from '@/services/master-data/lecturer-availability.service';
import { LecturerAvailabilityFormDialog } from '@/components/master-data/lecturer-availability/LecturerAvailabilityFormDialog';

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

interface LecturerAvailabilityTableProps {
    data: LecturerAvailability[];
    total: number;
    isLoading: boolean;
    isFetching: boolean;
    params: GetLecturerAvailabilitiesParams;
    onParamsChange: (p: GetLecturerAvailabilitiesParams) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, data: UpdateAvailabilityPayload) => Promise<unknown>;
    onCreate: () => void;
    onRefresh: () => void;
    isDeleting: boolean;
}

export function LecturerAvailabilityTable({
    data,
    total,
    isLoading,
    isFetching,
    params,
    onParamsChange,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    isDeleting,
}: LecturerAvailabilityTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editItem, setEditItem] = useState<LecturerAvailability | null>(null);

    const page = params.page ?? 1;
    const limit = params.limit ?? 10;

    const handleConfirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const columns = useMemo<Column<LecturerAvailability>[]>(
        () => [
            {
                key: 'no',
                header: 'No',
                width: 50,
                className: 'text-center',
                render: (_row, index) => (
                    <span className="text-sm text-muted-foreground">
                        {(page - 1) * limit + index + 1}
                    </span>
                ),
            },
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
                filter: {
                    type: 'select',
                    value: params.status ?? 'all',
                    onChange: (value: string) => {
                        onParamsChange({
                            ...params,
                            status: value as GetLecturerAvailabilitiesParams['status'],
                            page: 1,
                        });
                    },
                    options: [
                        { label: 'Semua', value: 'all' },
                        { label: 'Aktif', value: 'active' },
                        { label: 'Tidak Aktif', value: 'inactive' },
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
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(item.id)}
                            disabled={isDeleting}
                            title="Hapus"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [isDeleting, limit, onParamsChange, page, params.status]
    );

    return (
        <>
            <CustomTable
                columns={columns}
                data={data}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={total}
                page={page}
                pageSize={limit}
                onPageChange={(p) => onParamsChange({ ...params, page: p })}
                onPageSizeChange={(s) => onParamsChange({ ...params, limit: s, page: 1 })}
                searchValue={params.search ?? ''}
                onSearchChange={(s) => onParamsChange({ ...params, search: s, page: 1 })}
                enableColumnFilters
                emptyText="Belum ada jadwal ketersediaan"
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <RefreshButton
                            onClick={onRefresh}
                            isRefreshing={isFetching && !isLoading}
                        />
                    </div>
                }
            />
            <p className="text-xs text-muted-foreground -mt-2">
                Pencarian memfilter menurut nama hari (contoh: Senin, Rabu).
            </p>

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
                <LecturerAvailabilityFormDialog
                    open={!!editItem}
                    onOpenChange={(open) => !open && setEditItem(null)}
                    editData={editItem}
                    onSubmit={onUpdate}
                />
            )}
        </>
    );
}
