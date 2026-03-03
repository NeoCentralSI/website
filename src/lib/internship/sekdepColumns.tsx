import type { SekdepInternshipProposalItem, SekdepAssignmentItem } from '@/services/internship.service';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Check, X } from 'lucide-react';
import { getInternshipStatusBadge } from './status';

interface SekdepProposalColumnProps {
    onViewProposalDoc: (item: SekdepInternshipProposalItem) => void;
    onViewAppLetterDoc: (item: SekdepInternshipProposalItem) => void;
    onViewDetail: (item: SekdepInternshipProposalItem) => void;
    onRespond: (item: SekdepInternshipProposalItem, response: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP') => void;
}

/**
 * Columns for Sekdep Proposal Management (Pendaftaran)
 */
export const getSekdepInternshipProposalColumns = ({
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewDetail,
    onRespond,
}: SekdepProposalColumnProps): Column<SekdepInternshipProposalItem>[] => [
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
            render: (item) => getInternshipStatusBadge(item.status),
            className: 'text-center',
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    {item.status === 'PENDING' && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Setujui"
                                onClick={() => onRespond(item, 'APPROVED_BY_SEKDEP')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Tolak"
                                onClick={() => onRespond(item, 'REJECTED_BY_SEKDEP')}
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

/**
 * Columns for Sekdep Assignment Verification (Penugasan)
 */
export const getSekdepAssignmentColumns = ({
    onViewResponseDoc,
    onVerify,
    onViewDetail,
}: {
    onViewResponseDoc: (item: SekdepAssignmentItem) => void;
    onViewDetail: (item: SekdepAssignmentItem) => void;
    onVerify: (item: SekdepAssignmentItem, status: 'APPROVED_BY_SEKDEP' | 'REJECTED_BY_SEKDEP' | 'REJECTED_BY_COMPANY') => void;
}) => {
    return [
        {
            key: 'coordinator',
            header: 'Koordinator',
            render: (item: SekdepAssignmentItem) => (
                <div className="flex flex-col py-1 text-sm">
                    <span className="font-medium text-foreground">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'company',
            header: 'Perusahaan',
            render: (item: SekdepAssignmentItem) => (
                <div className="max-w-[200px] truncate text-sm" title={item.companyName}>
                    {item.companyName}
                </div>
            ),
        },
        {
            key: 'members',
            header: 'Anggota',
            render: (item: SekdepAssignmentItem) => (
                <div className="flex items-center justify-center text-sm">{item.memberCount} Mahasiswa</div>
            ),
            className: 'text-center',
        },
        {
            key: 'responseDoc',
            header: 'Surat Balasan',
            render: (item: SekdepAssignmentItem) => {
                if (!item.dokumenSuratBalasan) return <div className="flex justify-center"><span className="text-xs text-muted-foreground italic">Belum diunggah</span></div>;
                return (
                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => onViewResponseDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            Lihat
                        </Button>
                    </div>
                );
            },
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status Verifikasi',
            render: (item: SekdepAssignmentItem) => {
                const hasAssignment = !!item.dokumenSuratTugas;
                const hasResponse = !!item.dokumenSuratBalasan;
                const respStatus = (item.responseStatus as string) || 'PENDING';

                if (hasAssignment) {
                    return (
                        <div className="flex items-center justify-center">
                            <Badge variant="success" className="whitespace-nowrap text-[10px] px-2 py-0">
                                COMPLETED
                            </Badge>
                        </div>
                    );
                }

                if (hasResponse) {
                    return getInternshipStatusBadge(respStatus);
                }

                return (
                    <div className="flex items-center justify-center">
                        <Badge variant="secondary" className="whitespace-nowrap text-[10px] px-2 py-0">
                            MENUNGGU SURAT BALASAN
                        </Badge>
                    </div>
                );
            },
            className: 'text-center',
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item: SekdepAssignmentItem) => {
                return (
                    <div className="flex justify-center gap-1">
                        {!item.isAssignmentSigned && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700 px-2"
                                    onClick={() => onVerify(item, 'APPROVED_BY_SEKDEP')}
                                    disabled={item.responseStatus === 'APPROVED_BY_SEKDEP'}
                                    title="Verifikasi (Terima)"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-destructive text-destructive hover:bg-destructive/5 px-2"
                                    onClick={() => onVerify(item, 'REJECTED_BY_SEKDEP')}
                                    disabled={item.responseStatus === 'REJECTED_BY_SEKDEP'}
                                    title="Tolak (Dokumen Invalid)"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary px-0"
                            onClick={() => onViewDetail(item)}
                            title="Detail"
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
            className: 'text-center',
        },
    ] as Column<SekdepAssignmentItem>[];
};
