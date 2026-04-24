import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  getSeminarResultsAPI,
  createSeminarResultAPI,
  updateSeminarResultAPI,
  deleteSeminarResultAPI,
  getSeminarResultThesisOptionsAPI,
  getSeminarResultLecturerOptionsAPI,
} from '@/services/thesis-seminar/admin-seminar.service';
import { getRoomsAPI } from '@/services/admin.service';
import type {
  SeminarResult,
  SeminarResultStatus,
  SeminarResultLecturerOption,
  SeminarResultThesisOption,
} from '@/services/thesis-seminar/admin-seminar.service';
import type { Room } from '@/services/admin.service';

import { ThesisSeminarArchiveTable } from '@/components/thesis-seminar/admin/ThesisSeminarArchiveTable';
import { ThesisSeminarArchiveFormDialog } from '@/components/thesis-seminar/admin/ThesisSeminarArchiveFormDialog';

type SeminarResultsResponse = Awaited<ReturnType<typeof getSeminarResultsAPI>>;

export function ThesisSeminarArchivePanel() {
  const { setBreadcrumbs } = useOutletContext<LayoutContext>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Tugas Akhir' },
      { label: 'Seminar Hasil', href: '/tugas-akhir/seminar-hasil/arsip' },
      { label: 'Arsip' },
    ]);
  }, [setBreadcrumbs]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<SeminarResult | null>(null);
  const [deleteSeminarId, setDeleteSeminarId] = useState<string | null>(null);

  useEffect(() => setPage(1), [search]);

  // Queries
  const { data: seminarData, isLoading, isFetching, refetch: seminarDataRefetch } = useQuery({
    queryKey: ['seminar-results-master', { page, pageSize, search }],
    queryFn: () => getSeminarResultsAPI({ page, pageSize, search }),
    placeholderData: (previousData: SeminarResultsResponse | undefined) => previousData,
  });

  const { data: thesisOptionsData } = useQuery({
    queryKey: ['seminar-result-thesis-options'],
    queryFn: getSeminarResultThesisOptionsAPI,
  });

  const { data: lecturerOptionsData } = useQuery({
    queryKey: ['seminar-result-lecturer-options'],
    queryFn: getSeminarResultLecturerOptionsAPI,
  });

  const { data: roomOptionsData } = useQuery({
    queryKey: ['rooms', { page: 1, limit: 500, search: '' }],
    queryFn: () => getRoomsAPI({ page: 1, limit: 500, search: '' }),
  });

  // Mutations
  const seminarMut = useMutation({
    mutationFn: async (payload: {
      thesisId: string;
      date: string;
      roomId: string;
      status: SeminarResultStatus;
      examinerLecturerIds: string[];
    }) => {
      if (editingSeminar) {
        return updateSeminarResultAPI(editingSeminar.id, payload);
      }
      return createSeminarResultAPI(payload);
    },
    onSuccess: () => {
      toast.success(editingSeminar ? 'Data seminar hasil berhasil diperbarui' : 'Data seminar hasil berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['seminar-results-master'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-results-select-options'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-thesis-options'] });
      setIsFormOpen(false);
      setEditingSeminar(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menyimpan seminar hasil');
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteSeminarResultAPI(id),
    onSuccess: () => {
      toast.success('Data seminar hasil berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['seminar-results-master'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-results-select-options'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-audience-links'] });
      queryClient.invalidateQueries({ queryKey: ['seminar-result-thesis-options'] });
      setDeleteSeminarId(null);
    },
    onError: (error: unknown) => {
      toast.error((error as Error).message || 'Gagal menghapus seminar hasil');
    },
  });

  // Derived data
  const thesisOptions: SeminarResultThesisOption[] = thesisOptionsData?.data || [];
  const lecturerOptions: SeminarResultLecturerOption[] = lecturerOptionsData?.data || [];
  const roomOptions: Room[] = roomOptionsData?.data || [];
  const seminarRows = seminarData?.seminars || [];
  const seminarTotal = seminarData?.meta?.total || 0;

  // Handlers
  const openCreate = () => {
    setEditingSeminar(null);
    setIsFormOpen(true);
  };

  const openEdit = (row: SeminarResult) => {
    setEditingSeminar(row);
    setIsFormOpen(true);
  };

  const handleDetail = (id: string) => {
    // Note: Detail URL might need to be adjusted if the base path changes
    navigate(`/tugas-akhir/seminar-hasil/arsip/${id}`);
  };

  return (
    <div className="space-y-4">


      <div className="space-y-4">
        <ThesisSeminarArchiveTable
          data={seminarRows}
          loading={isLoading}
          isRefreshing={isFetching && !isLoading}
          page={page}
          pageSize={pageSize}
          total={seminarTotal}
          searchValue={search}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSearchChange={setSearch}
          onDetail={handleDetail}
          onEdit={openEdit}
          onDelete={setDeleteSeminarId}
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Tambah Seminar Hasil
              </Button>
              <RefreshButton
                onClick={() => seminarDataRefetch()}
                isRefreshing={isFetching && !isLoading}
              />
            </div>
          }
        />

        <ThesisSeminarArchiveFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          editingSeminar={editingSeminar}
          thesisOptions={thesisOptions}
          lecturerOptions={lecturerOptions}
          roomOptions={roomOptions}
          isPending={seminarMut.isPending}
          onSubmit={(payload) => seminarMut.mutate(payload)}
        />

        <AlertDialog open={Boolean(deleteSeminarId)} onOpenChange={(open) => !open && setDeleteSeminarId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Data Seminar Hasil</AlertDialogTitle>
              <AlertDialogDescription>
                Menghapus data seminar hasil akan sekaligus menghapus relasi dosen penguji dan audience seminar (cascade).
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMut.isPending}>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteMut.isPending || !deleteSeminarId}
                onClick={() => deleteSeminarId && deleteMut.mutate(deleteSeminarId)}
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
