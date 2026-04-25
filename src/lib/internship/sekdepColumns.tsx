import type { SekdepRegistrationItem, InternshipListItem } from '@/services/internship';
import type { Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getInternshipStatusBadge } from './status';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SekdepProposalColumnProps {
    onViewDetail: (item: SekdepRegistrationItem) => void;
    onViewProposalDoc: (item: SekdepRegistrationItem) => void;
    onViewAppLetterDoc: (item: SekdepRegistrationItem) => void;
    onViewResponseDoc?: (item: SekdepRegistrationItem) => void;
    onViewAssignmentDoc?: (item: SekdepRegistrationItem) => void;
    onRespondProposal: (item: SekdepRegistrationItem, response: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL') => void;
}

/**
 * Columns for Sekdep Proposal Verification (Tab 1)
 */
export const getSekdepProposalColumns = ({
    onViewProposalDoc,
    onViewAppLetterDoc,
    onViewResponseDoc,
    onViewAssignmentDoc,
    onViewDetail,
    onRespondProposal,
}: SekdepProposalColumnProps): Column<SekdepRegistrationItem>[] => [
        {
            key: 'koordinator',
            header: 'Koordinator',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight text-foreground">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'namaCompany',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm w-44 min-w-[150px] max-w-[200px] whitespace-normal break-words',
            sortable: true,
        },

        {
            key: 'tahunAjaran',
            header: 'Thn Ajaran',
            accessor: 'academicYearName',
            className: 'text-sm text-center',
            sortable: true,
        },
        {
            key: 'memberCount',
            header: 'Anggota',
            render: (item) => (
                <div className="flex items-center justify-center gap-1 text-sm">
                    <span>{item.memberCount} Mahasiswa</span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'proposalDoc',
            header: 'Proposal',
            render: (item) => (
                <div className="flex flex-col items-center justify-center gap-1">
                    {item.dokumenProposal ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => onViewProposalDoc(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-medium">Lihat</span>
                            </Button>
                            {item.proposedStartDate && item.proposedEndDate && (
                                <div className="flex flex-col text-[9px] leading-tight text-muted-foreground">
                                    <span>{format(new Date(item.proposedStartDate), 'dd MMM yyyy', { locale: id })}</span>
                                    <span className="italic">s/d</span>
                                    <span>{format(new Date(item.proposedEndDate), 'dd MMM yyyy', { locale: id })}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
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
                                <span className="text-xs font-medium">Lihat</span>
                            </Button>
                            {item.startDatePlanned && item.endDatePlanned && (
                                <div className="flex flex-col text-[9px] leading-tight text-muted-foreground mt-0.5">
                                    <span>{format(new Date(item.startDatePlanned), 'dd MMM yyyy', { locale: id })}</span>
                                    <span className="italic">s/d</span>
                                    <span>{format(new Date(item.endDatePlanned), 'dd MMM yyyy', { locale: id })}</span>
                                </div>
                            )}
                            {!item.isSigned && (
                                <Badge variant="outline" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-200 px-1 py-0 font-medium">
                                    BELUM TTD
                                </Badge>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'responseDoc',
            header: 'Balasan',
            render: (item) => (
                <div className="flex flex-col items-center justify-center gap-1">
                    {item.dokumenSuratBalasan ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => onViewResponseDoc?.(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-medium">Lihat</span>
                            </Button>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">-</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'assignLetterDoc',
            header: 'Surat Tugas',
            render: (item) => (
                <div className="flex flex-col items-center justify-center gap-1">
                    {item.dokumenSuratTugas ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                onClick={() => onViewAssignmentDoc?.(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-medium">Lihat</span>
                            </Button>
                            {item.startDateActual && item.endDateActual && (
                                <div className="flex flex-col text-[9px] leading-tight text-muted-foreground mt-0.5">
                                    <span>{format(new Date(item.startDateActual), 'dd MMM yyyy', { locale: id })}</span>
                                    <span className="italic">s/d</span>
                                    <span>{format(new Date(item.endDateActual), 'dd MMM yyyy', { locale: id })}</span>
                                </div>
                            )}
                            {!item.isAssignmentSigned && (
                                <Badge variant="outline" className="text-[9px] h-4 bg-amber-50 text-amber-600 border-amber-200 px-1 py-0 font-medium">BELUM TTD</Badge>
                            )}
                        </>
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
            render: (item) => (
                <div className="flex items-center justify-center scale-90">
                    {item.isSigned ? (
                        <Badge variant="success" className="whitespace-nowrap text-[10px] px-2 py-0">SELESAI</Badge>
                    ) : (
                        getInternshipStatusBadge(item.status)
                    )}
                </div>
            ),
            className: 'text-center',
            sortable: true,
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => {
                const canRespondProposal = item.status === 'PENDING';

                return (
                    <div className="flex items-center justify-center gap-1">
                        {canRespondProposal && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Setujui Proposal"
                                    onClick={() => onRespondProposal(item, 'APPROVED_PROPOSAL')}
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Tolak Proposal"
                                    onClick={() => onRespondProposal(item, 'REJECTED_PROPOSAL')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Detail"
                            onClick={() => onViewDetail(item)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
            className: 'text-center',
        },
    ];

interface SekdepResponseColumnProps {
    onViewDetail: (item: SekdepRegistrationItem) => void;
    onViewAppLetterDoc: (item: SekdepRegistrationItem) => void;
    onViewResponseDoc: (item: SekdepRegistrationItem) => void;
    onViewAssignmentDoc: (item: SekdepRegistrationItem) => void;
    onVerifyResponse: (item: SekdepRegistrationItem, status: 'APPROVED_PROPOSAL' | 'REJECTED_PROPOSAL' | 'REJECTED_BY_COMPANY') => void;
}

/**
 * Columns for Sekdep Response Letter Verification (Tab 2)
 */
export const getSekdepResponseColumns = ({
    onViewResponseDoc,
    onViewAssignmentDoc,
    onViewDetail,
    onVerifyResponse,
}: SekdepResponseColumnProps): Column<SekdepRegistrationItem>[] => [
        {
            key: 'koordinator',
            header: 'Koordinator',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight text-foreground">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'namaCompany',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm w-44 min-w-[150px] max-w-[200px] whitespace-normal break-words',
            sortable: true,
        },

        {
            key: 'tahunAjaran',
            header: 'Thn Ajaran',
            accessor: 'academicYearName',
            className: 'text-sm text-center',
            sortable: true,
        },
        {
            key: 'memberCount',
            header: 'Anggota',
            render: (item) => (
                <div className="flex items-center justify-center gap-1 text-sm text-foreground whitespace-nowrap">
                    <span>{item.acceptedMemberCount} Mahasiswa</span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'responseDoc',
            header: 'Surat Balasan',
            render: (item) => (
                <div className="flex flex-col items-center justify-center gap-1">
                    {item.dokumenSuratBalasan ? (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => onViewResponseDoc(item)}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs font-medium">Lihat</span>
                            </Button>
                            {item.startDateActual && item.endDateActual && (
                                <div className="flex flex-col text-[9px] leading-tight text-muted-foreground mt-0.5">
                                    <span>{format(new Date(item.startDateActual), 'dd MMM yyyy', { locale: id })}</span>
                                    <span className="italic">s/d</span>
                                    <span>{format(new Date(item.endDateActual), 'dd MMM yyyy', { locale: id })}</span>
                                </div>
                            )}
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Unggah</span>
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
                            className="h-8 gap-2 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => onViewAssignmentDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium">Lihat</span>
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
            render: (item) => (
                <div className="flex items-center justify-center scale-90">
                    {item.isAssignmentSigned ? (
                        <Badge variant="success" className="whitespace-nowrap text-[10px] px-2 py-0">SELESAI</Badge>
                    ) : (
                        getInternshipStatusBadge(item.status)
                    )}
                </div>
            ),
            className: 'text-center',
            sortable: true,
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => {
                const canVerifyResponse = item.status === 'WAITING_FOR_VERIFICATION' && item.dokumenSuratBalasan && !item.isAssignmentSigned;

                return (
                    <div className="flex items-center justify-center gap-1">
                        {canVerifyResponse && (
                            <>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-700 px-2"
                                    onClick={() => onVerifyResponse(item, 'APPROVED_PROPOSAL')}
                                    title="Setujui Balasan"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 border-destructive text-destructive hover:bg-destructive/5 px-2"
                                    onClick={() => onVerifyResponse(item, 'REJECTED_PROPOSAL')}
                                    title="Tolak Balasan (Dokumen Invalid)"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="Detail"
                            onClick={() => onViewDetail(item)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                );
            },
            className: 'text-center',
        },
    ];

interface SekdepInternshipListColumnProps {
    onViewDetail: (item: InternshipListItem) => void;
    onViewAssignmentDoc?: (item: InternshipListItem) => void;
}

/**
 * Columns for Sekdep Internship List (Tab 3)
 */
export const getSekdepInternshipListColumns = ({
    onViewDetail,
    onViewAssignmentDoc,
}: SekdepInternshipListColumnProps): Column<InternshipListItem>[] => [
        {
            key: 'nim',
            header: 'NIM',
            accessor: 'nim',
            className: 'text-sm font-medium',
            sortable: true,
        },
        {
            key: 'name',
            header: 'Nama Mahasiswa',
            accessor: 'name',
            className: 'text-sm min-w-[150px]',
            sortable: true,
        },
        {
            key: 'companyName',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm min-w-[150px] whitespace-normal',
            sortable: true,
        },
        {
            key: 'academicYear',
            header: 'Thn Ajaran',
            accessor: 'academicYearName',
            className: 'text-sm text-center',
            sortable: true,
        },
        {
            key: 'supervisor',
            header: 'Dosen Pembimbing',
            accessor: 'supervisorName',
            className: 'text-sm',
            sortable: true,
        },
        {
            key: 'fieldSupervisor',
            header: 'Pemb. Lapangan',
            accessor: 'fieldSupervisorName',
            className: 'text-sm',
        },
        {
            key: 'finalNilai',
            header: 'Nilai Akhir',
            render: (item) => (
                <div className="flex flex-col items-center justify-center">
                    {item.finalScore !== null && item.finalScore !== undefined ? (
                        <>
                            <span className="text-sm font-bold text-slate-900">{item.finalScore}</span>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-50 text-orange-700 border-orange-200">
                                {item.finalGrade || '-'}
                            </Badge>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Dinilai</span>
                    )}
                </div>
            ),
            className: 'text-center w-24',
        },
        {
            key: 'supervisorLetter',
            header: 'Surat Tugas Dosen',
            render: (item) => (
                <div className="flex justify-center">
                    {item.supervisorLetter ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={() => onViewAssignmentDoc?.(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs font-medium">Lihat</span>
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
            render: (item) => (
                <div className="flex items-center justify-center scale-90">
                    {getInternshipStatusBadge(item.status)}
                </div>
            ),
            className: 'text-center',
            sortable: true,
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Detail"
                        onClick={() => onViewDetail(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];
interface SekdepLecturerWorkloadColumnProps {
    onViewDetail: (item: any) => void;
}

/**
 * Columns for Sekdep Lecturer Workload (Tab 4)
 */
export const getSekdepLecturerWorkloadColumns = ({
    onViewDetail,
}: SekdepLecturerWorkloadColumnProps): Column<any>[] => [
        {
            key: 'name',
            header: 'Nama Dosen',
            accessor: 'name',
            className: 'text-sm font-medium min-w-[200px]',
            sortable: true,
        },
        {
            key: 'nip',
            header: 'NIP/NIDN',
            accessor: 'nip',
            className: 'text-sm min-w-[150px]',
            sortable: true,
        },
        {
            key: 'activeInternshipCount',
            header: 'Bimbingan KP Aktif',
            render: (item) => (
                <div className="flex items-center justify-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {item.activeInternshipCount} Mahasiswa
                    </Badge>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'supervisorLetter',
            header: 'Surat Tugas Dosen',
            render: (item) => (
                <div className="flex items-center justify-center">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        {item.supervisorLetterStatus} Terbit
                    </Badge>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'actions',
            header: 'Aksi',
            render: (item) => (
                <div className="flex items-center justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-2 px-3 text-muted-foreground hover:text-primary hover:bg-primary/5"
                        onClick={() => onViewDetail(item)}
                    >
                        <Eye className="h-4 w-4" />
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];
