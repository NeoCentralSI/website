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
import { useRole } from '@/hooks/shared/useRole';
import { Users, Plus, Upload, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  seminarId: string;
  detail: any;
}

export function ThesisSeminarAudiencePanel({ seminarId, detail }: Props) {
  return (
    <div className="space-y-6">
      {/* 1. Admin Management View */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold px-1">Manajemen Admin (Import/Export/Manage)</h3>
        <AdminAudienceContent seminarId={seminarId} detail={detail} />
      </div>

      <hr className="border-dashed" />

      {/* 2. Supervisor/Dosen Approval View */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold px-1">Persetujuan Dosen (Approve/Unapprove)</h3>
        <SupervisorAudienceContent seminarId={seminarId} />
      </div>

      <hr className="border-dashed" />

      {/* 3. General Viewer View */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold px-1">Tampilan Publik/Mahasiswa (View Only)</h3>
        <ViewerAudienceContent seminarId={seminarId} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Admin view
// ──────────────────────────────────────────────────────────────

function AdminAudienceContent({ seminarId, detail }: { seminarId: string; detail: any }) {
  const isArchived = !detail.registeredAt;
  const { data: audiences, isLoading, isFetching, refetch } = useAdminThesisSeminarAudiences(seminarId);
  const { data: studentOptions } = useAdminThesisSeminarAudienceStudentOptions(seminarId, isArchived);
  const addMutation = useAddAdminThesisSeminarAudience();
  const removeMutation = useRemoveAdminThesisSeminarAudience();
  const importMutation = useImportAdminThesisSeminarAudiences();
  const exportMutation = useExportAdminThesisSeminarAudiences();

  const [addOpen, setAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const rows = Array.isArray(audiences) ? audiences : (audiences as any)?.audiences || [];
  const isRefreshing = isFetching && !isLoading;

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

  const handleRemove = async (row: any) => {
    if (!row.studentId) return;
    try {
      await removeMutation.mutateAsync({ seminarId, studentId: row.studentId });
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Daftar Hadir (Admin) — {rows.length} Peserta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loading size="lg" text="Memuat daftar hadir admin..." />
          </div>
        ) : (
          <ThesisSeminarAudienceTable
            rows={rows}
            showAction={true}
            onUnapprove={handleRemove}
            loading={isRefreshing}
            actions={
              <div className="flex items-center gap-2">
                <RefreshButton onClick={() => refetch()} isRefreshing={isRefreshing} />
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
                    if (file) void handleImport(file);
                    e.target.value = '';
                  }}
                />
              </div>
            }
          />
        )}
      </CardContent>

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
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Supervisor view
// ──────────────────────────────────────────────────────────────

function SupervisorAudienceContent({ seminarId }: { seminarId: string }) {
  const { data: audiences, isLoading } = useSeminarAudiences(seminarId);
  const approveMutation = useApproveAudience();
  const unapproveMutation = useUnapproveAudience();

  const rows = Array.isArray(audiences) ? audiences : (audiences as any)?.audiences || [];
  const approvingStudentId = approveMutation.isPending ? approveMutation.variables?.studentId : null;
  const unapprovingStudentId = unapproveMutation.isPending ? unapproveMutation.variables?.studentId : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Daftar Hadir (Dosen Approval) — {rows.length} Peserta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loading size="lg" text="Memuat daftar hadir dosen..." />
          </div>
        ) : (
          <ThesisSeminarAudienceTable
            rows={rows}
            showAction
            approvingStudentId={approvingStudentId}
            unapprovingStudentId={unapprovingStudentId}
            onApprove={(row) => {
              if (!row.studentId) return;
              approveMutation.mutate({ seminarId, studentId: row.studentId });
            }}
            onUnapprove={(row) => {
              if (!row.studentId) return;
              unapproveMutation.mutate({ seminarId, studentId: row.studentId });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ViewerAudienceContent({ seminarId }: { seminarId: string }) {
  const { data: audiences, isLoading } = useSeminarAudiences(seminarId);
  const rows = Array.isArray(audiences) ? audiences : (audiences as any)?.audiences || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          Daftar Hadir (Viewer) — {rows.length} Peserta
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loading size="lg" text="Memuat daftar hadir viewer..." />
          </div>
        ) : (
          <ThesisSeminarAudienceTable rows={rows} />
        )}
      </CardContent>
    </Card>
  );
}
