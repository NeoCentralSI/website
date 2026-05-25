import React, { useMemo } from 'react';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AcademicYear } from '@/services/admin.service';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Users } from 'lucide-react';
import { approveReplacementRequest, rejectReplacementRequest } from '@/services/internship/kadep.service';
import { toast } from 'sonner';


interface SupervisorLettersTabProps {
    data: any[];
    pendingReplacements?: any[];
    isLoading: boolean;
    isFetching: boolean;
    columns: Column<any>[];
    searchQuery: string;
    onSearchChange: (v: string) => void;
    academicYearId: string;
    onAcademicYearChange: (v: string) => void;
    academicYears: AcademicYear[];
    onRefetch: () => void;
}

export const SupervisorLettersTab: React.FC<SupervisorLettersTabProps> = ({
    data,
    pendingReplacements = [],
    isLoading,
    isFetching,
    columns,
    searchQuery,
    onSearchChange,
    academicYearId,
    onAcademicYearChange,
    academicYears,
    onRefetch
}) => {
    const filteredData = useMemo(() => {
        const filtered = data.filter(l =>
            l.lecturerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.lecturerNip?.includes(searchQuery) ||
            l.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data, searchQuery]);


    const handleApprove = async (id: string) => {
        try {
            await approveReplacementRequest(id);
            toast.success('Penggantian pembimbing disetujui');
            onRefetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menyetujui');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectReplacementRequest(id, 'Ditolak oleh Kadep');
            toast.success('Penggantian pembimbing ditolak');
            onRefetch();
        } catch (error: any) {
            toast.error(error.message || 'Gagal menolak');
        }
    };

    return (
        <div className="space-y-6">
            {pendingReplacements.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
                            <Users className="h-5 w-5" />
                            Permintaan Penggantian Pembimbing ({pendingReplacements.length})
                        </CardTitle>
                        <CardDescription className="text-amber-700/80">
                            Persetujuan perubahan dosen pembimbing setelah surat tugas terbit.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {pendingReplacements.map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-lg border border-amber-100 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center shadow-sm">
                                <div>
                                    <h4 className="font-semibold text-sm">{req.studentName} <span className="font-normal text-muted-foreground">({req.studentNim})</span></h4>
                                    <div className="text-sm mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                        <div><span className="text-muted-foreground">Dosen Lama:</span> <span className="font-medium text-destructive">{req.oldSupervisorName}</span></div>
                                        <div><span className="text-muted-foreground">Dosen Baru:</span> <span className="font-medium text-emerald-600">{req.newSupervisorName}</span></div>
                                    </div>
                                    <p className="text-sm mt-2"><span className="text-muted-foreground">Alasan:</span> {req.reason}</p>
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleReject(req.id)}>
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Tolak
                                    </Button>
                                    <Button size="sm" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700" onClick={() => handleApprove(req.id)}>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Setujui
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <InternshipTable
            columns={columns}
            data={filteredData}
            loading={isLoading}
            isRefreshing={isFetching && !isLoading}
            total={filteredData.length}
            page={1}
            onPageChange={() => { }}
            pageSize={10}
            enableColumnFilters
            searchValue={searchQuery}
            onSearchChange={onSearchChange}
            emptyText={searchQuery ? "Pencarian tidak menemukan hasil." : "Tidak ada data surat tugas dosen."}
            actions={
                <div className="flex items-center gap-2">
                    <Select value={academicYearId} onValueChange={onAcademicYearChange}>
                        <SelectTrigger className="w-[200px] h-9">
                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                            {academicYears.map((ay) => (
                                <SelectItem key={ay.id} value={ay.id}>
                                    <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                        {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        {ay.isActive && ' (Aktif)'}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <RefreshButton onClick={onRefetch} isRefreshing={isFetching && !isLoading} />
                </div>
            }
        />
        </div>
    );
};
