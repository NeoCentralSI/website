import { useEffect, useMemo, useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Eye, CheckSquare, FileText, Plus, Upload, Trash2 } from 'lucide-react';
import { openProtectedFile } from '@/lib/protected-file';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { YudisiumVerificationFormDialog } from '@/components/yudisium/YudisiumVerificationFormDialog';
import { YudisiumParticipantFormDialog } from '@/components/yudisium/YudisiumParticipantFormDialog';
import { YudisiumParticipantImportDialog } from '@/components/yudisium/YudisiumParticipantImportDialog';

import { useRole } from '@/hooks/shared';
import { useYudisiumEvent } from '@/hooks/yudisium/useYudisium';
import {
  useAddArchiveYudisiumParticipant,
  useArchiveYudisiumParticipantOptions,
  useDeleteArchiveYudisiumParticipant,
  useExportParticipants,
  useFinalizeParticipants,
  useImportArchiveYudisiumParticipants,
  useYudisiumParticipants,
} from '@/hooks/yudisium/useYudisiumParticipants';

import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  ongoing: { label: 'Sedang Berlangsung', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  completed: { label: 'Selesai', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: {
    label: 'Menunggu Verifikasi Dokumen',
    className: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  },
  verified: {
    label: 'Menunggu Validasi CPL',
    className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  cpl_validated: {
    label: 'Calon Peserta Yudisium',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
  },
  appointed: {
    label: 'Peserta Yudisium',
    className: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  finalized: {
    label: 'Lulus',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  rejected: {
    label: 'Belum Lulus',
    className: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
};

export default function YudisiumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isAdmin, isKoordinatorYudisium, isDosen } = useRole();

  // Queries & Mutations
  const { data: detail, isLoading: isLoadingDetail, refetch: refetchDetail } = useYudisiumEvent(id!);
  const {
    data: participantData,
    isLoading: isLoadingParticipants,
    isFetching: isFetchingParticipants,
    refetch: refetchParticipants
  } = useYudisiumParticipants(id!);

  const exportParticipantsMutation = useExportParticipants();
  const finalizeMutation = useFinalizeParticipants(id!);
  const addParticipantMutation = useAddArchiveYudisiumParticipant(id!);
  const importParticipantMutation = useImportArchiveYudisiumParticipants(id!);
  const deleteParticipantMutation = useDeleteArchiveYudisiumParticipant(id!);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [importParticipantOpen, setImportParticipantOpen] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<AdminYudisiumParticipant | null>(null);

  // Participant Table State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedParticipant, setSelectedParticipant] = useState<AdminYudisiumParticipant | null>(null);

  const canFinalize = useMemo(() => {
    return isKoordinatorYudisium() && detail?.status === 'closed';
  }, [isKoordinatorYudisium, detail?.status]);

  const isArchive = useMemo(() => {
    return !!detail && !detail.registrationOpenDate && !detail.registrationCloseDate;
  }, [detail]);

  const isFinalized = useMemo(() => {
    return !!participantData?.yudisium?.appointedAt;
  }, [participantData?.yudisium?.appointedAt]);

  const canAccessParticipantExport = useMemo(() => {
    return isAdmin() || isDosen() || isKoordinatorYudisium();
  }, [isAdmin, isDosen, isKoordinatorYudisium]);

  const canExportParticipants = useMemo(() => {
    return canAccessParticipantExport && (isFinalized || detail?.status === 'completed');
  }, [canAccessParticipantExport, detail?.status, isFinalized]);

  const {
    data: archiveParticipantOptions = [],
    isLoading: isLoadingArchiveParticipantOptions,
  } = useArchiveYudisiumParticipantOptions(id!, isKoordinatorYudisium() && isArchive);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Yudisium', href: '/yudisium' },
      { label: 'Detail' },
    ]);
    setTitle('Detail Periode Yudisium');
  }, [setBreadcrumbs, setTitle]);

  const participants = participantData?.participants ?? [];

  const filteredParticipants = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return participants;
    return participants.filter(
      (p) =>
        p.studentName.toLowerCase().includes(term) ||
        p.studentNim.toLowerCase().includes(term) ||
        (PARTICIPANT_STATUS_MAP[p.status]?.label ?? p.status).toLowerCase().includes(term)
    );
  }, [participants, search]);

  const paginatedParticipants = filteredParticipants.slice((page - 1) * pageSize, page * pageSize);

  const handleFinalize = async () => {
    try {
      await finalizeMutation.mutateAsync();
      setFinalizeConfirmOpen(false);
      void refetchDetail();
      void refetchParticipants();
    } catch {
      // Handled by toast
    }
  };

  const handleAddArchiveParticipant = async (thesisId: string) => {
    try {
      await addParticipantMutation.mutateAsync({ thesisId });
      setAddParticipantOpen(false);
      void refetchParticipants();
      void refetchDetail();
    } catch {
      // Handled by toast
    }
  };

  const handleDeleteArchiveParticipant = async () => {
    if (!participantToDelete) return;

    try {
      await deleteParticipantMutation.mutateAsync({ participantId: participantToDelete.id });
      setParticipantToDelete(null);
      void refetchParticipants();
      void refetchDetail();
    } catch {
      // Handled by toast
    }
  };

  const handleImportArchiveParticipants = async (file: File) => {
    const result = await importParticipantMutation.mutateAsync({ file });
    void refetchParticipants();
    void refetchDetail();
    return result;
  };

  const columns: Column<AdminYudisiumParticipant>[] = [
    { key: 'studentName', header: 'Nama', accessor: 'studentName' },
    { key: 'studentNim', header: 'NIM', accessor: 'studentNim' },
    {
      key: 'thesisTitle',
      header: 'Judul Tugas Akhir',
      width: '36rem',
      className: 'max-w-[36rem]',
      render: (row) => (
        <span
          className="block max-w-[36rem] whitespace-normal break-words text-sm leading-snug line-clamp-2"
          title={row.thesisTitle}
        >
          {row.thesisTitle || '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const s = PARTICIPANT_STATUS_MAP[row.status] || PARTICIPANT_STATUS_MAP.registered;
        return (
          <Badge variant="outline" className={s.className}>
            {s.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Aksi',
      className: 'text-right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          {isAdmin() && row.status === 'registered' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => setSelectedParticipant(row)}
              title="Verifikasi Pendaftaran"
            >
              <CheckSquare className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-primary"
            onClick={() => navigate(`/yudisium/${id}/peserta/${row.id}`)}
            title="Detail"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {isKoordinatorYudisium() && isArchive && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setParticipantToDelete(row)}
              disabled={deleteParticipantMutation.isPending}
              title="Hapus Peserta"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoadingDetail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <Loading size="lg" text="Memuat detail yudisium..." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-muted-foreground text-center">
          <p>Periode yudisium tidak ditemukan.</p>
          <Button variant="link" onClick={() => navigate('/yudisium')}>Kembali</Button>
        </div>
      </div>
    );
  }

  const s = STATUS_MAP[detail.status] || STATUS_MAP.draft;

  return (
    <div className="p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/yudisium')} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{detail.name}</h1>
            <p className="text-muted-foreground">Detail Periode Yudisium</p>
          </div>
        </div>

        <Badge variant="outline" className={s.className}>
          {s.label}
        </Badge>
      </div>

      <div className="space-y-6">
        {/* Peserta Section */}
        <CustomTable
          columns={columns}
          data={paginatedParticipants}
          loading={isLoadingParticipants}
          isRefreshing={isFetchingParticipants && !isLoadingParticipants}
          total={filteredParticipants.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          searchValue={search}
          onSearchChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          emptyText="Belum ada peserta yudisium"
          actions={
            <div className="flex items-center gap-2">
              {canExportParticipants && (
                <>
                  {detail.decreeDocument?.filePath && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => {
                        const decreeFilePath = detail.decreeDocument?.filePath;
                        if (decreeFilePath) {
                          openProtectedFile(decreeFilePath);
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Lihat SK
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => exportParticipantsMutation.mutate(detail.id)}
                    disabled={exportParticipantsMutation.isPending}
                  >
                    {exportParticipantsMutation.isPending ? (
                      <Spinner className="mr-2 h-4 w-4" />
                    ) : (
                      <FileDown className="mr-2 h-4 w-4" />
                    )}
                    Export Peserta
                  </Button>
                </>
              )}
              {isKoordinatorYudisium() && isArchive && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setImportParticipantOpen(true)}
                    disabled={importParticipantMutation.isPending}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Import Excel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setAddParticipantOpen(true)}
                    disabled={addParticipantMutation.isPending}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </>
              )}
              {canFinalize && !isFinalized && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8 gap-1.5 px-3 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setFinalizeConfirmOpen(true)}
                  disabled={finalizeMutation.isPending}
                >
                  {finalizeMutation.isPending ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5" />
                  )}
                  Finalisasi Peserta
                </Button>
              )}
              <RefreshButton
                onClick={() => void refetchParticipants()}
                isRefreshing={isFetchingParticipants && !isLoadingParticipants}
              />
            </div>
          }
        />
      </div>


      <YudisiumVerificationFormDialog
        participant={selectedParticipant}
        yudisiumId={id!}
        open={!!selectedParticipant}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipant(null);
        }}
      />

      <YudisiumParticipantFormDialog
        open={addParticipantOpen}
        onOpenChange={setAddParticipantOpen}
        thesisOptions={archiveParticipantOptions}
        isLoading={isLoadingArchiveParticipantOptions}
        isPending={addParticipantMutation.isPending}
        onSubmit={handleAddArchiveParticipant}
      />

      <YudisiumParticipantImportDialog
        open={importParticipantOpen}
        onOpenChange={setImportParticipantOpen}
        onImport={handleImportArchiveParticipants}
        isImporting={importParticipantMutation.isPending}
      />

      <Dialog open={!!participantToDelete} onOpenChange={(open) => !open && setParticipantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Peserta Yudisium</DialogTitle>
            <DialogDescription>
              Peserta {participantToDelete?.studentName} akan dihapus dari arsip yudisium ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setParticipantToDelete(null)}
              disabled={deleteParticipantMutation.isPending}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteArchiveParticipant}
              disabled={deleteParticipantMutation.isPending}
            >
              {deleteParticipantMutation.isPending ? 'Menghapus...' : 'Hapus Peserta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={finalizeConfirmOpen} onOpenChange={setFinalizeConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Finalisasi Peserta</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin memfinalisasi data peserta? Tindakan ini akan secara otomatis:
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="flex gap-3 items-start p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <p className="text-sm text-indigo-900">
                Mahasiswa dengan status <strong>Calon Peserta Yudisium</strong> akan diubah menjadi <strong>Peserta Yudisium</strong>.
              </p>
            </div>
            <div className="flex gap-3 items-start p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <p className="text-sm text-amber-900">
                Mahasiswa yang persyaratannya belum lengkap atau belum divalidasi CPL-nya akan diubah statusnya menjadi <strong>Belum Lulus</strong>.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFinalizeConfirmOpen(false)}>
              Batal
            </Button>
            <Button
              variant="default"
              className="bg-primary hover:bg-primary/90"
              onClick={handleFinalize}
              disabled={finalizeMutation.isPending}
            >
              {finalizeMutation.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Memproses...
                </>
              ) : (
                'Ya, Finalisasi Sekarang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
