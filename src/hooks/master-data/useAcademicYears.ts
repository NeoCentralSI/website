import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  getAcademicYearsAPI, 
  createAcademicYearAPI, 
  updateAcademicYearAPI 
} from '@/services/admin.service';
import type { 
  AcademicYear, 
  CreateAcademicYearRequest, 
  UpdateAcademicYearRequest 
} from '@/services/admin.service';

interface UseAcademicYearsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useAcademicYears(options: UseAcademicYearsOptions = {}) {
  const { page = 1, pageSize = 10, search = '' } = options;
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['academicYears', { page, pageSize, search }],
    queryFn: () => getAcademicYearsAPI({ page, pageSize, search }),
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAcademicYears = () => {
    queryClient.invalidateQueries({ queryKey: ['academicYears'] });
    queryClient.invalidateQueries({ queryKey: ['activeAcademicYear'] });
  };

  const createAcademicYear = async (formData: CreateAcademicYearRequest) => {
    setIsSubmitting(true);
    try {
      await createAcademicYearAPI(formData);
      toast.success('Tahun ajaran berhasil ditambahkan');
      invalidateAcademicYears();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Note: isActive is now computed automatically based on date range
  // Admin can only update semester, year, startDate, endDate
  const updateAcademicYear = async (id: string, formData: UpdateAcademicYearRequest) => {
    setIsSubmitting(true);
    try {
      // Remove isActive from update payload since it's auto-computed
      const { isActive, ...updateData } = formData;
      await updateAcademicYearAPI(id, updateData);
      toast.success('Tahun ajaran berhasil diupdate');
      invalidateAcademicYears();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan tahun ajaran');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    academicYears: data?.academicYears || [],
    meta: data?.meta,
    total: data?.meta?.total || 0,
    isLoading,
    isSubmitting,
    error,
    createAcademicYear,
    updateAcademicYear,
  };
}

export function useAcademicYearForm() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [formData, setFormData] = useState<CreateAcademicYearRequest | UpdateAcademicYearRequest>({
    semester: 'ganjil',
    year: new Date().getFullYear(),
    startDate: '',
    endDate: '',
  });

  const openCreateDialog = () => {
    setEditingYear(null);
    setFormData({
      semester: 'ganjil',
      year: new Date().getFullYear(),
      startDate: '',
      endDate: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      semester: year.semester,
      year: year.year,
      startDate: year.startDate,
      endDate: year.endDate,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  return {
    dialogOpen,
    setDialogOpen,
    editingYear,
    formData,
    setFormData,
    openCreateDialog,
    openEditDialog,
    closeDialog,
  };
}
