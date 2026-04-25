import type { InternshipPendingLetter } from '@/services/internship';
import type { Column } from '@/components/layout/CustomTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Check, Signature } from 'lucide-react';
import { formatDateShortId } from '@/lib/text';

export interface KadepLetterColumnProps {
    onViewDoc: (item: InternshipPendingLetter) => void;
    onApprove: (item: InternshipPendingLetter) => void;
}

/**
 * Columns for Kadep Internship Letter Signing list
 */
export const getKadepInternshipLetterColumns = ({
    onViewDoc,
    onApprove,
}: KadepLetterColumnProps): Column<InternshipPendingLetter>[] => [
        {
            key: 'nama',
            header: 'Nama Koordinator',
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
            key: 'period',
            header: 'Periode',
            render: (item) => (
                <div className="flex flex-col py-1 text-center min-w-[120px]">
                    {item.period ? (
                        <>
                            <span className="text-xs font-medium">
                                {formatDateShortId(item.period.start)}
                            </span>
                            <span className="text-[10px] text-muted-foreground italic">s/d</span>
                            <span className="text-xs font-medium">
                                {formatDateShortId(item.period.end)}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs text-muted-foreground italic">Belum Diatur</span>
                    )}
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'documentNumber',
            header: 'No. Surat',
            render: (item) => (
                <div className="flex justify-center">
                    <code className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded">
                        {item.documentNumber}
                    </code>
                </div>
            ),
            className: 'text-center',
        },
        {
            key: 'members',
            header: 'Anggota',
            render: (item) => {
                let totalMahasiswa = 0;

                if (item.type === 'APPLICATION') {
                    // For Application, we count all members + coordinator (assuming they are all active)
                    const members = item.members || [];
                    totalMahasiswa = members.length + 1;
                } else {
                    // For Assignment, we use the pre-calculated acceptedMemberCount from backend
                    totalMahasiswa = item.acceptedMemberCount;
                }

                return (
                    <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{totalMahasiswa} Mahasiswa</span>
                    </div>
                );
            },
            className: 'text-center',
        },
        {
            key: 'status',
            header: 'Status',
            render: (item) => (
                <div className="flex items-center justify-center">
                    {item.signedById ? (
                        <Badge variant="success" className="px-2 py-0 text-[10px] whitespace-nowrap">
                            <Check className="h-3 w-3 mr-1" />
                            SIGNED
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="px-2 py-0 text-[10px] whitespace-nowrap animate-pulse">
                            PENDING
                        </Badge>
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
                    {item.document ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-2 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => onViewDoc(item)}
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
                    {!item.signedById ? (
                        <Button
                            size="sm"
                            className="h-8 gap-2 px-3 bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all active:scale-95"
                            onClick={() => onApprove(item)}
                        >
                            <Signature className="h-4 w-4" />
                            <span className="text-xs font-semibold">Tanda Tangani</span>
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-2 px-3 text-muted-foreground cursor-not-allowed opacity-70"
                            disabled
                        >
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-semibold">Selesai</span>
                        </Button>
                    )}
                </div>
            ),
            className: 'text-center',
        },
    ];
