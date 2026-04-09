import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDateId } from '@/lib/text';
import { ClipboardList, Calendar } from 'lucide-react';

interface SekdepLogbookTabProps {
    logbooks: any[];
}

export const SekdepLogbookTab: React.FC<SekdepLogbookTabProps> = ({ logbooks }) => {
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
            <CardContent className="px-0">
                <div className="rounded-xl border bg-white overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[180px] font-semibold text-slate-700">Tanggal</TableHead>
                                <TableHead className="font-semibold text-slate-700">Aktivitas</TableHead>
                                <TableHead className="w-[150px] font-semibold text-slate-700">Waktu Input</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logbooks.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                    <TableCell className="font-medium align-top">
                                        <div className="flex items-center gap-2 text-slate-700">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            {formatDateId(log.activityDate)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 leading-relaxed whitespace-pre-wrap py-4">
                                        {log.activityDescription || "-"}
                                    </TableCell>
                                    <TableCell className="text-[11px] text-slate-400 align-top">
                                        {formatDateId(log.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};
