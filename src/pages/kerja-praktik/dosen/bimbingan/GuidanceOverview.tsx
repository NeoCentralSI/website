import { useEffect, useMemo, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { useQuery } from '@tanstack/react-query';
import { getLecturerSupervisedStudents } from '@/services/internship.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Clock } from 'lucide-react';
import InternshipTable from '@/components/internship/InternshipTable';
import { getLecturerSupervisedStudentsColumns } from '@/lib/internship/lecturerColumns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAcademicYears } from '@/hooks/master-data/useAcademicYears';

export default function GuidanceOverviewPage() {
    const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
    const navigate = useNavigate();

    // Client-side state for search and pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [academicYearFilter, setAcademicYearFilter] = useState<string | null>(null);

    const { academicYears } = useAcademicYears({ pageSize: 50 });

    useEffect(() => {
        setBreadcrumbs([
            { label: 'Kerja Praktik', href: '/kerja-praktik' },
            { label: 'Bimbingan Mahasiswa' }
        ]);
        setTitle('Bimbingan Kerja Praktik');
    }, [setBreadcrumbs, setTitle]);

    useEffect(() => {
        if (academicYearFilter === null && academicYears.length > 0) {
            const active = academicYears.find(ay => ay.isActive);
            if (active) {
                setAcademicYearFilter(active.id);
            } else {
                setAcademicYearFilter('all');
            }
        }
    }, [academicYears, academicYearFilter]);

    const { data: students, isLoading, error, isFetching } = useQuery({
        queryKey: ['lecturerSupervisedStudents'],
        queryFn: getLecturerSupervisedStudents,
    });

    const columns = useMemo(() => getLecturerSupervisedStudentsColumns({
        onViewDetail: (student) => {
            const targetUrl = `/kerja-praktik/dosen/bimbingan/${student.internshipId}`;
            navigate(targetUrl);
        }
    }), [navigate]);

    // Client-side filtering & pagination
    const filteredData = useMemo(() => {
        if (!students) return [];
        let result = students;
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(s => 
                s.studentName.toLowerCase().includes(lowSearch) || 
                s.studentNim.toLowerCase().includes(lowSearch) ||
                s.companyName.toLowerCase().includes(lowSearch)
            );
        }
        if (academicYearFilter && academicYearFilter !== 'all') {
            result = result.filter(s => {
                const studentYearId = academicYears.find(ay => 
                    `${ay.year} ${ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}` === s.academicYearName
                )?.id;
                return studentYearId === academicYearFilter;
            });
        }
        return result;
    }, [students, searchTerm, academicYearFilter, academicYears]);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    if (isLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <p className="text-lg font-medium">Gagal memuat data bimbingan mahasiswa</p>
                <Button variant="outline" onClick={() => window.location.reload()}>Coba Lagi</Button>
            </div>
        );
    }

    const unreviewedCount = students?.reduce((sum, s) => sum + s.progress.submittedCount, 0) || 0;

    return (
        <div className="flex flex-col gap-6 p-6 w-full">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Mahasiswa Bimbingan</h1>
                    <p className="text-muted-foreground">Kelola bimbingan Kerja Praktik mahasiswa bimbingan Anda.</p>
                </div>
                {unreviewedCount > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200 flex gap-2 py-1.5 px-3">
                        <Clock className="w-4 h-4" />
                        {unreviewedCount} Bimbingan Perlu Dinilai
                    </Badge>
                )}
            </div>

            <InternshipTable
                columns={columns as any}
                data={paginatedData}
                total={filteredData.length}
                page={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                loading={isLoading}
                isRefreshing={isFetching && !isLoading}
                searchValue={searchTerm}
                onSearchChange={(v) => {
                    setSearchTerm(v);
                    setCurrentPage(1);
                }}
                emptyText={searchTerm ? 'Pencarian tidak menemukan hasil.' : 'Belum ada mahasiswa bimbingan.'}
                actions={
                    <Select value={academicYearFilter || 'all'} onValueChange={(v) => {
                        setAcademicYearFilter(v);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Pilih Tahun Ajaran" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua Tahun Ajaran</SelectItem>
                            {academicYears.map((ay) => (
                                <SelectItem key={ay.id} value={ay.id}>
                                    <span className={ay.isActive ? "text-blue-600 font-semibold" : ""}>
                                        {ay.year} {ay.semester === 'ganjil' ? 'Ganjil' : 'Genap'}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                }
            />
        </div>
    );
}

