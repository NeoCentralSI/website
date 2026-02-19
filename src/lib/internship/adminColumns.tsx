import type { AdminApprovedProposalItem, AdminAssignmentProposalItem } from '@/services/internship.service';
import type { Column } from '@/components/layout/CustomTable';
import { Button } from '@/components/ui/button';
import { FileText, Edit } from 'lucide-react';

interface AdminApprovedProposalColumnProps {
    onViewLetterDoc: (item: AdminApprovedProposalItem) => void;
    onAction: (item: AdminApprovedProposalItem) => void;
}

/**
 * Columns for Admin Approved Proposal Management
 */
export const getAdminApprovedProposalColumns = ({
    onViewLetterDoc,
    onAction,
}: AdminApprovedProposalColumnProps): Column<AdminApprovedProposalItem>[] => [
        {
            key: 'koordinator',
            header: 'Nama',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'companyName',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm',
        },
        {
            key: 'members',
            header: 'Anggota',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-sm">{item.members.length} Mahasiswa</span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'periode',
            header: 'Periode',
            render: (item) => (
                <div className="flex flex-col text-center">
                    {item.period ? (
                        <>
                            <span className="text-xs font-medium">
                                {new Date(item.period.start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground italic">s/d</span>
                            <span className="text-xs font-medium">
                                {new Date(item.period.end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Diatur</span>
                    )}
                </div>
            ),
            className: 'text-center min-w-[120px]',
        },
        {
            key: 'letterNumber',
            header: 'No. Surat Pengantar',
            render: (item) => (
                <div className="flex justify-center">
                    <code className="text-[10px] font-mono px-1.5 py-0.5">
                        {item.letterNumber}
                    </code>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'file',
            header: 'File',
            render: (item) => (
                <div className="flex items-center justify-center">
                    {item.letterFile ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Lihat Surat Pengantar"
                            onClick={() => onViewLetterDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Ada</span>
                    )}
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
                        className="h-8 gap-2 px-2 text-primary hover:bg-primary/5"
                        onClick={() => onAction(item)}
                    >
                        <Edit className="h-4 w-4" />
                        <span className="text-xs">Kelola SP</span>
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];

interface AdminAssignmentProposalColumnProps {
    onViewLetterDoc: (item: AdminAssignmentProposalItem) => void;
    onAction: (item: AdminAssignmentProposalItem) => void;
}

/**
 * Columns for Admin Assignment Letter Management
 */
export const getAdminAssignmentProposalColumns = ({
    onViewLetterDoc,
    onAction,
}: AdminAssignmentProposalColumnProps): Column<AdminAssignmentProposalItem>[] => [
        {
            key: 'koordinator',
            header: 'Nama',
            render: (item) => (
                <div className="flex flex-col py-1">
                    <span className="font-medium text-sm leading-tight">{item.coordinatorName}</span>
                    <span className="text-xs text-muted-foreground">{item.coordinatorNim}</span>
                </div>
            ),
        },
        {
            key: 'companyName',
            header: 'Perusahaan',
            accessor: 'companyName',
            className: 'text-sm',
        },
        {
            key: 'members',
            header: 'Anggota',
            render: (item) => (
                <div className="flex items-center justify-center gap-1">
                    <span className="text-sm">{item.members.length} Mahasiswa</span>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'periode',
            header: 'Periode KP',
            render: (item) => (
                <div className="flex flex-col text-center">
                    {item.period ? (
                        <>
                            <span className="text-xs font-medium">
                                {new Date(item.period.start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground italic">s/d</span>
                            <span className="text-xs font-medium">
                                {new Date(item.period.end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Diatur</span>
                    )}
                </div>
            ),
            className: 'text-center min-w-[120px]',
        },
        {
            key: 'letterNumber',
            header: 'No. Surat Tugas',
            render: (item) => (
                <div className="flex justify-center">
                    {item.letterNumber !== "—" ? (
                        <code className="text-[10px] font-mono px-1.5 py-0.5">
                            {item.letterNumber}
                        </code>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">—</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'file',
            header: 'File',
            render: (item) => (
                <div className="flex items-center justify-center">
                    {item.letterFile ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Lihat Surat Tugas"
                            onClick={() => onViewLetterDoc(item)}
                        >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Lihat</span>
                        </Button>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Ada</span>
                    )}
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
                        className="h-8 gap-2 px-2 text-primary hover:bg-primary/5"
                        onClick={() => onAction(item)}
                    >
                        <Edit className="h-4 w-4" />
                        <span className="text-xs">Kelola ST</span>
                    </Button>
                </div>
            ),
            className: 'text-center',
        },
    ];
