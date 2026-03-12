import type { CompanyStatsItem } from '@/services/internship.service';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';

interface CompanyColumnProps {
    onEdit?: (item: CompanyStatsItem) => void;
    onDetail: (item: CompanyStatsItem) => void;
    onDelete?: (item: CompanyStatsItem) => void;
}

/**
 * Columns for Company Management (Admin/Sekdep)
 */
export const getCompanyStatsColumns = ({
    onEdit,
    onDetail,
    onDelete,
}: CompanyColumnProps): Column<CompanyStatsItem>[] => [
        {
            key: 'no',
            header: 'No',
            render: (_, index) => (
                <span className="text-sm">{(index ?? 0) + 1}</span>
            ),
            className: 'w-[50px] text-center',
        },
        {
            key: 'companyName',
            header: 'Nama Perusahaan',
            render: (item) => (
                <span className="font-medium text-sm leading-tight text-wrap">{item.companyName}</span>
            ),
            sortable: true,
        },
        {
            key: 'address',
            header: 'Alamat Perusahaan',
            render: (item) => (
                <span className="text-xs text-muted-foreground line-clamp-2">{item.address || '-'}</span>
            ),
            className: 'max-w-[250px]',
        },
        {
            key: 'internCount',
            header: 'Jumlah Mahasiswa Magang',
            render: (item) => (
                <div className="flex items-center gap-1 justify-center">
                    <Badge variant="secondary" className="px-2 py-0 text-[10px]">
                        {item.internCount || 0} Mahasiswa
                    </Badge>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status Perusahaan',
            render: (item) => {
                const status = (item.status || 'save').toLowerCase();
                const variant = status === 'blacklist' ? 'destructive' : 'success';
                return (
                    <div className="flex items-center justify-center">
                        <Badge variant={variant as any} className="whitespace-nowrap text-[10px] px-2 py-0 uppercase">
                            {status}
                        </Badge>
                    </div>
                );
            },
            className: 'text-center',
            sortable: true,
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center gap-1 justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Detail"
                        onClick={() => onDetail(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit"
                            onClick={() => onEdit(item)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Hapus"
                            onClick={() => onDelete(item)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            ),
            className: 'text-center',
        },
    ];
