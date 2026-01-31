import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Info } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loading } from '@/components/ui/spinner';
import { 
  AcademicYearFormDialog, 
  AcademicYearTable 
} from '@/components/master-data';

import { useAcademicYears, useAcademicYearForm } from '@/hooks/master-data';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import type { CreateAcademicYearRequest, UpdateAcademicYearRequest } from '@/services/admin.service';

export default function AcademicYearPage() {
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  
  // Pagination & filter state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');

  // Custom hooks
  const { 
    academicYears, 
    total, 
    isLoading, 
    isSubmitting,
    error,
    createAcademicYear, 
    updateAcademicYear 
  } = useAcademicYears({ page, pageSize, search: searchValue });

  const {
    dialogOpen,
    setDialogOpen,
    editingYear,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  } = useAcademicYearForm();

  // Breadcrumbs
  const breadcrumbs = useMemo(() => [
    { label: 'Master Data' },
    { label: 'Tahun Ajaran' },
  ], []);

  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    setTitle('Tahun Ajaran');
  }, [setBreadcrumbs, setTitle, breadcrumbs]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  // Show error toast
  useEffect(() => {
    if (error) {
      toast.error((error as Error).message || 'Gagal memuat data tahun ajaran');
    }
  }, [error]);

  // Handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let success = false;
    if (editingYear) {
      success = await updateAcademicYear(editingYear.id, formData as UpdateAcademicYearRequest);
    } else {
      success = await createAcademicYear(formData as CreateAcademicYearRequest);
    }
    
    if (success) {
      closeDialog();
    }
  };

  // Full blank loading on browser reload (no cached data)
  if (isLoading && academicYears.length === 0) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat data tahun ajaran..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tahun Ajaran</h2>
          <p className="text-muted-foreground">Manajemen tahun ajaran dan semester</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Tahun Ajaran
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Status aktif tahun ajaran ditentukan secara otomatis berdasarkan periode (tanggal mulai - tanggal selesai).
          Tahun ajaran akan aktif jika tanggal hari ini berada dalam rentang periode tersebut.
        </AlertDescription>
      </Alert>

      <AcademicYearTable
        data={academicYears}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={total}
        searchValue={searchValue}
        semesterFilter={semesterFilter}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearchValue}
        onSemesterFilterChange={setSemesterFilter}
        onEdit={openEditDialog}
      />

      <AcademicYearFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingYear={editingYear}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
