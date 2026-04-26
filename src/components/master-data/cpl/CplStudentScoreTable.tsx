import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Spinner } from '@/components/ui/spinner';
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
import type { CplStudentScore, CplStudentScoreStatus } from '@/services/master-data/cpl.service';

interface CplStudentScoreTableProps {
    data: CplStudentScore[];
    isLoading: boolean;
    isFetching: boolean;
    filters: {
        search?: string;
        source?: 'SIA' | 'MANUAL';
        status?: CplStudentScoreStatus;
    };
    onFiltersChange: (next: {
        search?: string;
        source?: 'SIA' | 'MANUAL';
        status?: CplStudentScoreStatus;
    }) => void;
    onRefresh: () => void;
    onCreate: () => void;
    onEdit: (item: CplStudentScore) => void;
    onDelete: (item: CplStudentScore) => void;
    isDeleting: boolean;
    onImportClick: () => void;
    onExport: () => void;
    isExporting: boolean;
}

export function CplStudentScoreTable({
    data,
    isLoading,
    isFetching,
    filters,
    onFiltersChange,
    onRefresh,
    onCreate,
    onEdit,
    onDelete,
    isDeleting,
    onImportClick,
    onExport,
    isExporting,
}: CplStudentScoreTableProps) {
    const [deleteTarget, setDeleteTarget] = useState<CplStudentScore | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const statusLabel: Record<string, string> = {
        calculated: 'Dihitung',
        verified: 'Diverifikasi',
        finalized: 'Final',
    };

    const pagedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [data, page, pageSize]);

    const columns = useMemo<Column<CplStudentScore>[]>(
        () => [
            {
                key: 'no',
                header: 'No',
                width: 60,
                className: 'text-center',
                render: (_item, index) => <span>{(page - 1) * pageSize + index + 1}</span>,
            },
            {
                key: 'student',
                header: 'Nama Mahasiswa',
                width: 200,
                render: (item) => <div className="font-medium">{item.student?.fullName ?? '-'}</div>,
            },
            {
                key: 'nim',
                header: 'NIM',
                width: 140,
                render: (item) => <div className="text-muted-foreground">{item.student?.identityNumber ?? '-'}</div>,
            },
            {
                key: 'score',
                header: 'Skor',
                width: 90,
                className: 'text-center',
                render: (item) => item.score,
            },
            {
                key: 'result',
                header: 'Hasil',
                width: 120,
                render: (item) => (
                    <Badge
                        variant="outline"
                        className={
                            item.result === 'Lulus'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                        }
                    >
                        {item.result}
                    </Badge>
                ),
            },
            {
                key: 'source',
                header: 'Sumber',
                width: 110,
                filter: {
                    type: 'select',
                    value: filters.source ?? 'ALL',
                    onChange: (value: string) =>
                        onFiltersChange({
                            ...filters,
                            source: value === 'ALL' ? undefined : (value as 'SIA' | 'MANUAL'),
                        }),
                    options: [
                        { label: 'Semua', value: 'ALL' },
                        { label: 'SIA', value: 'SIA' },
                        { label: 'Manual', value: 'MANUAL' },
                    ],
                },
                render: (item) => (
                    <Badge
                        variant="outline"
                        className={
                            String(item.source).toUpperCase() === 'SIA'
                                ? 'bg-amber-100 text-amber-700 border-amber-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                        }
                    >
                        {item.sourceLabel}
                    </Badge>
                ),
            },
            {
                key: 'status',
                header: 'Status',
                width: 120,
                filter: {
                    type: 'select',
                    value: filters.status ?? 'ALL',
                    onChange: (value: string) =>
                        onFiltersChange({
                            ...filters,
                            status: value === 'ALL' ? undefined : (value as CplStudentScoreStatus),
                        }),
                    options: [
                        { label: 'Semua', value: 'ALL' },
                        { label: 'Dihitung', value: 'calculated' },
                        { label: 'Diverifikasi', value: 'verified' },
                        { label: 'Final', value: 'finalized' },
                    ],
                },
                render: (item) => <Badge variant="secondary">{statusLabel[item.status] ?? item.status}</Badge>,
            },
            {
                key: 'actions',
                header: 'Aksi',
                width: 100,
                className: 'text-right',
                render: (item) => {
                    const isManual = String(item.source).toUpperCase() === 'MANUAL';
                    return (
                        <div className="flex justify-end gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => onEdit(item)}
                                disabled={!isManual}
                                title={isManual ? 'Ubah' : 'Data SIA tidak dapat diubah'}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteTarget(item)}
                                disabled={!isManual || isDeleting}
                                title={isManual ? 'Hapus' : 'Data SIA tidak dapat dihapus'}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    );
                },
            },
        ],
        [filters, isDeleting, onEdit, onFiltersChange, page, pageSize]
    );

    return (
        <>
            <CustomTable
                columns={columns}
                data={pagedData}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={data.length}
                page={page}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                searchValue={filters.search ?? ''}
                onSearchChange={(value) => {
                    onFiltersChange({ ...filters, search: value });
                    setPage(1);
                }}
                enableColumnFilters
                emptyText="Belum ada data nilai mahasiswa pada CPL ini"
                rowKey={(item) => `${item.cplId}-${item.studentId}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onImportClick}>
                            <Upload className="mr-2 h-4 w-4" /> Import Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={onExport} disabled={isExporting}>
                            {isExporting ? <Spinner className="mr-2 h-4 w-4" /> : <Download className="mr-2 h-4 w-4" />} Export Excel
                        </Button>
                        <Button size="sm" onClick={onCreate}>
                            <Plus className="mr-2 h-4 w-4" /> Tambah
                        </Button>
                        <RefreshButton onClick={onRefresh} isRefreshing={isFetching && !isLoading} />
                    </div>
                }
            />

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Nilai CPL Mahasiswa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Nilai manual akan dihapus permanen dan tidak dapat dikembalikan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteTarget) onDelete(deleteTarget);
                                setDeleteTarget(null);
                            }}
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
        </>
    );
}
