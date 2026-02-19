import type { InternshipProposalItem } from '@/services/internship.service';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Check, X, Edit } from 'lucide-react';
import { getInternshipStatusBadge } from './status';

interface StudentColumnProps {
    onViewProposalDoc: (item: InternshipProposalItem) => void;
    onViewAppLetterDoc: (item: InternshipProposalItem) => void;
    onViewDetail: (item: InternshipProposalItem) => void;
    onRespond: (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => void;
    onUploadResponse?: (item: InternshipProposalItem) => void;
    onViewResponseDoc?: (item: InternshipProposalItem) => void;
    onViewAssignmentDoc?: (item: InternshipProposalItem) => void;
}

/**
 * Columns for Student Registration/Proposal list
 */
export const getInternshipProposalColumns = ({
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewDetail,
    onRespond,
}: StudentColumnProps): Column<InternshipProposalItem>[] => [
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
            render: (item) => getInternshipStatusBadge(item.status),
            className: 'text-center w-[120px]',
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

/**
 * Columns for Student Assignment (Penugasan) list
 */
export const getStudentAssignmentColumns = ({
    onViewResponseDoc,
    onViewAssignmentDoc,
    onUploadResponse,
    onViewDetail,
}: Partial<StudentColumnProps>): Column<InternshipProposalItem>[] => [
        {
            key: 'namaCompany',
            header: 'Perusahaan',
            accessor: 'namaCompany',
            className: 'text-sm font-medium',
        },
        {
            key: 'responseDoc',
            header: 'Surat Balasan',
            render: (item) => (
                <div className="flex justify-center">
                    {item.dokumenSuratBalasan && item.responseStatus !== 'REJECTED_BY_SEKDEP' ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onViewResponseDoc?.(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-2 px-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                            onClick={() => onUploadResponse?.(item)}
                        >
                            <Edit className="h-4 w-4" />
                            <span className="text-xs">{item.dokumenSuratBalasan ? 'Upload Ulang' : 'Upload'}</span>
                        </Button>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'assignmentDoc',
            header: 'Surat Tugas',
            render: (item) => (
                <div className="flex justify-center">
                    {item.dokumenSuratTugas ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onViewAssignmentDoc?.(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => {
                const hasAssignment = !!item.dokumenSuratTugas;
                const hasResponse = !!item.dokumenSuratBalasan;


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
                    return getInternshipStatusBadge(item.responseStatus || 'PENDING');
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
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Detail Proposal"
                        onClick={() => onViewDetail?.(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];
