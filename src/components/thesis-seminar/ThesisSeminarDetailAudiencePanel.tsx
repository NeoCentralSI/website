import { useRef, useState } from 'react';

import { ThesisSeminarAudienceTable } from './ThesisSeminarDetailAudienceTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  useAdminThesisSeminarAudiences,
  useAdminThesisSeminarAudienceStudentOptions,
  useAddAdminThesisSeminarAudience,
  useRemoveAdminThesisSeminarAudience,
  useImportAdminThesisSeminarAudiences,
  useExportAdminThesisSeminarAudiences,
  useExportAdminThesisSeminarAudiencesPdf,
  useDownloadAdminThesisSeminarAudienceTemplate,
  useSeminarAudiences,
  useApproveAudience,
  useUnapproveAudience,
} from '@/hooks/thesis-seminar';
import { AdminThesisSeminarAudienceImportDialog } from './AdminThesisSeminarAudienceImportDialog';
import { AdminThesisSeminarAudienceDialog } from './AdminThesisSeminarAudienceDialog';
import { Users, Plus, Upload, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRole, useAuth } from '@/hooks/shared';

interface Props {
  seminarId: string;
  detail: any;
}

export function ThesisSeminarAudiencePanel({ seminarId, detail }: Props) {
  const { isAdmin } = useRole();
  const { user } = useAuth();

  const _isAdmin = isAdmin();
  const _isSupervisor = !!user?.lecturer?.id && detail?.supervisors?.some((s: any) => s.lecturerId === user?.lecturer?.id);

  const allowedStatuses = ['passed', 'passed_with_revision', 'failed'];
  const isFinalized = allowedStatuses.includes(detail?.status);

  let isOngoing = false;
  if (detail?.status === 'ongoing') {
    isOngoing = true;
  } else if (detail?.status === 'scheduled' && detail.date && detail.startTime) {
    const dateObj = new Date(detail.date);
    const timeObj = new Date(detail.startTime);
    const seminarStart = new Date(
      dateObj.getUTCFullYear(),
      dateObj.getUTCMonth(),
      dateObj.getUTCDate(),
      timeObj.getUTCHours(),
      timeObj.getUTCMinutes()
    );
    isOngoing = new Date() >= seminarStart;
  }

  if (!isFinalized && !isOngoing) {
    return null;
  }

  const isArchived = !detail.registeredAt;

  // Admin Data & Hooks
  const adminQuery = useAdminThesisSeminarAudiences(seminarId);
  const { data: studentOptions } = useAdminThesisSeminarAudienceStudentOptions(seminarId, isArchived);
  const addMutation = useAddAdminThesisSeminarAudience();
  const removeMutation = useRemoveAdminThesisSeminarAudience();
  const importMutation = useImportAdminThesisSeminarAudiences();
  const downloadTemplateMutation = useDownloadAdminThesisSeminarAudienceTemplate();

  // Public/Supervisor Data & Hooks
  const publicQuery = useSeminarAudiences(seminarId);
  const approveMutation = useApproveAudience();
  const unapproveMutation = useUnapproveAudience();
  const exportMutation = useExportAdminThesisSeminarAudiences();
  const exportPdfMutation = useExportAdminThesisSeminarAudiencesPdf();

  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const currentQuery = _isAdmin ? adminQuery : publicQuery;
  const rows = Array.isArray(currentQuery.data)
    ? currentQuery.data
    : (currentQuery.data as any)?.audiences || [];
  const isRefreshing = currentQuery.isFetching && !currentQuery.isLoading;

  const handleAdd = async (studentId: string) => {
    try {
      await addMutation.mutateAsync({ seminarId, studentId });
      toast.success('Peserta berhasil ditambahkan');
      setAddOpen(false);
    } catch (err) {
      toast.error((err as Error).message || 'Gagal menambahkan peserta');
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await removeMutation.mutateAsync({ seminarId, studentId });
      toast.success('Peserta berhasil dihapus');
    } catch (err) {
      toast.error((err as Error).message || 'Gagal menghapus peserta');
    }
  };

  const handleImport = async (file: File) => {
    return importMutation.mutateAsync({ seminarId, file });
  };

  const handleDownloadTemplate = () => {
    downloadTemplateMutation.mutate(seminarId, {
      onError: (err) => toast.error((err as Error).message || 'Gagal mengunduh template'),
    });
  };

  const handleExport = () => {
    exportMutation.mutate(seminarId, {
      onError: (err) => toast.error((err as Error).message || 'Gagal mengekspor'),
    });
  };

  const handleExportPdf = () => {
    exportPdfMutation.mutate(seminarId, {
      onError: (err) => toast.error((err as Error).message || 'Gagal mengekspor ke PDF'),
    });
  };

  if (currentQuery.isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loading size="lg" text="Memuat data peserta..." />
      </div>
    );
  }

  const renderActions = () => {
    return (
      <div className="flex items-center gap-2">
        {_isAdmin && isArchived && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Spinner className="h-3 w-3 mr-1" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Import Excel
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <Spinner className="h-3 w-3 mr-1" />
          ) : (
            <Download className="h-3 w-3 mr-1" />
          )}
          Export Excel
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportPdf}
          disabled={exportPdfMutation.isPending}
        >
          {exportPdfMutation.isPending ? (
            <Spinner className="h-3 w-3 mr-1" />
          ) : (
            <FileText className="h-3 w-3 mr-1" />
          )}
          Export PDF
        </Button>

        {_isAdmin && isArchived && (
          <>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </>
        )}
        <RefreshButton onClick={() => currentQuery.refetch()} isRefreshing={isRefreshing} />
      </div>
    );
  };

  const approvingStudentId = approveMutation.isPending ? approveMutation.variables?.studentId : null;
  const unapprovingStudentId = unapproveMutation.isPending ? unapproveMutation.variables?.studentId : null;

  return (
    <>
      <ThesisSeminarAudienceTable
        rows={rows}
        loading={isRefreshing}
        actions={renderActions()}
        isEditable={_isAdmin}
        isArchived={isArchived}
        onDelete={_isAdmin ? handleRemove : undefined}
        showAction={_isSupervisor}
        approvingStudentId={approvingStudentId}
        unapprovingStudentId={unapprovingStudentId}
        onApprove={
          _isSupervisor
            ? (row) => row.studentId && approveMutation.mutate({ seminarId, studentId: row.studentId })
            : undefined
        }
        onUnapprove={
          _isSupervisor
            ? (row) => row.studentId && unapproveMutation.mutate({ seminarId, studentId: row.studentId })
            : undefined
        }
      />

      {_isAdmin && (
        <>
          <AdminThesisSeminarAudienceDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            studentOptions={studentOptions ?? []}
            isPending={addMutation.isPending}
            onSubmit={handleAdd}
            seminarOwnerStudentId={detail?.student?.id}
          />

          <AdminThesisSeminarAudienceImportDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            isImporting={importMutation.isPending}
            onImport={handleImport}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </>
      )}
    </>
  );
}
