import { useMemo } from 'react';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Eye, Plus, Trash2, BookOpen } from 'lucide-react';
import type { Curriculum, GetCurriculumsParams } from '@/services/master-data/curriculum.service';
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
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';

interface CurriculumTableProps {
    data: Curriculum[];
    total: number;
    isLoading: boolean;
    isFetching: boolean;
    onDelete: (id: string) => void;
    onUpdate: (id: string) => void;
    onCreate: () => void;
    onRefresh: () => void;
    onDetail: (id: string) => void;
    isDeleting: boolean;
    isManagement: boolean;
    params: GetCurriculumsParams;
    onParamsChange: (params: GetCurriculumsParams) => void;
}

export function CurriculumTable({
    data,
    total,
    isLoading,
    isFetching,
    onDelete,
    onUpdate,
    onCreate,
    onRefresh,
    onDetail,
    isDeleting,
    isManagement,
    params,
    onParamsChange,
}: CurriculumTableProps) {
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleConfirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    const columns = useMemo<Column<Curriculum>[]>(() => [
        {
            key: 'no',
            header: 'No',
            width: 50,
            className: 'text-center',
            render: (_item, index) => (
                <span className="text-sm text-muted-foreground">
                    {((params.page || 1) - 1) * (params.limit || 10) + index + 1}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Nama Kurikulum',
            render: (item) => (
                <span className="font-medium">{item.name}</span>
            ),
        },
        {
            key: 'years',
            header: 'Tahun Berlaku',
            render: (item) => (
                <span>{item.startYear} - {item.endYear || 'Sekarang'}</span>
            ),
        },
        {
            key: 'cplCount',
            header: 'Jumlah CPL',
            width: 120,
            className: 'text-center',
            render: (item) => (
                item.cplCount > 0 ? (
                    <Badge variant="outline" className="gap-1">
                        <BookOpen className="h-3 w-3" />
                        {item.cplCount}
                    </Badge>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )
            ),
        },
        {
            key: 'status',
            header: 'Status',
            width: 100,
            render: (item) => {
                const currentYear = new Date().getFullYear();
                const isActive = currentYear >= item.startYear && (!item.endYear || currentYear <= item.endYear);
                return (
                    <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className={
                            isActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                        }
                    >
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                );
            },
        },
        {
            key: 'actions',
            header: 'Aksi',
            width: 140,
            className: 'text-right',
            render: (item) => (
                <div className="flex items-center justify-end gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => onDetail(item.id)}
                        title="Detail CPL Kurikulum"
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {isManagement && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => onUpdate(item.id)}
                            title="Edit"
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                    )}
                    {isManagement && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteId(item.id)}
                            disabled={isDeleting || item.cplCount > 0}
                            title={item.cplCount > 0 ? 'Kurikulum dengan CPL tidak dapat dihapus' : 'Hapus'}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [isDeleting, params, isManagement, onDetail, onUpdate]);

    return (
        <>
            <CustomTable
                columns={columns}
                data={data}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={total}
                page={params.page || 1}
                pageSize={params.limit || 10}
                onPageChange={(p) => onParamsChange({ ...params, page: p })}
                onPageSizeChange={(s) => onParamsChange({ ...params, limit: s })}
                searchValue={params.search}
                onSearchChange={(s) => onParamsChange({ ...params, search: s, page: 1 })}
                emptyText="Data kurikulum tidak ditemukan"
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

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kurikulum?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan, data kurikulum akan dihapus permanen
                            Kurikulum yang sudah memiliki CPL tidak dapat dihapus
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
                                    <Spinner className="mr-2 h-4 w-4" /> Menghapus...
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
