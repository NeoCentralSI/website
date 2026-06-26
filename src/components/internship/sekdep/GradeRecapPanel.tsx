import InternshipTable, { type Column } from '@/components/internship/InternshipTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';
import {
    exportGradeRecapPdf,
    getSekdepGradeRecap,
    type InternshipGradeRecapItem,
} from '@/services/internship';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

const numberFormatter = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
});

function formatScore(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return numberFormatter.format(value);
}

function getGradeStatusLabel(status: string) {
    switch (status) {
        case 'PASSED':
            return 'Lulus';
        case 'FAILED':
            return 'Gagal';
        case 'PENDING':
            return 'Belum Ada';
        default:
            return status || '-';
    }
}

function getGradeStatusClassName(status: string) {
    switch (status) {
        case 'PASSED':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'FAILED':
            return 'border-red-200 bg-red-50 text-red-700';
        case 'PENDING':
            return 'border-slate-200 bg-slate-50 text-slate-600';
        default:
            return '';
    }
}

export function GradeRecapPanel() {
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    const academicYearId = searchParams.get('academicYearId') || '';
    const gradeStatus = searchParams.get('gradeStatus') || 'all';
    const sortBy = searchParams.get('sortBy') || '';
    const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
    const [isExporting, setIsExporting] = useState(false);

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    const updateParams = useCallback((updates: Record<string, string | number | undefined>) => {
        const nextParams = new URLSearchParams(searchParams);
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '' || (value === 'all' && key !== 'academicYearId')) {
                nextParams.delete(key);
            } else {
                nextParams.set(key, value.toString());
            }
        });

        if (
            updates.q !== undefined ||
            updates.academicYearId !== undefined ||
            updates.gradeStatus !== undefined ||
            updates.sortBy !== undefined
        ) {
            nextParams.set('page', '1');
        }

        setSearchParams(nextParams);
    }, [searchParams, setSearchParams]);

    useEffect(() => {
        if (academicYearId || academicYears.length === 0) return;
        const activeYear = academicYears.find((item) => item.isActive);
        if (activeYear) {
            updateParams({ academicYearId: activeYear.id });
        }
    }, [academicYears, academicYearId, updateParams]);

    const {
        data,
        isLoading,
        isFetching,
        refetch,
    } = useQuery({
        queryKey: ['sekdep-grade-recap', { academicYearId, q, page, pageSize, gradeStatus, sortBy, sortOrder }],
        queryFn: () => getSekdepGradeRecap(academicYearId, q, page, pageSize, gradeStatus, sortBy, sortOrder),
        placeholderData: (previousData) => previousData,
    });

    const cpmks = useMemo(() => data?.data.cpmks || [], [data?.data.cpmks]);
    const items = useMemo(() => data?.data.items || [], [data?.data.items]);
    const total = data?.total || 0;

    const handleExportPdf = async () => {
        setIsExporting(true);
        try {
            await exportGradeRecapPdf(academicYearId, q, gradeStatus, sortBy, sortOrder);
            toast.success('PDF rekap nilai berhasil diunduh');
        } catch (error: any) {
            toast.error(error.message || 'Gagal mengekspor PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const columns: Column<InternshipGradeRecapItem>[] = useMemo(() => [
        {
            key: 'no',
            header: 'No',
            width: 44,
            className: 'w-11 px-2 text-center',
            render: (_, index) => (
                <span className="text-xs font-semibold text-muted-foreground">
                    {(page - 1) * pageSize + index + 1}
                </span>
            ),
        },
        {
            key: 'studentNim',
            header: 'NIM',
            width: 130,
            className: 'whitespace-nowrap',
            sortable: true,
            render: (row) => <span className="font-medium tabular-nums">{row.studentNim}</span>,
        },
        {
            key: 'studentName',
            header: 'Nama Mahasiswa',
            width: 260,
            sortable: true,
            render: (row) => (
                <div className="min-w-[220px]">
                    <p className="font-semibold text-slate-900">{row.studentName}</p>
                </div>
            ),
        },
        ...cpmks.map((cpmk): Column<InternshipGradeRecapItem> => ({
            key: cpmk.id,
            width: 110,
            className: 'text-center',
            header: () => (
                <div className="flex flex-col items-center leading-tight" title={cpmk.name}>
                    <span className="font-semibold">{cpmk.code}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">{formatScore(cpmk.weight)}%</span>
                </div>
            ),
            render: (row) => {
                const score = row.scores?.[cpmk.id]?.score;
                return (
                    <span className="font-medium tabular-nums">
                        {formatScore(score)}
                    </span>
                );
            },
        })),
        {
            key: 'total',
            header: 'Total',
            width: 120,
            className: 'text-center',
            render: (row) => (
                <span className="font-bold tabular-nums text-slate-900">{formatScore(row.totalScore)}</span>
            ),
        },
        {
            key: 'grade',
            header: 'Grade',
            width: 90,
            className: 'text-center',
            render: (row) => (
                row.finalGrade ? (
                    <Badge variant="secondary" className="h-6 px-2 text-xs">
                        {row.finalGrade}
                    </Badge>
                ) : '-'
            ),
        },
        {
            key: 'gradeStatus',
            header: 'Status',
            width: 120,
            className: 'text-center',
            filter: {
                type: 'select',
                value: gradeStatus,
                onChange: (value) => updateParams({ gradeStatus: value }),
                options: [
                    { label: 'Semua Status', value: 'all' },
                    { label: 'Lulus', value: 'PASSED' },
                    { label: 'Gagal', value: 'FAILED' },
                    { label: 'Belum Ada Nilai', value: 'PENDING' },
                ],
            },
            render: (row) => (
                <Badge variant="outline" className={getGradeStatusClassName(row.gradeStatus)}>
                    {getGradeStatusLabel(row.gradeStatus)}
                </Badge>
            ),
        },
    ], [cpmks, gradeStatus, page, pageSize, updateParams]);

    return (
        <div className="space-y-4">
            <InternshipTable
                className="[&_.rounded-md.border]:overflow-x-auto [&_table]:min-w-[1100px]"
                columns={columns}
                data={items}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={(nextPage) => updateParams({ page: nextPage })}
                onPageSizeChange={(nextPageSize) => updateParams({ pageSize: nextPageSize, page: 1 })}
                searchValue={q}
                onSearchChange={(value) => updateParams({ q: value })}
                emptyText={q ? 'Pencarian tidak menemukan data nilai.' : 'Belum ada data nilai mahasiswa.'}
                rowKey={(row) => row.id}
                enableColumnFilters
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={(field, order) => updateParams({ sortBy: field, sortOrder: order })}
                actions={
                    <div className="flex items-center gap-2">
                        <Select
                            value={academicYearId || 'all'}
                            onValueChange={(value) => updateParams({ academicYearId: value })}
                        >
                            <SelectTrigger className="h-9 w-[180px]">
                                <SelectValue placeholder="Pilih Tahun Ajaran" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                                {academicYears.map((year) => (
                                    <SelectItem key={year.id} value={year.id}>
                                        <span className={year.isActive ? 'font-semibold text-blue-600' : ''}>
                                            {year.year} {year.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <RefreshButton
                            onClick={() => refetch()}
                            isRefreshing={isFetching && !isLoading}
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportPdf}
                            disabled={isExporting}
                            className="gap-2"
                        >
                            {isExporting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}
                            Ekspor PDF
                        </Button>
                    </div>
                }
            />
        </div>
    );
}
