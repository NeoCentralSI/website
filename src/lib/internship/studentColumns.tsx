import type { InternshipProposalItem } from '@/services/internship';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Check, X, Edit, Trash2, Upload } from 'lucide-react';
import { getInternshipStatusBadge } from './status';

interface StudentRegistrationColumnProps {
    onViewDetail: (item: InternshipProposalItem) => void;
    onViewProposalDoc: (item: InternshipProposalItem) => void;
    onViewAppLetterDoc: (item: InternshipProposalItem) => void;
    onViewResponseDoc: (item: InternshipProposalItem) => void;
    onViewAssignmentDoc: (item: InternshipProposalItem) => void;
    onRespondInvitation: (item: InternshipProposalItem, response: 'ACCEPTED' | 'REJECTED') => void;
    onUploadResponse: (item: InternshipProposalItem) => void;
    onEditProposal: (item: InternshipProposalItem) => void;
    onDeleteProposal: (item: InternshipProposalItem) => void;
}

/**
 * Columns for Student Registration Management (Pendaftaran & Penugasan merged)
 */
export const getStudentRegistrationColumns = ({
    onViewDetail,
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewResponseDoc,
    onViewAssignmentDoc,
    onRespondInvitation,
    onUploadResponse,
    onEditProposal,
    onDeleteProposal,
}: StudentRegistrationColumnProps): Column<InternshipProposalItem>[] => [
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
            className: 'text-sm w-44 min-w-[150px] max-w-[200px] whitespace-normal break-words',
        },
        {
            key: 'tahunAjaran',
            header: 'Tahun Ajaran',
            accessor: 'academicYearName',
            className: 'text-sm text-center',
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
                <div className="flex flex-col items-center justify-center gap-1">
                    {item.dokumenSuratPermohonan ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 gap-2 px-2 ${item.isSigned ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'}`}
                                onClick={() => onViewAppLetterDoc(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">Lihat</span>
                            </Button>
                            {!item.isSigned && (
                                <Badge variant="outline" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-200 px-1 py-0 font-medium">
                                    BELUM TTD
                                </Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'responseDoc',
            header: 'Surat Balasan',
            render: (item) => {
                const canUpload = item.status === 'APPROVED_PROPOSAL' && item.koordinatorAtauMember === 'Koordinator' && !item.dokumenSuratBalasan && !!item.dokumenSuratPermohonan && item.isSigned;
                const canReupload = (item.status === 'REJECTED_PROPOSAL' || item.status === 'WAITING_FOR_VERIFICATION') && !!item.dokumenSuratBalasan && item.koordinatorAtauMember === 'Koordinator';

                return (
                    <div className="flex justify-center flex-col items-center gap-1">
                        {item.dokumenSuratBalasan && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => onViewResponseDoc(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">Lihat</span>
                            </Button>
                        )}

                        {canUpload && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 rounded-full"
                                onClick={() => onUploadResponse(item)}
                            >
                                <Upload className="h-3 w-3" />
                                <span className="text-[10px] font-medium leading-none">Upload</span>
                            </Button>
                        )}

                        {canReupload && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 rounded-full mt-1"
                                onClick={() => onUploadResponse(item)}
                            >
                                <Edit className="h-3 w-3" />
                                <span className="text-[10px] font-medium leading-none">Upload Ulang</span>
                            </Button>
                        )}

                        {!item.dokumenSuratBalasan && !canUpload && !canReupload && (
                            <span className="text-xs text-muted-foreground">-</span>
                        )}
                    </div>
                );
            },
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
                            onClick={() => onViewAssignmentDoc(item)}
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

                if (hasAssignment) {
                    return (
                        <div className="flex items-center justify-center">
                            <Badge variant="success" className="whitespace-nowrap text-[10px] px-2 py-0 h-5">
                                COMPLETED
                            </Badge>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center justify-center">
                        {getInternshipStatusBadge(item.status)}
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
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-full"
                                title="Terima Undangan"
                                onClick={() => onRespondInvitation(item, 'ACCEPTED')}
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                                title="Tolak Undangan"
                                onClick={() => onRespondInvitation(item, 'REJECTED')}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    {(item.status === 'PENDING' || item.status === 'REJECTED_PROPOSAL') && !item.dokumenSuratBalasan && item.koordinatorAtauMember === 'Koordinator' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-full"
                            title="Edit & Ajukan Kembali"
                            onClick={() => onEditProposal(item)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {item.status === 'PENDING' && !item.dokumenSuratBalasan && item.koordinatorAtauMember === 'Koordinator' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                            title="Hapus Proposal"
                            onClick={() => onDeleteProposal(item)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
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
