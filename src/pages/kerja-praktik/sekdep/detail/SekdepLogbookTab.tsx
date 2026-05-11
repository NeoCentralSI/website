import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateId } from '@/lib/text';
import { ClipboardList } from 'lucide-react';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SekdepLogbookTabProps {
    logbooks: any[];
    isLocked?: boolean;
}

export const SekdepLogbookTab: React.FC<SekdepLogbookTabProps> = ({ logbooks, isLocked }) => {
    const sortedLogbooks = useMemo(() => {
        return [...(logbooks || [])].sort((a, b) => 
            new Date(a.activityDate).getTime() - new Date(b.activityDate).getTime()
        );
    }, [logbooks]);

    const columns = useMemo<Column<any>[]>(() => [
        {
            key: 'index',
            header: 'Hari Ke',
            render: (_, index) => index + 1,
            className: 'text-center w-[80px]',
        },
        {
            key: 'activityDate',
            header: 'Tanggal',
            render: (item) => (
                <div>
                    {format(new Date(item.activityDate), "EEEE, d MMMM yyyy", { locale: id })}
                </div>
            ),
            className: 'w-[250px]',
        },
        {
            key: 'activityDescription',
            header: 'Aktivitas',
            render: (item) => (
                <div className="leading-relaxed whitespace-pre-wrap py-2">
                    {item.activityDescription ? item.activityDescription : (isLocked ? "-" : <span className="text-muted-foreground italic">Belum diisi</span>)}
                </div>
            ),
        },
        {
            key: 'createdAt',
            header: 'Waktu Input',
            render: (item) => (
                <span className="text-[12px] text-slate-400 tracking-wider">
                    {formatDateId(item.createdAt)}
                </span>
            ),
            className: 'w-[150px] text-center',
        },
    ], [isLocked]);

    if (!logbooks || logbooks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-slate-50/50 rounded-xl border-2 border-dashed">
                <ClipboardList className="h-12 w-12 mb-2 opacity-20" />
                <p>Belum ada entri logbook</p>
            </div>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent pt-0">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            Logbook Harian
                        </CardTitle>
                        <p className="text-sm text-slate-500 mt-1">
                            Daftar riwayat aktivitas harian mahasiswa di instansi.
                        </p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100">
                        {logbooks.length} Total Entri
                    </Badge>
                </div>
            </CardHeader>
            <div className="flex flex-col gap-4">
                <InternshipTable
                    columns={columns}
                    data={sortedLogbooks}
                    total={sortedLogbooks.length}
                    page={1}
                    pageSize={100}
                    onPageChange={() => {}}
                    hidePagination={logbooks.length <= 100}
                    emptyText="Belum ada entri logbook"
                />
            </div>
        </Card>
    );
};
