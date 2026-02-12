import type { InternshipProposalItem, SekdepInternshipProposalItem, CompanyStatsItem } from '@/services/internship.service';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Check, X, Edit, Trash2 } from 'lucide-react';

interface ColumnProps {
    onViewProposalDoc: (item: InternshipProposalItem) => void;
    onViewAppLetterDoc: (item: InternshipProposalItem) => void;
    onViewDetail: (item: InternshipProposalItem) => void;
    onRespond: (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => void;
}

export const getInternshipProposalColumns = ({
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewDetail,
    onRespond,
}: ColumnProps): Column<InternshipProposalItem>[] => [
        {
            key: 'nama',
            header: 'Nama',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight">{item.nama}</span>
                    <span className="text-xs text-muted-foreground">{item.nim}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                        {item.koordinatorAtauMember}
                    </span>
                </div>
            ),
        },
        {
            key: 'namaCompany',
            header: 'Perusahaan',
            accessor: 'namaCompany',
            className: 'text-sm',
        },
        {
            key: 'proposalDoc',
            header: 'Proposal',
            render: (item) => (
                <div className="flex justify-center">
                    {item.dokumenProposal ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onViewProposalDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'appLetterDoc',
            header: 'Permohonan',
            render: (item) => (
                <div className="flex justify-center">
                    {item.dokumenSuratPermohonan ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onViewAppLetterDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => {
                const status = item.status || 'PENDING';
                let variant: 'outline' | 'default' | 'secondary' | 'destructive' | 'success' = 'outline';

                if (status === 'APPROVED_BY_SEKDEP') variant = 'success';
                if (status === 'REJECTED_BY_SEKDEP') variant = 'destructive';
                if (status === 'PENDING') variant = 'secondary';

                return (
                    <div className="flex items-center justify-center">
                        <Badge variant={variant as any} className="whitespace-nowrap text-[10px] px-2 py-0">
                            {status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                );
            },
            className: 'text-center',
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    {item.koordinatorAtauMember === 'Member' && item.memberStatus === 'PENDING' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Terima Undangan"
                                onClick={() => onRespond(item, 'ACCEPTED')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Tolak Undangan"
                                onClick={() => onRespond(item, 'REJECTED')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Detail Proposal"
                        onClick={() => onViewDetail(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];

interface SekdepColumnProps {
    onViewDetail: (item: SekdepInternshipProposalItem) => void;
}

export const getSekdepInternshipProposalColumns = ({
    onViewDetail,
}: SekdepColumnProps): Column<SekdepInternshipProposalItem>[] => [
        {
            key: 'koordinator',
            header: 'Koordinator',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'namaCompany',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm',
        },
        {
            key: 'memberCount',
            header: 'Anggota',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-sm">{item.memberCount} Mahasiswa</span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => {
                const status = item.status || 'PENDING';
                let variant: 'outline' | 'default' | 'secondary' | 'destructive' | 'success' = 'outline';

                if (status === 'APPROVED_BY_SEKDEP') variant = 'success';
                if (status === 'REJECTED_BY_SEKDEP') variant = 'destructive';
                if (status === 'PENDING') variant = 'secondary';

                return (
                    <div className="flex items-center justify-center">
                        <Badge variant={variant as any} className="whitespace-nowrap text-[10px] px-2 py-0">
                            {status.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                );
            },
            className: 'text-center',
        },
        {
            key: 'createdAt',
            header: 'Tanggal Diajukan',
            render: (item) => (
                <div className="flex justify-center">
                    <span className="text-sm">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        }) : '-'}
                    </span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Detail Proposal"
                        onClick={() => onViewDetail(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];

interface CompanyColumnProps {
    onEdit: (item: CompanyStatsItem) => void;
    onDetail: (item: CompanyStatsItem) => void;
    onDelete: (item: CompanyStatsItem) => void;
}

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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title="Edit"
                        onClick={() => onEdit(item)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        title="Hapus"
                        onClick={() => onDelete(item)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];
