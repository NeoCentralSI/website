import { useState } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
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
import {
  useAdminDefenceArchive,
  useAdminDefenceFormOptions,
  useCreateAdminDefenceArchive,
  useDeleteAdminDefenceArchive,
  useExportAdminDefenceArchive,
  useImportAdminDefenceArchive,
  useUpdateAdminDefenceArchive,
} from '@/hooks/thesis-defence/useAdminThesisDefence';
import { AdminThesisDefenceArchiveTable } from '@/components/thesis-defence/AdminThesisDefenceArchiveTable';
import { AdminThesisDefenceArchiveFormDialog } from '@/components/thesis-defence/AdminThesisDefenceArchiveFormDialog';
import { AdminThesisDefenceArchiveImportDialog } from '@/components/thesis-defence/AdminThesisDefenceArchiveImportDialog';
import type { AdminDefenceArchiveItem } from '@/types/defence.types';
import { toast } from 'sonner';

const ARCHIVE_STATUSES = ['passed', 'passed_with_revision', 'failed', 'cancelled'].join(',');

export function AdminThesisDefenceArchivePanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingDefence, setEditingDefence] = useState<AdminDefenceArchiveItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const archiveQuery = useAdminDefenceArchive({
    page,
    pageSize,
    search: search.trim() || undefined,
    status: ARCHIVE_STATUSES,
  });

  const archiveData = archiveQuery.data?.defences ?? [];
  const meta = archiveQuery.data?.meta ?? { page, pageSize, total: 0, totalPages: 0 };

  const { thesisOptions, lecturerOptions, roomOptions } = useAdminDefenceFormOptions();
  const createMutation = useCreateAdminDefenceArchive();
  const updateMutation = useUpdateAdminDefenceArchive();
  const deleteMutation = useDeleteAdminDefenceArchive();
  const importMutation = useImportAdminDefenceArchive();
  const exportMutation = useExportAdminDefenceArchive();

  const handleExport = async () => {
    try {
      const blob = await exportMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arsip-sidang-ta-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Gagal mengekspor data');
    }
  };

  return (
    <>
      <AdminThesisDefenceArchiveTable
        data={archiveData}
        loading={archiveQuery.isLoading}
        isRefreshing={archiveQuery.isFetching && !archiveQuery.isLoading}
        page={meta.page}
        pageSize={meta.pageSize}
        total={meta.total}
        searchValue={search}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onDetail={(id) => navigate(`/tugas-akhir/sidang/${id}`)}
        onEdit={(row) => {
          setEditingDefence(row);
          setIsFormOpen(true);
        }}
        onDelete={(id) => setDeletingId(id)}
        actions={
          <div className="flex flex-wrap gap-2">
            <RefreshButton
              onClick={() => archiveQuery.refetch()}
              isRefreshing={archiveQuery.isFetching && !archiveQuery.isLoading}
            />
            <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingDefence(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Arsip
            </Button>
          </div>
        }
      />

      <AdminThesisDefenceArchiveFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingDefence(null);
        }}
        editingSeminar={editingDefence}
        thesisOptions={thesisOptions}
        lecturerOptions={lecturerOptions}
        roomOptions={roomOptions}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(payload) => {
          if (editingDefence) {
            updateMutation.mutate(
              { defenceId: editingDefence.id, payload },
              {
                onSuccess: () => {
                  setIsFormOpen(false);
                  setEditingDefence(null);
                },
              }
            );
            return;
          }

          createMutation.mutate(payload, {
            onSuccess: () => {
              setIsFormOpen(false);
              setEditingDefence(null);
            },
          });
        }}
      />

      <AdminThesisDefenceArchiveImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        isPending={importMutation.isPending}
        onImport={(file) => importMutation.mutateAsync(file)}
      />

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip Sidang</AlertDialogTitle>
            <AlertDialogDescription>
              Data arsip sidang yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingId &&
                deleteMutation.mutate(deletingId, {
                  onSuccess: () => setDeletingId(null),
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
