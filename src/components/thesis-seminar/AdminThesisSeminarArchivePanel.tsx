import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Plus, Upload } from 'lucide-react';
import { toast } from 'sonner';

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
import { AdminThesisSeminarArchiveTable } from '@/components/thesis-seminar/AdminThesisSeminarArchiveTable';
import { AdminThesisSeminarArchiveFormDialog } from '@/components/thesis-seminar/AdminThesisSeminarArchiveFormDialog';
import { AdminThesisSeminarArchiveImportDialog } from '@/components/thesis-seminar/AdminThesisSeminarArchiveImportDialog';
import {
  useAdminThesisSeminarArchive,
  useAdminThesisSeminarFormOptions,
  useCreateAdminThesisSeminarArchive,
  useDeleteAdminThesisSeminarArchive,
  useDownloadAdminThesisSeminarArchiveTemplate,
  useExportAdminThesisSeminarArchive,
  useImportAdminThesisSeminarArchive,
  useUpdateAdminThesisSeminarArchive,
} from '@/hooks/thesis-seminar/useAdminThesisSeminar';
import type { AdminThesisSeminarArchiveItem } from '@/services/thesis-seminar/core.service';

const ARCHIVE_STATUSES = ['passed', 'passed_with_revision', 'failed', 'cancelled'].join(',');

export function AdminThesisSeminarArchivePanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<AdminThesisSeminarArchiveItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const archiveQuery = useAdminThesisSeminarArchive({
    page,
    pageSize,
    search: search.trim() || undefined,
    status: ARCHIVE_STATUSES,
  });

  const { thesisOptions, lecturerOptions, roomOptions } = useAdminThesisSeminarFormOptions();
  const createMutation = useCreateAdminThesisSeminarArchive();
  const updateMutation = useUpdateAdminThesisSeminarArchive();
  const deleteMutation = useDeleteAdminThesisSeminarArchive();
  const importMutation = useImportAdminThesisSeminarArchive();
  const exportMutation = useExportAdminThesisSeminarArchive();
  const templateMutation = useDownloadAdminThesisSeminarArchiveTemplate();

  const archiveData = archiveQuery.data?.seminars ?? [];
  const meta = archiveQuery.data?.meta ?? {
    page,
    pageSize,
    total: 0,
    totalPages: 0,
  };

  return (
    <>
      <AdminThesisSeminarArchiveTable
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
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        onDetail={(id) => navigate(`/tugas-akhir/seminar-hasil/arsip/${id}`)}
        onEdit={(row) => {
          setEditingSeminar(row);
          setIsFormOpen(true);
        }}
        onDelete={(id) => setDeletingId(id)}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <RefreshButton
              onClick={() => archiveQuery.refetch()}
              isRefreshing={archiveQuery.isFetching && !archiveQuery.isLoading}
            />
            <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button size="sm" variant="outline" onClick={() => exportMutation.mutate()}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingSeminar(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Arsip
            </Button>
          </div>
        }
      />

      <AdminThesisSeminarArchiveFormDialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditingSeminar(null);
        }}
        editingSeminar={editingSeminar}
        thesisOptions={thesisOptions}
        lecturerOptions={lecturerOptions}
        roomOptions={roomOptions}
        isPending={createMutation.isPending || updateMutation.isPending}
        onSubmit={(payload) =>
          editingSeminar
            ? updateMutation.mutate({ seminarId: editingSeminar.id, payload }, {
                onSuccess: () => {
                  setIsFormOpen(false);
                  setEditingSeminar(null);
                },
                onError: (error: Error) => toast.error(error.message || 'Gagal memperbarui arsip seminar'),
              })
            : createMutation.mutate(payload, {
                onSuccess: () => {
                  setIsFormOpen(false);
                  setEditingSeminar(null);
                },
                onError: (error: Error) => toast.error(error.message || 'Gagal menambahkan arsip seminar'),
              })
        }
      />

      <AdminThesisSeminarArchiveImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(file) => importMutation.mutateAsync(file)}
        isImporting={importMutation.isPending}
        onDownloadTemplate={() => templateMutation.mutate()}
      />

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Arsip Seminar</AlertDialogTitle>
            <AlertDialogDescription>
              Data arsip seminar yang dihapus tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletingId &&
                deleteMutation.mutate(deletingId, {
                  onSuccess: () => setDeletingId(null),
                  onError: (error: Error) => toast.error(error.message || 'Gagal menghapus arsip seminar'),
                })
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
