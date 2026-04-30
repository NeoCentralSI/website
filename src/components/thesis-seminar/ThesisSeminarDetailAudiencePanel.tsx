import { useRef, useState } from 'react';

import { ThesisSeminarAudienceTable } from './ThesisSeminarDetailAudienceTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loading, Spinner } from '@/components/ui/spinner';
import { RefreshButton } from '@/components/ui/refresh-button';
import {
  useAdminThesisSeminarAudiences,
  useAdminThesisSeminarAudienceStudentOptions,
  useAddAdminThesisSeminarAudience,
  useRemoveAdminThesisSeminarAudience,
  useImportAdminThesisSeminarAudiences,
  useExportAdminThesisSeminarAudiences,
  useSeminarAudiences,
  useApproveAudience,
  useUnapproveAudience,
} from '@/hooks/thesis-seminar';
import { Users, Plus, Upload, Download } from 'lucide-react';
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
  
  // Public/Supervisor Data & Hooks
  const publicQuery = useSeminarAudiences(seminarId);
  const approveMutation = useApproveAudience();
  const unapproveMutation = useUnapproveAudience();
  const exportMutation = useExportAdminThesisSeminarAudiences();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentQuery = _isAdmin ? adminQuery : publicQuery;
  const rows = Array.isArray(currentQuery.data) 
    ? currentQuery.data 
    : (currentQuery.data as any)?.audiences || [];
  const isRefreshing = currentQuery.isFetching && !currentQuery.isLoading;

  const handleAdd = async () => {
    if (!selectedStudentId) return;
    try {
      await addMutation.mutateAsync({ seminarId, studentId: selectedStudentId });
      toast.success('Peserta berhasil ditambahkan');
      setAddOpen(false);
      setSelectedStudentId('');
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
    try {
      await importMutation.mutateAsync({ seminarId, file });
      toast.success('Peserta berhasil diimpor');
    } catch (err) {
      toast.error((err as Error).message || 'Gagal mengimpor peserta');
    }
  };

  const handleExport = () => {
    exportMutation.mutate(seminarId, {
      onError: (err) => toast.error((err as Error).message || 'Gagal mengekspor'),
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
          Export
        </Button>
        
        {_isAdmin && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Spinner className="h-3 w-3 mr-1" />
              ) : (
                <Upload className="h-3 w-3 mr-1" />
              )}
              Import
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleImport(file);
                  e.target.value = '';
                }
              }}
            />
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
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Peserta</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Pilih mahasiswa...</option>
                {(studentOptions ?? []).map((s: any) => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.name} ({s.nim})
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
              <Button onClick={() => void handleAdd()} disabled={!selectedStudentId || addMutation.isPending}>
                {addMutation.isPending ? <><Spinner className="mr-2 h-4 w-4" />Menambahkan...</> : 'Tambah'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
