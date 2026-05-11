import React, { useMemo } from 'react';
import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type AcademicYear } from '@/services/admin.service';

interface ApplicationLettersTabProps {
    data: any[];
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

export const ApplicationLettersTab: React.FC<ApplicationLettersTabProps> = ({
    data,
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
            l.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            l.coordinatorNim?.includes(searchQuery) ||
            l.documentNumber?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [data, searchQuery]);

    return (
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
            emptyText={searchQuery ? "Pencarian tidak menemukan hasil." : "Tidak ada data surat permohonan."}
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
    );
};
