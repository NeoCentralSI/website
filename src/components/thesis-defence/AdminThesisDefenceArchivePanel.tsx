import { useState, useMemo } from 'react';
import { Plus, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { useAdminDefenceArchive, useAdminDefenceFormOptions, useCreateAdminDefenceArchive, useImportAdminDefenceArchive, useExportAdminDefenceArchive } from '@/hooks/thesis-defence/useAdminThesisDefence';
import { AdminThesisDefenceArchiveTable } from '@/components/thesis-defence/AdminThesisDefenceArchiveTable';
import { AdminThesisDefenceArchiveFormDialog } from '@/components/thesis-defence/AdminThesisDefenceArchiveFormDialog';
import { AdminThesisDefenceArchiveImportDialog } from '@/components/thesis-defence/AdminThesisDefenceArchiveImportDialog';
import { toast } from 'sonner';

export function AdminThesisDefenceArchivePanel() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data, isLoading, isFetching, refetch } = useAdminDefenceArchive({
    page,
    pageSize,
    search: search.trim() || undefined,
  });

  const { thesisOptions, lecturerOptions, roomOptions } = useAdminDefenceFormOptions();
  const createMutation = useCreateAdminDefenceArchive();
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
        data={data ?? []}
        loading={isLoading}
        isRefreshing={isFetching && !isLoading}
        page={page}
        pageSize={pageSize}
        total={data?.length ?? 0}
        searchValue={search}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        onSearchChange={setSearch}
        actions={
          <div className="flex flex-wrap gap-2">
            <RefreshButton
              onClick={() => refetch()}
              isRefreshing={isFetching && !isLoading}
            />
            <Button size="sm" variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Impor
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={exportMutation.isPending}>
              <Download className="w-4 h-4 mr-2" />
              {exportMutation.isPending ? 'Mengekspor...' : 'Ekspor'}
            </Button>
            <Button size="sm" onClick={() => setIsFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Arsip
            </Button>
          </div>
        }
      />

      <AdminThesisDefenceArchiveFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingSeminar={null}
        thesisOptions={thesisOptions}
        lecturerOptions={lecturerOptions}
        roomOptions={roomOptions}
        isPending={createMutation.isPending}
        onSubmit={(payload) => {
          createMutation.mutate(payload, {
            onSuccess: () => setIsFormOpen(false),
          });
        }}
      />

      <AdminThesisDefenceArchiveImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        isPending={importMutation.isPending}
        onImport={(file) => {
          importMutation.mutate(file, {
            onSuccess: () => setIsImportOpen(false),
          });
        }}
      />
    </>
  );
}
