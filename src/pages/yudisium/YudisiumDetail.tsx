import { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileDown, Eye, CheckSquare } from 'lucide-react';

import type { LayoutContext } from '@/components/layout/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DatePicker } from '@/components/ui/date-picker';
import CustomTable, { type Column } from '@/components/layout/CustomTable';
import { RefreshButton } from '@/components/ui/refresh-button';
import { YudisiumValidationFormDialog } from '@/components/yudisium/YudisiumValidationFormDialog';

import { useRole, useAuth } from '@/hooks/shared';
import { useYudisiumEvent } from '@/hooks/yudisium/useYudisium';
import { useYudisiumParticipants } from '@/hooks/yudisium/useYudisiumParticipants';
import { useExportParticipants, useFinalizeParticipants } from '@/hooks/yudisium/useYudisiumParticipants';

import { ROLES } from '@/lib/roles';
import { formatDateOnlyId } from '@/lib/text';
import type { AdminYudisiumParticipant } from '@/types/admin-yudisium.types';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  open: { label: 'Pendaftaran Dibuka', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'Pendaftaran Ditutup', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_review: { label: 'Dalam Review', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  scheduled: { label: 'Acara Terjadwalkan', className: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ongoing: { label: 'Sedang Berlangsung', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  finalized: { label: 'Finalized', className: 'bg-slate-50 text-slate-700 border-slate-200' },
  completed: { label: 'Selesai', className: 'bg-slate-100 text-slate-600 border-slate-200' },
};

const PARTICIPANT_STATUS_MAP: Record<string, { label: string; className: string }> = {
  registered: {
    label: 'Menunggu Validasi Dokumen',
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

/** Calendar day in local timezone as YYYY-MM-DD (avoids UTC shift from toISOString()). */
function toDateOnlyLocalString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse YYYY-MM-DD for DatePicker display at local noon (stable across DST). */
function parseDateOnlyLocal(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const base = ymd.split('T')[0];
  const [y, m, d] = base.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

function dateInputToISO(value: string): string {
  if (!value) return '';
  return new Date(value + 'T00:00:00.000Z').toISOString();
}

export default function YudisiumDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setBreadcrumbs, setTitle } = useOutletContext<LayoutContext>();
  const { isAdmin, isKadep, isSekdep, isKoordinatorYudisium, isDosen } = useRole();
  const { user } = useAuth();

  // Queries & Mutations
  const { data: detail, isLoading: isLoadingDetail, refetch: refetchDetail } = useYudisiumEvent(id!);
  const { 
    data: participantData, 
    isLoading: isLoadingParticipants, 
    isFetching: isFetchingParticipants, 
    refetch: refetchParticipants,
    error: participantsError
  } = useYudisiumParticipants(id!);

  const exportParticipantsMutation = useExportParticipants();
  const finalizeMutation = useFinalizeParticipants(id!);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);

  // Participant Table State
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedParticipant, setSelectedParticipant] = useState<AdminYudisiumParticipant | null>(null);

  const canFinalize = useMemo(() => {
    return isKoordinatorYudisium() && detail?.status === 'closed';
  }, [isKoordinatorYudisium, detail?.status]);

  const isFinalized = useMemo(() => {
    return (participantData?.participants ?? []).some(p => ['appointed', 'rejected'].includes(p.status));
  }, [participantData?.participants]);

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

  const columns: Column<AdminYudisiumParticipant>[] = [
    { key: 'studentName', header: 'Nama', accessor: 'studentName' },
    { key: 'studentNim', header: 'NIM', accessor: 'studentNim' },
    {
      key: 'thesisTitle',
      header: 'Judul TA',
      render: (row) => (
        <span className="text-sm line-clamp-2" title={row.thesisTitle}>
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
              title="Validasi Pendaftaran"
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
              {canFinalize && !isFinalized && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setFinalizeConfirmOpen(true)}
                  disabled={finalizeMutation.isPending}
                >
                  {finalizeMutation.isPending ? (
                    <Spinner className="mr-2 h-4 w-4" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  )}
                  Finalisasi Peserta
                </Button>
              )}
              {(isAdmin() || isDosen()) && isFinalized && (
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
              )}
              <RefreshButton
                onClick={() => void refetchParticipants()}
                isRefreshing={isFetchingParticipants && !isLoadingParticipants}
              />
            </div>
          }
        />
      </div>


      <YudisiumValidationFormDialog
        participant={selectedParticipant}
        yudisiumId={id!}
        open={!!selectedParticipant}
        onOpenChange={(open) => {
          if (!open) setSelectedParticipant(null);
        }}
      />

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
                Mahasiswa yang belum lengkap atau belum divalidasi CPL-nya akan diubah statusnya menjadi <strong>Belum Lulus</strong>.
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
