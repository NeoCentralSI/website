import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import CustomTable from '@/components/layout/CustomTable';
import type { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest } from '@/services/admin.service';
import { createAcademicYearAPI, updateAcademicYearAPI, getAcademicYearsAPI } from '@/services/admin.service';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AcademicYearFormDialog } from '@/components/master-data';

export default function AcademicYearPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const queryClient = useQueryClient();
  
  // Local UI state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<CreateAcademicYearRequest | UpdateAcademicYearRequest>({
    semester: 'ganjil',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });

  // Memoized breadcrumbs
  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Tahun Ajaran' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Tahun Ajaran');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // Use TanStack Query for server state
  const { data, isLoading, error } = useQuery({
    queryKey: ['academicYears', { page, pageSize, search: searchValue }],
    queryFn: () => getAcademicYearsAPI({ page, pageSize, search: searchValue }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data tahun ajaran');
    }
  }, [error]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  // Extract data from query
  const allAcademicYears = data?.academicYears || [];
  const totalYears = data?.meta?.total || 0;

  // Apply client-side semester filter
  const filteredYears = useMemo(() => {
    if (!semesterFilter) return allAcademicYears;
    return allAcademicYears.filter(year => year.semester === semesterFilter);
  }, [allAcademicYears, semesterFilter]);

  // Invalidate cache after mutations
  const invalidateAcademicYears = () => {
    queryClient.invalidateQueries({ queryKey: ['academicYears'] });
  };

  const handleOpenDialog = (year?: AcademicYear) => {
    if (year) {
      setEditingYear(year);
      setFormData({
        semester: year.semester,
        year: year.year,
        startDate: year.startDate,
        endDate: year.endDate,
      });
    } else {
      setEditingYear(null);
      setFormData({
        semester: 'ganjil',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingYear) {
        await updateAcademicYearAPI(editingYear.id, formData as UpdateAcademicYearRequest);
        toast.success('Tahun ajaran berhasil diupdate');
      } else {
        await createAcademicYearAPI(formData as CreateAcademicYearRequest);
        toast.success('Tahun ajaran berhasil ditambahkan');
      }
      
      setDialogOpen(false);
      invalidateAcademicYears(); // Invalidate cache to refetch
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran');
    }
  };

  const formatSemester = (semester: string) => {
    return semester === 'ganjil' ? 'Ganjil' : 'Genap';
  };

  // Use server total or filtered count
  const totalCount = filteredYears.length > 0 ? filteredYears.length : totalYears;

  const columns = [
    {
      key: 'year',
      header: 'Tahun',
      accessor: 'year',
      sortable: true,
      render: (row: any) => (
        <span className="font-semibold">{row.year}</span>
      ),
    },
    {
      key: 'semester',
      header: 'Semester',
      render: (row: any) => (
        <Badge variant={row.semester === 'ganjil' ? 'default' : 'secondary'}>
          {formatSemester(row.semester)}
        </Badge>
      ),
      filter: {
        type: 'select',
        value: semesterFilter,
        onChange: setSemesterFilter,
        options: [
          { label: 'Semua', value: '' },
          { label: 'Ganjil', value: 'ganjil' },
          { label: 'Genap', value: 'genap' },
        ],
      },
    },
    {
      key: 'period',
      header: 'Periode',
      render: (row: any) => {
        if (!row.startDate || !row.endDate) return '-';
        const start = format(new Date(row.startDate), 'd MMM yyyy', { locale: idLocale });
        const end = format(new Date(row.endDate), 'd MMM yyyy', { locale: idLocale });
        return (
          <div className="text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span>{start} - {end}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Dibuat',
      render: (row: any) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.createdAt), 'd MMM yyyy', { locale: idLocale })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (row: any) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenDialog(row as AcademicYear)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tahun Ajaran</h2>
          <p className="text-muted-foreground">Manajemen tahun ajaran dan semester</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tahun Ajaran
        </Button>
      </div>

      <CustomTable
        data={filteredYears}
        columns={columns as any}
        loading={isLoading}
        emptyText="Belum ada data tahun ajaran"
        page={page}
        pageSize={pageSize}
        total={totalCount}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters={true}
      />

      <AcademicYearFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingYear={editingYear}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
