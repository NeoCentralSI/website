import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import CustomTable from '@/components/layout/CustomTable';
import type { AcademicYear, CreateAcademicYearRequest, UpdateAcademicYearRequest } from '@/services/admin.service';
import { createAcademicYearAPI, updateAcademicYearAPI, getAcademicYearsAPI } from '@/services/admin.service';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function AcademicYearPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const [allAcademicYears, setAllAcademicYears] = useState<AcademicYear[]>([]); // All data from API
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]); // Filtered data for display
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  
  // Column filters
  const [semesterFilter, setSemesterFilter] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<CreateAcademicYearRequest | UpdateAcademicYearRequest>({
    semester: 'ganjil',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Master Data' },
      { label: 'Tahun Ajaran' },
    ]);
    setTitle('Tahun Ajaran');
  }, [setBreadcrumbs, setTitle]);

  const loadAcademicYears = async () => {
    setLoading(true);
    try {
      const response = await getAcademicYearsAPI({ page: 1, pageSize: 1000 }); // Load all data
      setAllAcademicYears(response.academicYears);
    } catch (error) {
      toast.error('Gagal memuat data tahun ajaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchValue, semesterFilter]);

  // Filter and paginate data on frontend
  useEffect(() => {
    let filtered = allAcademicYears;

    // Apply search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(year => 
        year.year.toString().includes(search) ||
        year.semester.toLowerCase().includes(search)
      );
    }

    // Apply semester filter
    if (semesterFilter) {
      filtered = filtered.filter(year => year.semester === semesterFilter);
    }

    // Apply pagination
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    setAcademicYears(filtered.slice(start, end));
  }, [allAcademicYears, searchValue, semesterFilter, page, pageSize]);

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
      loadAcademicYears();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran');
    }
  };

  const formatSemester = (semester: string) => {
    return semester === 'ganjil' ? 'Ganjil' : 'Genap';
  };

  // Calculate filtered total
  const getFilteredTotal = () => {
    let filtered = allAcademicYears;

    if (searchValue) {
      const search = searchValue.toLowerCase();
      filtered = filtered.filter(year => 
        year.year.toString().includes(search) ||
        year.semester.toLowerCase().includes(search)
      );
    }

    if (semesterFilter) {
      filtered = filtered.filter(year => year.semester === semesterFilter);
    }

    return filtered.length;
  };

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
        data={academicYears}
        columns={columns as any}
        loading={loading}
        emptyText="Belum ada data tahun ajaran"
        page={page}
        pageSize={pageSize}
        total={getFilteredTotal()}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        enableColumnFilters={true}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingYear ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
              </DialogTitle>
              <DialogDescription>
                {editingYear
                  ? 'Ubah informasi tahun ajaran'
                  : 'Tambahkan tahun ajaran baru'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="year">Tahun</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({ ...formData, year: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value: 'ganjil' | 'genap') =>
                      setFormData({ ...formData, semester: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ganjil">Ganjil</SelectItem>
                      <SelectItem value="genap">Genap</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="startDate">Tanggal Mulai</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      startDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">Tanggal Selesai</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate?.split('T')[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      endDate: e.target.value ? new Date(e.target.value).toISOString() : '',
                    })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit">
                {editingYear ? 'Simpan Perubahan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
